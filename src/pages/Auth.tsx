import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";

export default function Auth() {
  const { t } = useLang();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("Welcome back!", "वापसी पर स्वागत है!"));
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t("Check your email to verify your account!", "अपना ईमेल सत्यापित करने के लिए जांचें!"));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="float-orb w-72 h-72 bg-primary/30 top-[-80px] right-[-60px]" />
      <div className="float-orb w-56 h-56 bg-accent/20 bottom-20 left-[-40px]" style={{ animation: "float-drift-reverse 10s ease-in-out infinite alternate" }} />

      <div className="glass-card-elevated gradient-border rounded-2xl p-8 w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3 w-3" /> Beyond
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isLogin ? t("Welcome Back", "वापसी पर स्वागत") : t("Create Account", "खाता बनाएं")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? t("Sign in to manage your tutor profile", "अपनी ट्यूटर प्रोफ़ाइल प्रबंधित करें") : t("Join Beyond as a tutor or learner", "ट्यूटर या शिक्षार्थी के रूप में जुड़ें")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Full Name", "पूरा नाम")}
                className="w-full rounded-xl border border-input bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("Email", "ईमेल")}
              className="w-full rounded-xl border border-input bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("Password", "पासवर्ड")}
              className="w-full rounded-xl border border-input bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl py-3 font-bold shadow-lg shadow-primary/25">
            {loading ? "..." : (
              <><ArrowRight className="h-4 w-4 mr-1" /> {isLogin ? t("Sign In", "साइन इन") : t("Sign Up", "साइन अप")}</>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? t("Don't have an account?", "खाता नहीं है?") : t("Already have an account?", "पहले से खाता है?")}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
            {isLogin ? t("Sign Up", "साइन अप") : t("Sign In", "साइन इन")}
          </button>
        </p>
      </div>
    </div>
  );
}
