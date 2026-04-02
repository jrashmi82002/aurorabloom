import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileIcon } from "@/components/ProfileIcon";
import { PanelLeft, Newspaper, Clock, ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  date: string;
}

// Pre-loaded healing blog content
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Science of Self-Healing: Your Body's Natural Power",
    excerpt: "Research shows our bodies have remarkable self-healing capabilities. Learn how to activate them.",
    category: "Self Healing",
    readTime: "5 min",
    date: "2024-01-15",
    content: `# The Science of Self-Healing

**Your body is a self-healing machine.** Every second, millions of cells regenerate, wounds close, and your immune system fights off invaders. But modern life often disrupts these natural processes.

## The Mind-Body Connection

Studies from Harvard Medical School show that stress reduction alone can:
- Lower blood pressure by 10-15 points
- Boost immune function by 30%
- Accelerate wound healing by 40%

## Practical Steps to Activate Self-Healing

### 1. Sleep Optimization
Your body repairs itself during deep sleep. Adults need 7-9 hours, and the hours before midnight are most restorative.

### 2. Breathwork
Just 5 minutes of deep breathing activates your parasympathetic nervous system, shifting your body from "fight-or-flight" to "rest-and-digest" mode.

### 3. Mindful Movement
Gentle yoga, tai chi, or simple stretching increases blood flow and reduces inflammation markers.

### 4. Nutrition as Medicine
Anti-inflammatory foods like turmeric, ginger, leafy greens, and fatty fish support natural healing processes.

> "The natural healing force within each one of us is the greatest force in getting well." - Hippocrates

**Remember:** You are not broken. Your body knows how to heal. Your job is to create the conditions for healing to happen.`
  },
  {
    id: "2",
    title: "Discipline as a Path to Healing: The Yoga Approach",
    excerpt: "How consistent practice and structured routines lead to lasting mental health improvements.",
    category: "Yoga & Discipline",
    readTime: "7 min",
    date: "2024-01-20",
    content: `# Discipline as a Path to Healing

In a world of quick fixes, discipline might seem old-fashioned. But research consistently shows that **structured practice is the fastest path to lasting change.**

## The Yoga Perspective

Yoga philosophy teaches that discipline (tapas) isn't punishment—it's self-love in action.

### Why Discipline Works

1. **Neuroplasticity**: Repeated actions create new neural pathways
2. **Confidence**: Keeping promises to yourself builds self-trust
3. **Stability**: Routine reduces decision fatigue and anxiety

## A Simple Discipline Framework

### Morning Routine (15 minutes)
- 5 minutes gentle stretching
- 5 minutes meditation or breathwork
- 5 minutes setting intentions

### Evening Routine (10 minutes)
- Review 3 things you're grateful for
- 5 minutes gentle yoga or stretching
- Digital sunset 1 hour before bed

## The Science Behind It

A study in the European Journal of Social Psychology found it takes an average of **66 days** to form a new habit. But here's the good news: missing one day doesn't reset your progress.

### Start Small

- Week 1-2: Just show up (even 2 minutes counts)
- Week 3-4: Gradually increase duration
- Month 2+: Deepen the practice

> "We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Aristotle

**The goal isn't perfection—it's consistency.**`
  },
  {
    id: "3",
    title: "Meditation: Rewiring Your Brain for Peace",
    excerpt: "Neuroscience reveals how meditation physically changes your brain structure for better mental health.",
    category: "Meditation",
    readTime: "6 min",
    date: "2024-01-25",
    content: `# Meditation: Rewiring Your Brain for Peace

Meditation isn't mystical—it's **neurological training**. Brain scans show measurable changes after just 8 weeks of regular practice.

## What Happens to Your Brain

### After 8 Weeks of Meditation:
- **Amygdala shrinks**: Less anxiety and fear response
- **Prefrontal cortex thickens**: Better decision-making
- **Gray matter increases**: Improved memory and learning

## Types of Meditation for Healing

### 1. Mindfulness Meditation
Focus on present-moment awareness. Start with 5 minutes of observing your breath.

### 2. Loving-Kindness (Metta)
Send compassion to yourself and others. Research shows this reduces self-criticism and depression.

### 3. Body Scan
Systematically relax each body part. Excellent for chronic pain and tension.

### 4. Walking Meditation
Perfect for those who can't sit still. Focus on each step and your surroundings.

## Getting Started

**Week 1**: 3 minutes daily
**Week 2**: 5 minutes daily
**Week 3**: 7 minutes daily
**Week 4+**: 10-15 minutes daily

### Common Obstacles

- **"I can't stop thinking"**: You're not supposed to. Notice thoughts, return to breath.
- **"I don't have time"**: Start with 3 minutes. Everyone has 3 minutes.
- **"I'm not good at it"**: There's no "good." Just practice.

> "Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts and our feelings." - Arianna Huffington`
  },
  {
    id: "4",
    title: "The Psychology of a Healed Mind",
    excerpt: "What does mental wellness actually look like? Understanding the characteristics of psychological resilience.",
    category: "Psychology",
    readTime: "8 min",
    date: "2024-02-01",
    content: `# The Psychology of a Healed Mind

Healing doesn't mean never feeling sad or anxious. It means **developing a different relationship with your emotions.**

## Signs of a Healed Mind

### 1. Emotional Flexibility
- Feel emotions fully without being overwhelmed
- Recover more quickly from setbacks
- Respond rather than react

### 2. Self-Compassion
- Talk to yourself as you would a friend
- Accept imperfection without harsh judgment
- Recognize shared humanity in struggles

### 3. Healthy Boundaries
- Say no without guilt
- Protect your energy
- Maintain your values in relationships

### 4. Present-Moment Awareness
- Less rumination about the past
- Less anxiety about the future
- More engagement with now

## The Science of Resilience

Research from positive psychology identifies these protective factors:

1. **Social connection**: Deep relationships buffer stress
2. **Purpose**: Meaning makes struggles bearable
3. **Self-efficacy**: Belief in your ability to handle challenges
4. **Gratitude practice**: Rewires attention toward positives

## Healing is Not Linear

Expect setbacks. They're part of the process, not evidence of failure.

### The "Two Steps Forward, One Step Back" Reality

- Bad days don't erase progress
- Triggers may always exist, but responses change
- Old patterns may resurface during stress

## Practical Wisdom

> "The wound is the place where the light enters you." - Rumi

### Daily Practices for Psychological Health

1. **Journaling**: 10 minutes of free writing
2. **Movement**: Exercise reduces depression as effectively as medication
3. **Connection**: One meaningful conversation daily
4. **Reflection**: What went well today?

**Remember:** Healing is becoming more yourself, not becoming someone else.`
  },
  {
    id: "5",
    title: "Breaking the Cycle: From Pain to Growth",
    excerpt: "Understanding trauma responses and evidence-based approaches to genuine recovery.",
    category: "Self Healing",
    readTime: "6 min",
    date: "2024-02-05",
    content: `# Breaking the Cycle: From Pain to Growth

Pain is inevitable. **Suffering is optional.** This isn't toxic positivity—it's the foundation of evidence-based healing.

## Understanding Your Nervous System

Your body keeps score. Trauma lives in the nervous system, not just memory.

### Signs Your Nervous System Needs Attention
- Constant tension or hypervigilance
- Difficulty relaxing even in safe situations
- Emotional numbness or overwhelm
- Sleep disturbances

## The Path Out

### 1. Safety First
Your body needs to feel safe before it can heal. Create environments and relationships that feel secure.

### 2. Feel to Heal
Suppressed emotions don't disappear—they fester. Learn to feel without being overwhelmed.

### 3. New Experiences
Counter traumatic memories with positive experiences. The brain needs new data.

### 4. Support Matters
Healing happens in relationship. Therapy, support groups, trusted friends—connection is medicine.

## Practical Tools

### Grounding Techniques
- 5-4-3-2-1: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste
- Cold water on wrists
- Barefoot on grass

### Regulation Practices
- Box breathing: Inhale 4, hold 4, exhale 4, hold 4
- Humming or singing (activates vagus nerve)
- Gentle yoga or stretching

## Hope is Data

Post-traumatic growth is real. Many people who heal report:
- Deeper appreciation for life
- Improved relationships
- Greater personal strength
- New possibilities
- Spiritual development

> "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars." - Kahlil Gibran

**You are not your trauma. You are the one who survived it.**`
  }
];

