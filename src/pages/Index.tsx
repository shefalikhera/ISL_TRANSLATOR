import { useState, useEffect } from "react";
import { Sparkles, Users, Heart, Globe, Play, Eye, ArrowRight, BookOpen, MapPin, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import islDataset from "@/data/isl-dataset.json";

interface WordEntry {
  word: string;
  video_id: string;
  start_time: number;
  end_time: number;
}

const dataset: WordEntry[] = islDataset as WordEntry[];

const commonWords = ["hello", "thank", "please", "help", "friend", "love", "eat", "water", "family", "good", "name", "sorry", "happy", "learn", "day", "time", "home", "school", "mother", "father"];

function getWordOfTheDay(): WordEntry | null {
  const dayIndex = Math.floor(Date.now() / 86400000) % commonWords.length;
  const word = commonWords[dayIndex];
  return dataset.find((e) => e.word === word) || dataset[dayIndex % dataset.length] || null;
}

const stats = [
  { icon: Users, label: "ISL Users in India", value: "18M+", desc: "Deaf & hard-of-hearing individuals", gradient: "from-primary to-orange-400" },
  { icon: Globe, label: "Recognition", value: "2024", desc: "ISL recognized in NEP & RPwD Act", gradient: "from-accent to-purple-400" },
  { icon: Heart, label: "Community", value: "Growing", desc: "Active deaf communities across India", gradient: "from-pink-500 to-rose-400" },
];

const infoSections = [
  {
    title: "What is Indian Sign Language?",
    icon: BookOpen,
    text: "Indian Sign Language (ISL) is a complete, natural language used by the Deaf community in India. It has its own grammar, syntax, and vocabulary distinct from spoken languages. ISL uses hand shapes, facial expressions, and body movements to convey meaning.",
  },
  {
    title: "Why ISL Matters",
    icon: Heart,
    text: "Over 18 million people in India are deaf or hard-of-hearing. ISL is their primary mode of communication. Despite this, ISL was only recently recognized officially, and most hearing people have no exposure to it — creating a massive communication barrier.",
  },
  {
    title: "About Beyond",
    icon: Sparkles,
    text: "Beyond is a platform dedicated to bridging the communication gap between deaf and hearing communities. We provide real-time text-to-ISL translation, curated deaf-friendly places, tutor connections, and AI-powered assistance — all in one accessible interface.",
  },
];

const quickLinks = [
  { label: "Text → ISL", desc: "Translate text to sign language", icon: Languages, to: "/text-to-isl", color: "bg-primary/15 text-primary" },
  { label: "Places", desc: "Find deaf-friendly locations", icon: MapPin, to: "/places", color: "bg-accent/15 text-accent" },
];

export default function Index() {
  const [wotd, setWotd] = useState<WordEntry | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setWotd(getWordOfTheDay());
  }, []);

  return (
    <div className="font-sans bg-background min-h-full relative overflow-hidden" style={{ perspective: "1200px" }}>
      {/* Floating orbs */}
      <div className="float-orb w-80 h-80 bg-primary/25 top-[-100px] right-[-60px]" />
      <div className="float-orb w-60 h-60 bg-accent/20 bottom-32 left-[-50px]" style={{ animation: "float-drift-reverse 9s ease-in-out infinite alternate" }} />
      <div className="float-orb w-40 h-40 bg-pink-500/10 top-[40%] right-[10%]" style={{ animation: "float-drift 12s ease-in-out infinite alternate" }} />

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-10 relative z-10">
        {/* Hero — 3D tilt */}
        <section
          className="text-center space-y-5 glass-card-elevated rounded-3xl p-10 sm:p-14 tilt-card gradient-border"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold backdrop-blur-sm">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Indian Sign Language Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Beyond
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Breaking barriers between the deaf and hearing world through technology, education, and community.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {quickLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group glass-card rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <div className={`h-9 w-9 rounded-lg ${l.color} flex items-center justify-center`}>
                  <l.icon className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </section>

        {/* Stats — 3D cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="tilt-card glass-card-elevated rounded-2xl p-6 text-center space-y-3 group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className="h-7 w-7 text-white" />
              </div>
              <p className="text-3xl font-black text-foreground">{s.value}</p>
              <p className="text-sm font-bold text-foreground/80">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </section>

        {/* Word of the Day — elevated 3D */}
        {wotd && (
          <section className="glass-card-elevated gradient-border rounded-3xl p-7 space-y-5 tilt-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Word of the Day</h2>
                <p className="text-xs text-muted-foreground">Most commonly used ISL sign today</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1 space-y-1">
                <p className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent capitalize">
                  {wotd.word}
                </p>
                <p className="text-sm text-muted-foreground">Watch how this sign is performed in ISL</p>
              </div>
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="rounded-xl px-6 py-3 text-sm font-bold text-primary-foreground bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {showVideo ? "Hide Gesture" : "See Gesture"}
              </button>
            </div>
            {showVideo && (
              <div className="rounded-2xl overflow-hidden aspect-video bg-black/10 shadow-inner ring-1 ring-border/30">
                <iframe
                  src={`https://www.youtube.com/embed/${wotd.video_id}?start=${wotd.start_time}&end=${wotd.end_time}&autoplay=1&mute=1`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={`ISL sign for ${wotd.word}`}
                />
              </div>
            )}
          </section>
        )}

        {/* Info sections — staggered 3D cards */}
        <section className="grid grid-cols-1 gap-4">
          {infoSections.map((s, i) => (
            <div
              key={s.title}
              className="tilt-card glass-card rounded-2xl p-6 flex gap-5 items-start group"
              style={{ transformOrigin: i % 2 === 0 ? "left center" : "right center" }}
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black text-foreground">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
