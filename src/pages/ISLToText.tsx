import { Hand, Sparkles } from "lucide-react";
import ISLRecognition from "@/components/ISLRecognition";

export default function ISLToText() {
  return (
    <div className="bg-background font-sans relative overflow-hidden min-h-full">
      <div className="float-orb w-72 h-72 bg-primary/40 top-[-80px] right-[-60px]" />
      <div
        className="float-orb w-56 h-56 bg-accent/30 bottom-20 left-[-40px]"
        style={{ animation: "float-drift-reverse 10s ease-in-out infinite alternate" }}
      />

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8 relative z-10">
        <section className="animate-fade-up text-center py-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Gesture Recognition
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              ISL → Text & Speech
            </span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed flex items-center justify-center gap-2">
            <Hand className="h-4 w-4 text-primary shrink-0" />
            Sign to the camera — see live transcription and hear words spoken aloud.
          </p>
        </section>

        <ISLRecognition />
      </div>
    </div>
  );
}
