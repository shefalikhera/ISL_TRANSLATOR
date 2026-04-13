import { useState } from "react";
import { Settings, Languages, Trash2, Info, Volume2, Eye, Bell, Accessibility, Monitor, Smartphone, History } from "lucide-react";
import { clearWordHistory } from "@/pages/WordHistory";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : ""}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { lang, setLang, t } = useLang();
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem("beyond-auto-speak") !== "false");
  const [playbackSpeed, setPlaybackSpeed] = useState(() => Number(localStorage.getItem("beyond-speed")) || 1);
  const [fingerSpell, setFingerSpell] = useState(() => localStorage.getItem("beyond-fingerspell") !== "false");
  const [showSubtitles, setShowSubtitles] = useState(() => localStorage.getItem("beyond-subtitles") !== "false");
  const [autoPlay, setAutoPlay] = useState(() => localStorage.getItem("beyond-autoplay") === "true");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("beyond-contrast") === "true");

  const handleLangChange = (l: "en" | "hi") => { setLang(l); toast.success(l === "hi" ? "भाषा हिंदी में बदली गई" : "Language set to English"); };
  const handleClearData = () => {
    ["beyond-lang", "beyond-auto-speak", "beyond-speed", "beyond-fingerspell", "beyond-subtitles", "beyond-autoplay", "beyond-contrast"].forEach((k) => localStorage.removeItem(k));
    setLang("en"); setAutoSpeak(true); setPlaybackSpeed(1); setFingerSpell(true); setShowSubtitles(true); setAutoPlay(false); setHighContrast(false);
    toast.success(t("All data cleared successfully", "सारा डेटा सफलतापूर्वक हटा दिया गया"));
  };
  const toggle = (key: string, state: boolean, setter: (v: boolean) => void) => { const next = !state; setter(next); localStorage.setItem(key, String(next)); };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 relative overflow-hidden">
      <div className="float-orb w-52 h-52 bg-accent/25 top-[-40px] right-[-30px]" />
      <div className="float-orb w-36 h-36 bg-primary/20 bottom-10 left-[-20px]" style={{ animation: "float-drift-reverse 8s ease-in-out infinite alternate" }} />

      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> {t("Settings", "सेटिंग्स")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("Customize your Beyond experience.", "अपने Beyond अनुभव को अनुकूलित करें।")}</p>
        </div>

        {/* Language */}
        <div className="glass-card-elevated gradient-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2"><Languages className="h-5 w-5 text-primary" /><h2 className="font-bold text-foreground">{t("Primary Language", "प्राथमिक भाषा")}</h2></div>
          <p className="text-sm text-muted-foreground">{t("Changing language updates the entire app interface.", "भाषा बदलने से पूरा ऐप इंटरफ़ेस बदल जाएगा।")}</p>
          <div className="flex gap-3">
            {([{ key: "en" as const, label: "English", flag: "🇬🇧" }, { key: "hi" as const, label: "हिंदी", flag: "🇮🇳" }]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleLangChange(opt.key)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 active:scale-95 ${
                  lang === opt.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                <span>{opt.flag}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playback */}
        <div className="glass-card gradient-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /><h2 className="font-bold text-foreground">{t("Playback Speed", "प्लेबैक गति")}</h2></div>
          <p className="text-sm text-muted-foreground">{t("Default speed for ISL video playback.", "ISL वीडियो प्लेबैक के लिए डिफ़ॉल्ट गति।")}</p>
          <div className="flex gap-2 flex-wrap">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => { setPlaybackSpeed(s); localStorage.setItem("beyond-speed", String(s)); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
                  playbackSpeed === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="glass-card gradient-border rounded-2xl divide-y divide-border/40">
          {[
            { icon: Volume2, key: "beyond-auto-speak", state: autoSpeak, setter: setAutoSpeak, en: "Chatbot Auto-Speak", hi: "चैटबॉट ऑटो-स्पीक", descEn: "Automatically read chatbot responses aloud.", descHi: "चैटबॉट उत्तरों को स्वचालित रूप से ज़ोर से पढ़ें।" },
            { icon: Accessibility, key: "beyond-fingerspell", state: fingerSpell, setter: setFingerSpell, en: "Finger Spelling", hi: "फिंगर स्पेलिंग", descEn: "Spell out unknown words letter by letter.", descHi: "अज्ञात शब्दों को अक्षर-दर-अक्षर दिखाएं।" },
            { icon: Monitor, key: "beyond-subtitles", state: showSubtitles, setter: setShowSubtitles, en: "Show Subtitles", hi: "उपशीर्षक दिखाएं", descEn: "Display current word overlay on the video.", descHi: "वीडियो पर वर्तमान शब्द ओवरले दिखाएं।" },
            { icon: Smartphone, key: "beyond-autoplay", state: autoPlay, setter: setAutoPlay, en: "Auto-Play on Convert", hi: "कन्वर्ट पर ऑटो-प्ले", descEn: "Start playing signs immediately after converting.", descHi: "कन्वर्ट करने के बाद तुरंत चलाना शुरू करें।" },
            { icon: Bell, key: "beyond-contrast", state: highContrast, setter: setHighContrast, en: "High Contrast Words", hi: "उच्च कंट्रास्ट शब्द", descEn: "Use bolder colors for word status indicators.", descHi: "शब्द स्थिति के लिए गहरे रंगों का उपयोग करें।" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5">
              <div className="flex items-start gap-3 min-w-0">
                <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{t(item.en, item.hi)}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(item.descEn, item.descHi)}</p>
                </div>
              </div>
              <Toggle enabled={item.state} onToggle={() => toggle(item.key, item.state, item.setter)} />
            </div>
          ))}
        </div>

        {/* Delete Word History */}
        <div className="glass-card gradient-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /><h2 className="font-bold text-foreground">{t("Word History", "शब्द इतिहास")}</h2></div>
          <p className="text-sm text-muted-foreground">{t("Delete your translated word history and frequency data.", "अपना अनुवादित शब्द इतिहास और आवृत्ति डेटा हटाएं।")}</p>
          <Button variant="outline" size="sm" onClick={() => { clearWordHistory(); toast.success(t("Word history deleted", "शब्द इतिहास हटाया गया")); }} className="rounded-xl active:scale-95">
            <Trash2 className="h-4 w-4 mr-1.5" /> {t("Delete History", "इतिहास हटाएं")}
          </Button>
        </div>

        {/* Clear Data */}
        <div className="glass-card rounded-2xl p-5 space-y-4 border-destructive/30">
          <div className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" /><h2 className="font-bold text-foreground">{t("Clear All Data", "सारा डेटा हटाएं")}</h2></div>
          <p className="text-sm text-muted-foreground">{t("Reset all preferences and cached data.", "सभी प्राथमिकताएं रीसेट करें।")}</p>
          <Button variant="destructive" size="sm" onClick={() => { handleClearData(); clearWordHistory(); }} className="rounded-xl active:scale-95">
            <Trash2 className="h-4 w-4 mr-1.5" /> {t("Clear Data", "डेटा हटाएं")}
          </Button>
        </div>

        {/* About */}
        <div className="glass-card gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" /><h2 className="font-bold text-foreground">{t("About Beyond", "Beyond के बारे में")}</h2></div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              "Beyond is an Indian Sign Language translation platform that converts text and speech into ISL video signs. It supports English and Hindi input, has an AI chatbot, and a directory of 50+ deaf-friendly places across India.",
              "Beyond एक ISL अनुवाद प्लेटफ़ॉर्म है जो टेक्स्ट और स्पीच को ISL वीडियो में बदलता है।"
            )}
          </p>
          <p className="text-xs text-muted-foreground">{t("Version 1.0.0", "संस्करण 1.0.0")}</p>
        </div>
      </div>
    </div>
  );
}
