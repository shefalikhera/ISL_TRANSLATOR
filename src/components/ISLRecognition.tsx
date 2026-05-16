import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  CornerDownLeft,
  Delete,
  Image as ImageIcon,
  Send,
  Volume2,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildSuggestions } from "@/data/isl-sign-suggestions";
import { getMirroredWebcamScreenshot } from "@/lib/mirrored-webcam-capture";
import { speakText } from "@/lib/isl-speech";
import { cn } from "@/lib/utils";

const WS_URL =
  import.meta.env.VITE_WS_PREDICT_URL ?? "ws://127.0.0.1:5000/ws/predict";

// Match original bi-directional client bundle for consistent landmark tracking.
const MEDIAPIPE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const HAND_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type ConnectionStatus = "Initializing" | "Connected" | "Disconnected";

interface PredictionResult {
  sign: string;
  confidence: number;
}

interface PredictWsMessage {
  predictions: PredictionResult[];
  hand_detected: string;
  confidence: number;
  image: string | null;
  error?: string;
}

const PHRASE_AUTOCOMPLETE: Array<{ match: string[]; output: string; speak: string }> = [
  { match: ["I AM OKA", "I AM OK"], output: "I am okay ", speak: "I am okay" },
  { match: ["HOW ARE YO", "HOW ARE Y"], output: "How are you ", speak: "How are you" },
  { match: ["GOOD MORNIN", "GOOD MORNI"], output: "Good morning ", speak: "Good morning" },
];

