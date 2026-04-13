import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Languages, Mic, MicOff, Loader2, Hand, Sparkles, ArrowRight, Zap, Eye, Keyboard } from "lucide-react";
import islDataset from "@/data/isl-dataset.json";
import { addWordToHistory } from "@/pages/WordHistory";

interface WordEntry {
  word: string;
  video_id: string;
  start_time: number;
  end_time: number;
}

const dataset: WordEntry[] = islDataset as WordEntry[];

function lookupWord(word: string): WordEntry | null {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  return dataset.find((e) => e.word === clean) || null;
}

type WordStatus = "pending" | "active" | "done";

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => resolve();
  });
}

export default function ISLTranslator() {
  const [inputText, setInputText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [missingWord, setMissingWord] = useState<string | null>(null);
  const [hasConverted, setHasConverted] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [inputLang, setInputLang] = useState<"en" | "hi">("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const abortRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentStartedRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const clearPlaybackTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };
  const resolvePendingPlayback = () => {
    const pendingResolve = resolveRef.current;
    resolveRef.current = null;
    if (pendingResolve) pendingResolve();
  };
  const interruptPlayback = () => {
    abortRef.current = true;
    segmentStartedRef.current = false;
    clearPlaybackTimer();
    resolvePendingPlayback();
  };

  useEffect(() => { loadYouTubeAPI().then(() => setApiReady(true)); }, []);

  useEffect(() => {
    if (!apiReady || !containerRef.current || playerRef.current) return;
    playerRef.current = new (window as any).YT.Player("yt-player", {
      width: "100%", height: "100%",
      playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, showinfo: 0, fs: 0, iv_load_policy: 3, playsinline: 1 },
      events: {
        onStateChange: (event: any) => {
          const yt = (window as any).YT;
          if (event.data === yt?.PlayerState?.PLAYING) segmentStartedRef.current = true;
          if (event.data === yt?.PlayerState?.ENDED && resolveRef.current && segmentStartedRef.current) {
            segmentStartedRef.current = false;
            resolvePendingPlayback();
          }
        },
      },
    });
  }, [apiReady, hasConverted]);

  const playVideo = useCallback(
    (entry: WordEntry): Promise<void> => {
      return new Promise((resolve, reject) => {
        const player = playerRef.current;
        if (!player || !player.loadVideoById) return reject();
        clearPlaybackTimer();
        segmentStartedRef.current = false;
        resolveRef.current = () => { clearPlaybackTimer(); resolve(); };
        player.loadVideoById({ videoId: entry.video_id, startSeconds: entry.start_time });
        player.setPlaybackRate(playbackSpeed);
        if (entry.end_time > entry.start_time) {
          timerRef.current = setInterval(() => {
            try {
              if (!segmentStartedRef.current || !resolveRef.current) return;
              const current = player.getCurrentTime();
              if (current >= entry.end_time - 0.05) {
                player.pauseVideo();
                segmentStartedRef.current = false;
                resolvePendingPlayback();
              }
            } catch {}
          }, 50);
        }
      });
    },
    [playbackSpeed]
  );

  const playSequence = useCallback(
    async (wordList: string[], startFrom = 0) => {
      abortRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);
      setMissingWord(null);
      for (let i = startFrom; i < wordList.length; i++) {
        if (abortRef.current) break;
        const entry = lookupWord(wordList[i]);
        setCurrentIndex(i);
        if (!entry) {
          const letters = wordList[i].toLowerCase().replace(/[^a-z]/g, "").split("");
          for (let li = 0; li < letters.length; li++) {
            if (abortRef.current) break;
            setMissingWord(`spelling "${wordList[i]}": ${letters.map((c, ci) => ci === li ? c.toUpperCase() : c).join("")}`);
            const letterEntry = lookupWord(letters[li]);
            if (letterEntry) {
              try {
                if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
                await new Promise((r) => setTimeout(r, 150));
                await playVideo(letterEntry);
              } catch { continue; }
            }
          }
          setMissingWord(null);
          continue;
        }
        try { await playVideo(entry); } catch { continue; }
      }
      setIsPlaying(false);
      if (!abortRef.current) setCurrentIndex(-1);
    },
    [playVideo]
  );

  const toggleListening = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition is not supported in this browser."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = inputLang === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) setInputText((prev) => (prev ? prev + " " + finalTranscript : finalTranscript));
    };
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      if (e.error === "not-allowed") alert("Microphone access denied.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const translateHindiToEnglish = async (hindiText: string): Promise<string> => {
    const TRANSLATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-hindi`;
    const resp = await fetch(TRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ text: hindiText }),
    });
    if (!resp.ok) throw new Error("Translation failed");
    const data = await resp.json();
    return data.translation || hindiText;
  };

  const handleConvert = async () => {
    let textToProcess = inputText.trim();
    if (!textToProcess) return;
    setTranslatedText(null);
    if (inputLang === "hi") {
      setIsTranslating(true);
      try { textToProcess = await translateHindiToEnglish(textToProcess); setTranslatedText(textToProcess); }
      catch (err) { console.error("Translation error:", err); setIsTranslating(false); return; }
      setIsTranslating(false);
    }
    const parsed = textToProcess.split(/\s+/).filter((w) => w.length > 0);
    if (parsed.length === 0) return;
    parsed.forEach((w) => addWordToHistory(w));
    interruptPlayback();
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
    setWords(parsed);
    setHasConverted(true);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handlePlay = () => {
    if (isPaused && playerRef.current) { playerRef.current.playVideo(); setIsPaused(false); return; }
    playSequence(words, currentIndex > 0 ? currentIndex : 0);
  };
  const handlePause = () => {
    if (playerRef.current && isPlaying) { playerRef.current.pauseVideo(); setIsPaused(true); }
  };
  const handleReset = () => {
    interruptPlayback();
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
    setCurrentIndex(-1); setIsPlaying(false); setIsPaused(false); setMissingWord(null);
  };
  const handleWordClick = (index: number) => {
    interruptPlayback();
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
    setTimeout(() => playSequence(words, index), 150);
  };
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current?.setPlaybackRate) playerRef.current.setPlaybackRate(speed);
  };
  const getWordStatus = (index: number): WordStatus => {
    if (currentIndex === -1) return "pending";
    if (index < currentIndex) return "done";
    if (index === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="bg-background font-sans relative overflow-hidden">
      {/* Floating orbs for depth */}
      <div className="float-orb w-72 h-72 bg-primary/40 top-[-80px] right-[-60px]" />
      <div className="float-orb w-56 h-56 bg-accent/30 bottom-20 left-[-40px]" style={{ animation: "float-drift-reverse 10s ease-in-out infinite alternate" }} />

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8 relative z-10">

        {/* Hero welcome when not converted */}
        {!hasConverted && (
          <section className="animate-fade-up text-center py-6">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-5">
              <Sparkles className="h-3.5 w-3.5" /> ISL Translation Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Translate words into <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Indian Sign Language
              </span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Type or speak in English or Hindi — watch each word come alive as ISL video signs.
            </p>

            {/* 3D How it works cards */}
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-xl mx-auto">
              {[
                { icon: Keyboard, title: "Type or Speak", desc: "English or Hindi input" },
                { icon: Zap, title: "Auto Translate", desc: "Word-by-word matching" },
                { icon: Eye, title: "Watch ISL", desc: "Sequential video signs" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-card tilt-card gradient-border rounded-2xl p-4 text-center space-y-2"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="mx-auto h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Input Section */}
        <section className="animate-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="glass-card-elevated gradient-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="sentence-input" className="block text-sm font-bold text-foreground">
                {inputLang === "hi" ? "हिंदी में वाक्य लिखें" : "Enter your sentence"}
              </label>
              <button
                onClick={() => setInputLang(inputLang === "en" ? "hi" : "en")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 active:scale-95"
              >
                <Languages className="h-3.5 w-3.5" />
                {inputLang === "en" ? "हि Hindi" : "EN English"}
              </button>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  id="sentence-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConvert()}
                  placeholder={inputLang === "hi" ? "जैसे: वह सुबह खाना खाती है" : "e.g. she eat food morning"}
                  className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all backdrop-blur-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg h-8 w-8 ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={handleConvert}
                disabled={!inputText.trim() || isTranslating}
                size="lg"
                className="rounded-xl px-6 font-bold active:scale-[0.97] transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
              >
                {isTranslating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Translating...</>
                ) : (
                  <><ArrowRight className="h-4 w-4 mr-1" /> {inputLang === "hi" ? "हिंदी → ISL" : "Convert"}</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {inputLang === "hi"
                ? `हिंदी में लिखें — अंग्रेजी में अनुवाद होकर ISL वीडियो दिखेगा`
                : `${dataset.length} words available · try: hello, mother, father, school, love, eat, morning`}
            </p>
          </div>
        </section>

        {/* Words Bar */}
        {hasConverted && words.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            {translatedText && (
              <div className="mb-3 glass-card rounded-xl px-4 py-2.5 text-sm border-primary/20">
                <span className="font-bold text-primary">English Translation:</span>{" "}
                <span className="text-foreground">{translatedText}</span>
              </div>
            )}
            <p className="text-sm font-semibold text-muted-foreground mb-3">Words · click any word to jump</p>
            <div className="flex flex-wrap gap-2">
              {words.map((w, i) => {
                const status = getWordStatus(i);
                const found = !!lookupWord(w);
                return (
                  <button
                    key={i}
                    onClick={() => handleWordClick(i)}
                    className={`
                      relative rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-200
                      active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      ${
                        status === "active"
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                          : status === "done"
                          ? "bg-secondary text-secondary-foreground"
                          : found
                          ? "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer hover:scale-105"
                          : "bg-primary/10 text-primary cursor-pointer italic hover:scale-105"
                      }
                    `}
                  >
                    {w}
                    {status === "active" && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Video Player */}
        {hasConverted && (
          <section className="animate-fade-up" style={{ animationDelay: "160ms" }}>
            <div className="glass-card-elevated gradient-border rounded-2xl overflow-hidden">
              <div ref={containerRef} className="relative aspect-video bg-foreground/5">
                <div id="yt-player" className="w-full h-full" />
                {!isPlaying && currentIndex === -1 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/90 backdrop-blur-md z-10">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <Play className="h-7 w-7 text-primary ml-1" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Press play to start ISL translation</p>
                  </div>
                )}
                {isPlaying && currentIndex >= 0 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-foreground/80 text-background px-5 py-2 rounded-xl text-sm font-bold backdrop-blur-md z-10 pointer-events-none shadow-lg">
                    {missingWord ? `✋ ${missingWord}` : words[currentIndex]}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
                <div className="flex items-center gap-2">
                  {!isPlaying || isPaused ? (
                    <Button variant="ghost" size="icon" onClick={handlePlay} disabled={words.length === 0} className="rounded-lg active:scale-95 hover:bg-primary/10">
                      <Play className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={handlePause} className="rounded-lg active:scale-95 hover:bg-primary/10">
                      <Pause className="h-5 w-5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleReset} className="rounded-lg active:scale-95 hover:bg-primary/10">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Speed</span>
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`rounded-md px-2 py-0.5 text-xs font-bold transition-all active:scale-95 ${
                        playbackSpeed === s
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
