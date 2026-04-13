import { Hand, Mic } from "lucide-react";

export default function ISLToText() {
  return (
    <div className="font-sans bg-background min-h-full relative overflow-hidden">
      <div className="float-orb w-64 h-64 bg-primary/30 top-[-60px] right-[-40px]" />
      <div className="float-orb w-48 h-48 bg-accent/20 bottom-40 left-[-30px]" style={{ animation: "float-drift-reverse 9s ease-in-out infinite alternate" }} />

      <div className="mx-auto max-w-3xl px-6 py-16 relative z-10 text-center space-y-8">
        <div className="glass-card gradient-border rounded-2xl p-12 space-y-6">
          <div className="h-20 w-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <Hand className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground">ISL → Text / Speech</h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            This feature will convert Indian Sign Language gestures captured via camera into text and speech output.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Mic className="h-4 w-4" />
            <span className="font-semibold">Coming Soon</span>
          </div>
          <div className="h-px bg-border/50 w-1/2 mx-auto" />
          <p className="text-xs text-muted-foreground/70">
            The gesture recognition module will be integrated here. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}