export default function ISLRecognition() {
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [accumulatedText, setAccumulatedText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("Initializing");
  const [mediaPipeStatus, setMediaPipeStatus] = useState("Loading hand tracking…");
  const [removeBg, setRemoveBg] = useState(false);
  const [processedImg, setProcessedImg] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isProcessing = useRef(false);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const isLocked = useRef(false);
  const lastSignRef = useRef("");
  const lastActionTime = useRef(Date.now());
  const lastFrameTime = useRef(0);
  const removeBgRef = useRef(removeBg);

  useEffect(() => {
    removeBgRef.current = removeBg;
    if (!removeBg) {
      setProcessedImg(null);
    }
  }, [removeBg]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setMediaPipeStatus("Loading hand tracking…");
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: HAND_LANDMARKER_MODEL,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setMediaPipeStatus("Hand tracking ready");
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setMediaPipeStatus(`Hand tracking error: ${message}`);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      landmarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      if (closed) return;

      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => setStatus("Connected");

      socket.onclose = () => {
        setStatus("Disconnected");
        if (!closed) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => setStatus("Disconnected");

      socket.onmessage = (event) => {
        isProcessing.current = false;

        let data: PredictWsMessage;
        try {
          data = JSON.parse(event.data) as PredictWsMessage;
        } catch {
          return;
        }

        if (data.error) {
          setMediaPipeStatus(data.error);
          return;
        }

        const hasPrediction = data.predictions?.length > 0;

        if (hasPrediction) {
          const res = data.predictions[0];

          if (res.sign !== lastSignRef.current) {
            isLocked.current = false;
            lastSignRef.current = res.sign;
          }

          setPrediction(res.sign);
          setConfidence(res.confidence);

          const now = Date.now();
          if (
            res.confidence >= 0.1 &&
            !isLocked.current &&
            now - lastActionTime.current > 300 // Reduced from 700ms for "Quick" recognition
          ) {
            setAccumulatedText((prev) => {
              speakText(res.sign);
              lastActionTime.current = now;
              return prev + res.sign;
            });
            isLocked.current = true;
          }
        } else {
          setPrediction("");
          setConfidence(0);
          isLocked.current = false;
          lastSignRef.current = "";
        }

        setProcessedImg(data.image ?? null);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSuggestions(buildSuggestions(accumulatedText));
    }, 500);
    return () => clearInterval(id);
  }, [accumulatedText]);

  useEffect(() => {
    const id = setInterval(() => {
      const silenceDuration = Date.now() - lastActionTime.current;

      if (accumulatedText.length > 0) {
        const up = accumulatedText.trim().toUpperCase();
        for (const rule of PHRASE_AUTOCOMPLETE) {
          if (rule.match.includes(up)) {
            setAccumulatedText(rule.output);
            speakText(rule.speak);
            lastActionTime.current = Date.now();
            return;
          }
        }
      }

      if (accumulatedText.trim().length > 0 && silenceDuration > 6000) {
        speakText(accumulatedText.trim().toLowerCase());
        lastActionTime.current = Date.now();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [accumulatedText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setAccumulatedText((p) => {
          const trimmed = p.trim();
          const lastWord = trimmed.split(/\s+/).pop() || "";
          if (lastWord) speakText(lastWord);
          return p.endsWith(" ") ? p : `${trimmed} `;
        });
        lastActionTime.current = Date.now();
        return;
      }
      if (e.key === "Enter") {
        setAccumulatedText("");
        lastActionTime.current = Date.now();
        return;
      }
      if (e.key === "Backspace") {
        setAccumulatedText((p) => p.slice(0, -1));
        lastActionTime.current = Date.now();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const processFrame = useCallback(() => {
    const landmarker = landmarkerRef.current;
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;

    if (landmarker && video?.readyState === 4 && canvas) {
      const nowTime = performance.now();
      if (nowTime - lastFrameTime.current < 40) { // Increased from 10fps (100ms) to 25fps (40ms)
        requestAnimationFrame(processFrame);
        return;
      }
      lastFrameTime.current = nowTime;

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const result = landmarker.detectForVideo(video, nowTime);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const hasLandmarks = Boolean(result.landmarks?.length);

        if (hasLandmarks) {
          const drawingUtils = new DrawingUtils(ctx);
          for (const landmarks of result.landmarks!) {
            drawingUtils.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS,
              { color: "#3B82F6", lineWidth: 4 }
            );
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FFFFFF",
              lineWidth: 1,
              radius: 5,
            });
          }
        } else {
          setPrediction("");
          setConfidence(0);
          isLocked.current = false;
        }

        // Mirrored capture matches overlay; when BG off, still send without hands for full-black preview.
        const shouldSendFrame = hasLandmarks || removeBgRef.current;
        if (
          shouldSendFrame &&
          wsRef.current?.readyState === WebSocket.OPEN &&
          !isProcessing.current
        ) {
          isProcessing.current = true;
          const src = getMirroredWebcamScreenshot(webcamRef.current);
          if (src) {
            console.log("DEBUG WS: Sending frame to backend");
            wsRef.current.send(
              JSON.stringify({ image: src, removeBg: removeBgRef.current })
            );
            // Safety timeout to prevent hangs if server doesn't respond
            setTimeout(() => {
              if (isProcessing.current) {
                console.warn("DEBUG WS: Resetting isProcessing due to timeout");
                isProcessing.current = false;
              }
            }, 1000);
          } else {
            console.warn("DEBUG WS: Failed to capture screenshot");
            isProcessing.current = false;
          }
        }
      }
    }

    requestAnimationFrame(processFrame);
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(frameId);
  }, [processFrame]);

  const applySuggestion = (s: string) => {
    setAccumulatedText((prev) => {
      const trimmed = prev.trim();
      const words = trimmed.split(/\s+/);
      const lastWord = words[words.length - 1] ?? "";

      if (lastWord && s.toUpperCase().startsWith(lastWord.toUpperCase())) {
        words.pop();
        const base = words.join(" ");
        return `${base ? `${base} ` : ""}${s} `;
      }

      return `${trimmed ? `${trimmed} ` : ""}${s} `;
    });
    speakText(s);
    lastActionTime.current = Date.now();
  };

  const connected = status === "Connected";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 font-semibold",
              connected
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-destructive/30 bg-destructive/10 text-destructive animate-pulse"
            )}
          >
            {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {status === "Connected" ? "Recognition online" : status}
          </Badge>
          <span className="text-xs text-muted-foreground">{mediaPipeStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="glass-card-elevated gradient-border relative min-h-[320px] overflow-hidden rounded-2xl border border-border/50 bg-black lg:min-h-[420px]">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            screenshotFormat="image/webp"
            className={cn(
              "absolute inset-0 h-full w-full object-contain",
              removeBg && "opacity-0 pointer-events-none"
            )}
          />
          {removeBg && (
            <>
              <div className="absolute inset-0 z-[1] bg-black" aria-hidden />
              {processedImg ? (
                <img
                  src={`data:image/webp;base64,${processedImg}`}
                  alt=""
                  className="absolute inset-0 z-[1] h-full w-full object-contain pointer-events-none bg-black"
                />
              ) : null}
            </>
          )}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-[2] h-full w-full pointer-events-none"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-4 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Live sign
                </p>
                <p className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-none">
                  {prediction || "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={removeBg ? "default" : "secondary"}
                  className="gap-2 rounded-xl"
                  onClick={() => setRemoveBg((v) => !v)}
                >
                  <ImageIcon className="h-4 w-4" />
                  {removeBg ? "BG off" : "BG on"}
                </Button>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Confidence
                  </p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {(confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-card-elevated gradient-border relative flex flex-1 flex-col justify-center rounded-2xl border border-border/50 p-6 sm:p-8 min-h-[220px]">
            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <Volume2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Transcription
              </span>
            </div>
            <p className="text-2xl sm:text-4xl font-light leading-snug text-foreground break-words pr-2">
              {accumulatedText || (
                <span className="text-muted-foreground/40 italic">
                  Show a sign to the camera…
                </span>
              )}
            </p>

            <div className="absolute right-4 bottom-4 flex gap-2 sm:right-6 sm:bottom-6">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11 rounded-xl border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20"
                title="Clear line (Enter)"
                onClick={() => {
                  setAccumulatedText("");
                  lastActionTime.current = Date.now();
                }}
              >
                <CornerDownLeft className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11 rounded-xl"
                title="Add space"
                onClick={() => {
                  setAccumulatedText((p) => `${p.trimEnd()} `);
                  lastActionTime.current = Date.now();
                }}
              >
                <Send className="h-4 w-4 text-primary" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-11 w-11 rounded-xl border-destructive/30 bg-destructive/10 hover:bg-destructive/20"
                title="Backspace"
                onClick={() => {
                  setAccumulatedText((p) => p.slice(0, -1));
                  lastActionTime.current = Date.now();
                }}
              >
                <Delete className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-border/50 p-5 sm:p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">
              Suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-xl text-xs font-bold uppercase tracking-wide"
                  onClick={() => applySuggestion(s)}
                >
                  {s}
                </Button>
              ))}
              {suggestions.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-1">
                  Sign letters or words to see phrase suggestions
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
