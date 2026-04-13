import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LangContext";
import { History, Trash2, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WordRecord {
  word: string;
  count: number;
  lastUsed: number;
}

const STORAGE_KEY = "beyond-word-history";

export function addWordToHistory(word: string) {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean || clean.length < 2) return;
  const data: Record<string, WordRecord> = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  data[clean] = { word: clean, count: (data[clean]?.count || 0) + 1, lastUsed: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearWordHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function WordHistory() {
  const { t } = useLang();
  const [words, setWords] = useState<WordRecord[]>([]);

  useEffect(() => { loadWords(); }, []);

  const loadWords = () => {
    const data: Record<string, WordRecord> = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const sorted = Object.values(data).sort((a, b) => b.count - a.count);
    setWords(sorted);
  };

  const handleClear = () => {
    clearWordHistory();
    setWords([]);
    toast.success(t("Word history cleared", "शब्द इतिहास हटाया गया"));
  };

  const topWords = words.slice(0, 20);
  const totalTranslations = words.reduce((sum, w) => sum + w.count, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 relative overflow-hidden">
      <div className="float-orb w-52 h-52 bg-accent/25 top-[-40px] right-[-30px]" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <History className="h-6 w-6 text-primary" /> {t("Word History", "शब्द इतिहास")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("Your most frequently translated words", "आपके सबसे अधिक अनुवादित शब्द")}</p>
          </div>
          {words.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClear} className="rounded-xl active:scale-95">
              <Trash2 className="h-4 w-4 mr-1" /> {t("Clear", "हटाएं")}
            </Button>
          )}
        </div>

        {/* Stats */}
        {words.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card gradient-border rounded-2xl p-4 text-center">
              <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-foreground">{words.length}</p>
              <p className="text-xs text-muted-foreground">{t("Unique Words", "अद्वितीय शब्द")}</p>
            </div>
            <div className="glass-card gradient-border rounded-2xl p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-foreground">{totalTranslations}</p>
              <p className="text-xs text-muted-foreground">{t("Total Translations", "कुल अनुवाद")}</p>
            </div>
          </div>
        )}

        {/* Word List */}
        {topWords.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-3">
            <History className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground font-medium">{t("No words translated yet", "अभी तक कोई शब्द अनुवादित नहीं")}</p>
            <p className="text-xs text-muted-foreground">{t("Start translating to build your history!", "इतिहास बनाने के लिए अनुवाद शुरू करें!")}</p>
          </div>
        ) : (
          <div className="glass-card gradient-border rounded-2xl divide-y divide-border/30 overflow-hidden">
            {topWords.map((w, i) => (
              <div key={w.word} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-6 text-right">#{i + 1}</span>
                  <span className="font-semibold text-foreground">{w.word}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden w-24">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (w.count / topWords[0].count) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium w-8 text-right">{w.count}×</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
