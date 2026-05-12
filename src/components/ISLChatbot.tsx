import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Mic, MicOff, VolumeX, Globe } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s/gm, "")
    .replace(/^\s*\d+\.\s/gm, "")
    .replace(/[>~|]/g, "")
    .trim();
}

export default function ISLChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your ISL assistant. Ask me anything about Indian Sign Language! 🤟" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [lang]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      const userMsg: Msg = { role: "user", content: text.trim() };
      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setIsLoading(true);
      let assistantSoFar = "";
      try {
        const CHAT_URL = `http://localhost:5000/isl-chat`;
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            messages: allMessages,
            lang: lang
          }),
        });
        
        if (!resp.ok) throw new Error("Failed to get response");
        
        const data = await resp.json();
        assistantSoFar = data.reply || "";
        
        if (assistantSoFar) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && prev.length === allMessages.length + 1) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        }

        if (assistantSoFar) speak(assistantSoFar);
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: lang === "hi" ? "क्षमा करें, जवाब नहीं मिला। कृपया पुनः प्रयास करें।" : "Sorry, I couldn't respond. Please try again." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, speak, lang]
  );

  const toggleListening = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; setIsListening(false); sendMessage(transcript); };
    recognition.onerror = (e: any) => { console.error("Speech error:", e.error); if (e.error === "not-allowed") alert("Microphone access denied."); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening, sendMessage, lang]);

  const toggleLang = () => {
    const newLang = lang === "en" ? "hi" : "en";
    setLang(newLang);
    setMessages([{
      role: "assistant",
      content: newLang === "hi"
        ? "नमस्ते! मैं आपका ISL सहायक हूँ। भारतीय सांकेतिक भाषा के बारे में कुछ भी पूछें! 🤟"
        : "Hi! I'm your ISL assistant. Ask me anything about Indian Sign Language! 🤟",
    }]);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open ISL chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[520px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[hsl(180,65%,40%)] to-[hsl(180,70%,32%)]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">ISL Assistant</p>
                <p className="text-xs text-white/70">
                  {lang === "hi" ? "भारतीय सांकेतिक भाषा" : "Indian Sign Language"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleLang} className="h-8 w-8 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/15" title={lang === "en" ? "Switch to Hindi" : "Switch to English"}>
                <span className="text-xs font-bold">{lang === "en" ? "हि" : "EN"}</span>
              </Button>
              {isSpeaking && (
                <Button variant="ghost" size="icon" onClick={stopSpeaking} className="h-8 w-8 rounded-lg text-red-300 hover:text-red-200 hover:bg-white/15">
                  <VolumeX className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => { stopSpeaking(); setOpen(false); }} className="h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/15">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">
                  <span className="animate-pulse">{lang === "hi" ? "सोच रहा हूँ..." : "Thinking..."}</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-2 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleListening}
              className={`h-8 w-8 rounded-lg shrink-0 ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}
              aria-label={isListening ? "Stop listening" : "Voice input"}>
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder={lang === "hi" ? "ISL के बारे में पूछें..." : "Ask about ISL..."}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              disabled={isLoading}
            />
            <Button variant="ghost" size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="h-8 w-8 rounded-lg shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
