import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "hi";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (en: string, hi: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("beyond-lang") as Lang) || "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("beyond-lang", l);
  };

  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