const Blog = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const categoryColors: Record<string, string> = {
    "Self Healing": "from-green-400 to-emerald-500",
    "Yoga & Discipline": "from-purple-400 to-violet-500",
    "Meditation": "from-blue-400 to-cyan-500",
    "Psychology": "from-pink-400 to-rose-500",
  };

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-soft">
      <AppSidebar userId={user.id} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="px-4 md:px-6 py-4 flex items-center gap-3 md:gap-4">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <PanelLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-serif font-bold truncate">Healing Blog</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Research-backed insights for your journey</p>
              </div>
            </div>
            {selectedPost && (
              <Button variant="outline" onClick={() => setSelectedPost(null)} className="ml-auto">
                ← Back to Posts
              </Button>
            )}
            <NotificationBell />
            <ThemeToggle />
            <ProfileIcon />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {!selectedPost ? (
              <div className="grid gap-4">
                {blogPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="group hover:shadow-calm transition-all duration-300 cursor-pointer border-0"
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${categoryColors[post.category]} text-white`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-base">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="gap-2 group-hover:gap-3 transition-all">
                        Read More <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <article className="prose prose-lg dark:prose-invert max-w-none animate-fade-in">
                <div className="mb-6">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[selectedPost.category]} text-white`}>
                    {selectedPost.category}
                  </span>
                </div>
                <h1 className="font-serif">{selectedPost.title}</h1>
                <div className="whitespace-pre-line leading-relaxed">
                  {selectedPost.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={i} className="font-serif mt-8 mb-4">{line.slice(2)}</h1>;
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="font-serif mt-6 mb-3">{line.slice(3)}</h2>;
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i} className="font-serif mt-4 mb-2">{line.slice(4)}</h3>;
                    }
                    if (line.startsWith('> ')) {
                      return <blockquote key={i} className="border-l-4 border-primary/50 pl-4 italic my-4">{line.slice(2)}</blockquote>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4">{line.slice(2)}</li>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
                    }
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    return <p key={i} className="my-2">{line}</p>;
                  })}
                </div>
              </article>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Blog;
