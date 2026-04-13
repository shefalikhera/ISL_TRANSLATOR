import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { GraduationCap, Star, MapPin, Mail, Phone, Plus, X, Clock, IndianRupee, Award, Search, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Tutor {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  experience_years: number;
  hourly_rate: number;
  specializations: string[];
  contact_email: string | null;
  phone: string | null;
  city: string | null;
  is_verified: boolean;
}

export default function Tutors() {
  const { t } = useLang();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [myTutor, setMyTutor] = useState<Tutor | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", bio: "", experience_years: 0, hourly_rate: 500,
    specializations: "" , contact_email: "", phone: "", city: "",
  });

  useEffect(() => {
    supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

  useEffect(() => { fetchTutors(); }, []);

  useEffect(() => {
    if (user && tutors.length) {
      const mine = tutors.find((t) => t.user_id === user.id) || null;
      setMyTutor(mine);
      if (mine) {
        setForm({
          name: mine.name, bio: mine.bio || "", experience_years: mine.experience_years,
          hourly_rate: mine.hourly_rate, specializations: (mine.specializations || []).join(", "),
          contact_email: mine.contact_email || "", phone: mine.phone || "", city: mine.city || "",
        });
      }
    }
  }, [user, tutors]);

  const fetchTutors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tutors").select("*").order("created_at", { ascending: false });
    if (!error && data) setTutors(data as Tutor[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t("Please sign in first", "पहले साइन इन करें")); return; }
    const payload = {
      user_id: user.id, name: form.name, bio: form.bio || null,
      experience_years: form.experience_years, hourly_rate: form.hourly_rate,
      specializations: form.specializations.split(",").map((s) => s.trim()).filter(Boolean),
      contact_email: form.contact_email || null, phone: form.phone || null, city: form.city || null,
    };
    if (myTutor) {
      const { error } = await supabase.from("tutors").update(payload).eq("id", myTutor.id);
      if (error) { toast.error(error.message); return; }
      toast.success(t("Profile updated!", "प्रोफ़ाइल अपडेट हो गई!"));
    } else {
      const { error } = await supabase.from("tutors").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t("Tutor profile created!", "ट्यूटर प्रोफ़ाइल बनाई गई!"));
    }
    setShowForm(false);
    fetchTutors();
  };

  const handleDelete = async () => {
    if (!myTutor) return;
    const { error } = await supabase.from("tutors").delete().eq("id", myTutor.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("Profile deleted", "प्रोफ़ाइल हटाई गई"));
    setMyTutor(null);
    setShowForm(false);
    fetchTutors();
  };

  const filtered = tutors.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.city?.toLowerCase().includes(search.toLowerCase()) ||
    t.specializations?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 relative overflow-hidden">
      <div className="float-orb w-60 h-60 bg-primary/30 top-[-60px] right-[-40px]" />
      <div className="float-orb w-44 h-44 bg-accent/20 bottom-10 left-[-30px]" style={{ animation: "float-drift-reverse 9s ease-in-out infinite alternate" }} />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" /> {t("ISL Tutors", "ISL ट्यूटर")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("Find & hire sign language tutors, or become one!", "साइन लैंग्वेज ट्यूटर खोजें या खुद बनें!")}</p>
          </div>
          {user && (
            <Button onClick={() => setShowForm(!showForm)} className="rounded-xl font-bold shadow-lg shadow-primary/25 active:scale-95">
              {showForm ? <><X className="h-4 w-4 mr-1" /> {t("Cancel", "रद्द")}</> : <><Plus className="h-4 w-4 mr-1" /> {myTutor ? t("Edit Profile", "प्रोफ़ाइल संपादित करें") : t("Become a Tutor", "ट्यूटर बनें")}</>}
            </Button>
          )}
          {!user && (
            <a href="/auth" className="text-sm text-primary font-semibold hover:underline">
              {t("Sign in to register as tutor →", "ट्यूटर बनने के लिए साइन इन करें →")}
            </a>
          )}
        </div>

        {/* Registration Form */}
        {showForm && user && (
          <form onSubmit={handleSubmit} className="glass-card-elevated gradient-border rounded-2xl p-6 space-y-4 animate-fade-up">
            <h2 className="font-bold text-foreground text-lg">{myTutor ? t("Edit Your Profile", "अपनी प्रोफ़ाइल संपादित करें") : t("Register as Tutor", "ट्यूटर के रूप में पंजीकरण")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("Full Name *", "पूरा नाम *")} required className="rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder={t("City", "शहर")} className="rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder={t("Contact Email", "संपर्क ईमेल")} type="email" className="rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("Phone", "फ़ोन")} className="rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              <input type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: +e.target.value })} placeholder={t("Experience (years)", "अनुभव (वर्ष)")} className="rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
              <input type="number" min={0} value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: +e.target.value })} placeholder={t("Hourly Rate (₹)", "प्रति घंटा शुल्क (₹)")} className="rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
            </div>
            <input value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} placeholder={t("Specializations (comma-separated)", "विशेषज्ञता (अल्पविराम से अलग)")} className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none" />
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder={t("Tell learners about yourself...", "शिक्षार्थियों को अपने बारे में बताएं...")} rows={3} className="w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none" />
            <div className="flex gap-3">
              <Button type="submit" className="rounded-xl font-bold shadow-lg shadow-primary/25">{myTutor ? t("Update", "अपडेट") : t("Register", "पंजीकरण")}</Button>
              {myTutor && <Button type="button" variant="destructive" onClick={handleDelete} className="rounded-xl font-bold">{t("Delete Profile", "प्रोफ़ाइल हटाएं")}</Button>}
            </div>
          </form>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search tutors by name, city, or skill...", "नाम, शहर या कौशल से खोजें...")}
            className="w-full rounded-xl border border-input bg-background/80 pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none backdrop-blur-sm"
          />
        </div>

        {/* Tutor Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t("Loading tutors...", "ट्यूटर लोड हो रहे हैं...")}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-3">
            <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground font-medium">{t("No tutors found yet", "अभी तक कोई ट्यूटर नहीं मिला")}</p>
            <p className="text-xs text-muted-foreground">{t("Be the first to register!", "पहले पंजीकरण करें!")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((tutor) => (
              <div key={tutor.id} className="glass-card tilt-card gradient-border rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <UserIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground truncate">{tutor.name}</h3>
                      {tutor.is_verified && <Award className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    {tutor.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {tutor.city}</p>
                    )}
                  </div>
                </div>

                {tutor.bio && <p className="text-sm text-muted-foreground line-clamp-2">{tutor.bio}</p>}

                <div className="flex flex-wrap gap-1.5">
                  {tutor.specializations?.map((s, i) => (
                    <span key={i} className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">{s}</span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/30">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {tutor.experience_years} {t("yrs", "वर्ष")}</span>
                  <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> ₹{tutor.hourly_rate}/{t("hr", "घंटा")}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  {tutor.contact_email && (
                    <a href={`mailto:${tutor.contact_email}`} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <Mail className="h-3 w-3" /> {t("Email", "ईमेल")}
                    </a>
                  )}
                  {tutor.phone && (
                    <a href={`tel:${tutor.phone}`} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <Phone className="h-3 w-3" /> {t("Call", "कॉल")}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
