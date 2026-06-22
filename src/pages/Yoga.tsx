import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileIcon } from "@/components/ProfileIcon";
import { useToast } from "@/hooks/use-toast";
import { PanelLeft, Flower2, Sparkles, Leaf, Sun, ExternalLink, Send, Loader2 } from "lucide-react";

import yogaHero from "@/assets/yoga-hero.jpg";
import yogaBasic from "@/assets/yoga-basic.jpg";
import yogaIntermediate from "@/assets/yoga-intermediate.jpg";
import yogaAdvanced from "@/assets/yoga-advanced.jpg";

const levels = [
  {
    id: "basic",
    title: "Basic",
    description: "Foundational poses and breathwork — perfect for beginners starting their journey.",
    icon: Leaf,
    image: yogaBasic,
    color: "from-emerald-400 to-green-500",
    poses: ["Mountain Pose", "Child's Pose", "Cat-Cow", "Easy Seat"],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Build strength and balance with sun salutations and standing flows.",
    icon: Sun,
    image: yogaIntermediate,
    color: "from-amber-400 to-orange-500",
    poses: ["Warrior I/II", "Triangle Pose", "Sun Salutation B", "Crescent Lunge"],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Deeper asanas, inversions, and pranayama for experienced practitioners.",
    icon: Sparkles,
    image: yogaAdvanced,
    color: "from-violet-500 to-indigo-600",
    poses: ["Crow Pose", "Headstand", "Wheel Pose", "Kapalabhati Pranayama"],
  },
];

const resources = [
  { name: "Yoga Journal", url: "https://www.yogajournal.com/poses/", description: "Comprehensive pose library and tutorials." },
  { name: "Art of Living — Yoga", url: "https://www.artofliving.org/in-en/yoga", description: "Authentic yoga teachings rooted in tradition." },
  { name: "Isha Yoga (Sadhguru)", url: "https://isha.sadhguru.org/yoga/", description: "Classical yoga practices and free guided sessions." },
  { name: "Yoga With Adriene", url: "https://yogawithadriene.com/", description: "Free guided video classes for every level." },
  { name: "Ministry of AYUSH — Yoga", url: "https://yoga.ayush.gov.in/", description: "Official Government of India yoga resources." },
  { name: "NHS — Guide to Yoga", url: "https://www.nhs.uk/live-well/exercise/guide-to-yoga/", description: "Evidence-based health benefits and getting started." },
];

const querySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  level: z.string().max(40).optional(),
  message: z.string().trim().min(10, "Please share a bit more (10+ chars)").max(2000),
});

const Yoga = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", level: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setForm((f) => ({
        ...f,
        email: session.user.email ?? "",
        name: (session.user.user_metadata?.full_name as string) ?? "",
      }));
    });
  }, [navigate]);

  const scrollToContact = (level?: string) => {
    if (level) setForm((f) => ({ ...f, level }));
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = querySchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Please check your form", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("yoga_queries").insert({
      user_id: user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      level: parsed.data.level || null,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Query sent 🙏", description: "Our team will reach out to you soon." });
    setForm((f) => ({ ...f, message: "", level: "" }));
  };

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-4 md:px-6 py-4 flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <PanelLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-serif font-bold truncate">Yoga</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Breathe. Move. Be still.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <NotificationBell />
              <ThemeToggle />
              <ProfileIcon />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {/* Hero */}
          <section className="relative">
            <div className="relative h-[320px] md:h-[420px] overflow-hidden">
              <img
                src={yogaHero}
                alt="Sunrise yoga practice by a tranquil lake"
                className="absolute inset-0 w-full h-full object-cover"
                width={1536}
                height={768}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 flex items-end">
                <div className="max-w-4xl mx-auto px-6 pb-10 md:pb-14 w-full">
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground drop-shadow-sm">
                    The path of yoga begins with a breath.
                  </h2>
                  <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
                    A timeless practice for body, mind, and spirit. Explore poses, learn from trusted sources, and reach out with any question.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button onClick={() => scrollToContact()} className="bg-gradient-calm hover:opacity-90">
                      Ask a Question
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/activities")}>
                      Try Guided Asanas
                    </Button>
                    <Button variant="outline" asChild className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                      <a href="https://whatsapp.com/channel/0029VbCXRu19cDDXHhO1U30e" target="_blank" rel="noopener noreferrer">
                        Join Community
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-14">
            {/* Intro */}
            <section className="text-center max-w-2xl mx-auto space-y-3">
              <h3 className="text-2xl md:text-3xl font-serif font-semibold">Why Yoga?</h3>
              <p className="text-muted-foreground">
                Yoga unites movement, breath, and awareness. It calms the nervous system, improves flexibility and strength,
                and creates space for clarity and compassion in daily life. Whether you're brand new or deepening a long
                practice, there's a doorway here for you.
              </p>
            </section>

            {/* Level cards */}
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl md:text-3xl font-serif font-semibold">Choose Your Level</h3>
                <p className="text-muted-foreground">Tap a level to ask about classes or guidance tailored to you.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {levels.map((lvl) => {
                  const Icon = lvl.icon;
                  return (
                    <Card
                      key={lvl.id}
                      className="group overflow-hidden cursor-pointer border-0 hover:shadow-calm transition-all duration-300 hover:-translate-y-1"
                      onClick={() => scrollToContact(lvl.id)}
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={lvl.image}
                          alt={`${lvl.title} yoga`}
                          loading="lazy"
                          width={768}
                          height={768}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${lvl.color} opacity-20`} />
                        <div className={`absolute top-3 left-3 w-10 h-10 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif">{lvl.title}</CardTitle>
                        <CardDescription>{lvl.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {lvl.poses.map((p) => (
                            <li key={p} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                              {p}
                            </li>
                          ))}
                        </ul>
                        <Button className="w-full bg-gradient-calm hover:opacity-90">Ask About {lvl.title}</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Resources */}
            <section className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl md:text-3xl font-serif font-semibold">Learn from Trusted Sources</h3>
                <p className="text-muted-foreground">External resources from official organizations and respected teachers.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card hover:shadow-calm hover:border-primary/40 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Contact Form */}
            <section ref={contactRef} className="scroll-mt-20">
              <Card className="border-0 shadow-calm">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Have a Question?</CardTitle>
                  <CardDescription>
                    Send us your query about yoga practice, posture guidance, or finding the right level — our team will respond personally.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="yname">Name</Label>
                        <Input
                          id="yname"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          required
                          maxLength={80}
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yemail">Email</Label>
                        <Input
                          id="yemail"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          required
                          maxLength={255}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Interested Level</Label>
                      <Select value={form.level} onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a level (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="general">General Question</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ymsg">Your Query</Label>
                      <Textarea
                        id="ymsg"
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        required
                        maxLength={2000}
                        rows={5}
                        placeholder="Share your question or what you'd like guidance on..."
                      />
                      <p className="text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full bg-gradient-calm hover:opacity-90 gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Query
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Yoga;
