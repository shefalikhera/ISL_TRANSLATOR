import { MessageCircle, Hand, BookOpen, Lightbulb, MapPin, Mic, Video, Keyboard, Globe, Shield } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

const faqs = [
  {
    en: { q: "What is Indian Sign Language (ISL)?", a: "ISL is the primary sign language used by the deaf community in India. It has its own grammar and syntax, completely different from spoken Hindi or English. ISL uses hand gestures, facial expressions, and body movements to convey meaning." },
    hi: { q: "भारतीय सांकेतिक भाषा (ISL) क्या है?", a: "ISL भारत में बधिर समुदाय द्वारा उपयोग की जाने वाली प्राथमिक सांकेतिक भाषा है। इसका अपना व्याकरण और वाक्य रचना है, जो बोली जाने वाली हिंदी या अंग्रेजी से पूरी तरह अलग है।" },
  },
  {
    en: { q: "How does Beyond translate text to ISL?", a: "Beyond matches each word in your sentence to pre-recorded ISL video clips from a curated database. If a word isn't found, it automatically finger-spells each letter individually so no word is ever skipped." },
    hi: { q: "Beyond टेक्स्ट को ISL में कैसे बदलता है?", a: "Beyond आपके वाक्य के प्रत्येक शब्द को पहले से रिकॉर्ड किए गए ISL वीडियो क्लिप से मिलाता है। यदि कोई शब्द नहीं मिलता, तो यह स्वचालित रूप से प्रत्येक अक्षर को अलग-अलग दिखाता है।" },
  },
  {
    en: { q: "Can I use Hindi input?", a: "Yes! Type in Hindi and Beyond will first translate it to English, then display the corresponding ISL signs. You can also use voice input in Hindi." },
    hi: { q: "क्या मैं हिंदी में टाइप कर सकता हूँ?", a: "हाँ! हिंदी में टाइप करें और Beyond पहले इसे अंग्रेजी में अनुवाद करेगा, फिर संबंधित ISL संकेत दिखाएगा।" },
  },
  {
    en: { q: "How does voice input work?", a: "Click the microphone icon to start speaking. Beyond uses your browser's speech recognition to convert your voice to text in real-time. It supports both English and Hindi." },
    hi: { q: "वॉइस इनपुट कैसे काम करता है?", a: "माइक्रोफ़ोन आइकन पर क्लिक करें। Beyond आपकी आवाज़ को रीयल-टाइम में टेक्स्ट में बदलता है। यह अंग्रेजी और हिंदी दोनों का समर्थन करता है।" },
  },
  {
    en: { q: "What is gesture recognition?", a: "Beyond's companion project uses your camera to recognize hand gestures and suggests matching ISL words and sentences in real-time." },
    hi: { q: "जेस्चर रिकग्निशन क्या है?", a: "Beyond का साथी प्रोजेक्ट आपके कैमरे का उपयोग करके हाथ के इशारों को पहचानता है और रीयल-टाइम में मिलते-जुलते ISL शब्द सुझाता है।" },
  },
  {
    en: { q: "How do I find deaf-friendly places?", a: "Go to the Places section to browse institutes, cafés, NGOs and workplaces across India. Use 'Find Nearby' to detect locations close to you using GPS." },
    hi: { q: "बधिर-अनुकूल स्थान कैसे खोजें?", a: "'स्थान' अनुभाग पर जाएं। GPS का उपयोग करके नजदीकी स्थान खोजें।" },
  },
  {
    en: { q: "What does the AI chatbot do?", a: "The AI chatbot answers any question about ISL, deaf culture, sign language learning, and Beyond's features. It responds in both English and Hindi and speaks responses aloud." },
    hi: { q: "AI चैटबॉट क्या करता है?", a: "AI चैटबॉट ISL, बधिर संस्कृति और Beyond की सुविधाओं के बारे में प्रश्नों का उत्तर देता है।" },
  },
  {
    en: { q: "How many ISL signs are available?", a: "Beyond's database contains hundreds of ISL video signs including common words, greetings, family terms, emotions, actions, and all 26 English alphabet letters for finger-spelling." },
    hi: { q: "कितने ISL संकेत उपलब्ध हैं?", a: "Beyond के डेटाबेस में सैकड़ों ISL वीडियो संकेत हैं जिनमें सामान्य शब्द, अभिवादन, पारिवारिक शब्द और सभी 26 अक्षर शामिल हैं।" },
  },
  {
    en: { q: "Can I control video playback speed?", a: "Yes! Use speed controls below the video player from 0.5× to 2×. You can also set a default speed in Settings." },
    hi: { q: "क्या मैं वीडियो की गति नियंत्रित कर सकता हूँ?", a: "हाँ! वीडियो प्लेयर के नीचे 0.5× से 2× तक स्पीड कंट्रोल हैं।" },
  },
  {
    en: { q: "Is Beyond free to use?", a: "Yes, Beyond is completely free and open-source. Our mission is to make communication accessible for the deaf community across India." },
    hi: { q: "क्या Beyond मुफ़्त है?", a: "हाँ, Beyond पूरी तरह से मुफ़्त और ओपन-सोर्स है।" },
  },
];

export default function Help() {
  const { t, lang } = useLang();

  const features = [
    { icon: Hand, en: "ISL Translator", hi: "ISL अनुवादक", descEn: "Type or speak sentences and watch them translated into sign language videos.", descHi: "वाक्य टाइप करें या बोलें और उन्हें ISL वीडियो में अनुवादित होते देखें।" },
    { icon: Mic, en: "Voice Input", hi: "वॉइस इनपुट", descEn: "Speak in English or Hindi and your words are recognized and converted to ISL.", descHi: "अंग्रेजी या हिंदी में बोलें और आपके शब्द ISL में बदले जाएंगे।" },
    { icon: Video, en: "Video Playback", hi: "वीडियो प्लेबैक", descEn: "Watch ISL signs play sequentially with adjustable speed and word-by-word control.", descHi: "समायोज्य गति के साथ ISL संकेत क्रमिक रूप से देखें।" },
    { icon: Globe, en: "Hindi Support", hi: "हिंदी सहायता", descEn: "Full Hindi translation — type in Hindi and it converts to English then to ISL.", descHi: "हिंदी में टाइप करें और यह अंग्रेजी में बदलकर ISL दिखाएगा।" },
    { icon: MapPin, en: "Places Directory", hi: "स्थान निर्देशिका", descEn: "Find 50+ deaf-friendly locations across India with GPS-based nearby search.", descHi: "GPS-आधारित खोज के साथ 50+ बधिर-अनुकूल स्थान खोजें।" },
    { icon: Lightbulb, en: "AI Chatbot", hi: "AI चैटबॉट", descEn: "Ask any ISL question — the chatbot responds in text and voice.", descHi: "कोई भी ISL प्रश्न पूछें — चैटबॉट टेक्स्ट और आवाज़ में जवाब देता है।" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="float-orb w-48 h-48 bg-accent/30 top-0 right-[-30px]" />
      <div className="float-orb w-40 h-40 bg-primary/20 bottom-20 left-[-20px]" style={{ animation: "float-drift-reverse 9s ease-in-out infinite alternate" }} />

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            {t("Help Center", "सहायता केंद्र")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Learn how to use Beyond and get answers to common questions.", "Beyond का उपयोग करना सीखें और सामान्य प्रश्नों के उत्तर पाएं।")}
          </p>
        </div>

        {/* Quick Start */}
        <div className="glass-card gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">{t("Quick Start", "शुरू करें")}</h2>
          </div>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
            <li>{t("Type a sentence in the Translator (e.g. \"hello good morning\")", "अनुवादक में एक वाक्य टाइप करें")}</li>
            <li>{t("Click Convert — each word will be matched to an ISL video sign", "कन्वर्ट पर क्लिक करें")}</li>
            <li>{t("Press Play to watch all signs sequentially", "सभी संकेतों को देखने के लिए प्ले दबाएं")}</li>
            <li>{t("Click any word to jump directly to its sign", "किसी शब्द पर क्लिक करके उसके संकेत पर जाएं")}</li>
          </ol>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">{t("Features", "विशेषताएँ")}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {features.map((item, i) => (
              <div key={i} className="glass-card tilt-card gradient-border rounded-2xl p-5 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{t(item.en, item.hi)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descEn, item.descHi)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("Frequently Asked Questions", "अक्सर पूछे जाने वाले प्रश्न")}</h2>
          {faqs.map((faq, i) => {
            const item = lang === "hi" ? faq.hi : faq.en;
            return (
              <details key={i} className="group glass-card rounded-xl overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer font-semibold text-foreground hover:bg-muted/30 transition-colors list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</div>
              </details>
            );
          })}
        </div>

        {/* Contact */}
        <div className="glass-card gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">{t("Need More Help?", "और मदद चाहिए?")}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              "Use the AI chatbot (bottom-right corner) to ask any question about ISL, deaf culture, or how to use Beyond. Available 24/7 in English and Hindi.",
              "ISL या Beyond के बारे में कोई भी प्रश्न पूछने के लिए AI चैटबॉट का उपयोग करें। अंग्रेजी और हिंदी में 24/7 उपलब्ध है।"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
