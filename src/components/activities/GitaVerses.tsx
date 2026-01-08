import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Heart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Verse {
  chapter: number;
  verse: number;
  sanskrit: string;
  translation: string;
  story: string;
  lesson: string;
}

const verses: Verse[] = [
  {
    chapter: 2,
    verse: 47,
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
    translation: "You have the right to work, but never to the fruit of work.",
    story: "A farmer named Arjun worked tirelessly in his fields every day. His neighbor, always anxious about harvests, would check his crops obsessively. One drought year, both faced losses, but Arjun remained peaceful while his neighbor fell into despair. Arjun said, 'I did my best each day. The rain is not in my hands.'",
    lesson: "Focus on your actions and efforts, not on outcomes you cannot control. This brings inner peace."
  },
  {
    chapter: 2,
    verse: 14,
    sanskrit: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः",
    translation: "The contact of senses with their objects gives rise to cold and heat, pleasure and pain. They come and go; bear them patiently.",
    story: "A wise monk traveled through seasons without complaint. In winter's cold and summer's heat, he remained equanimous. His disciple asked how. The monk replied, 'These sensations are like clouds passing across the sky of consciousness. I am the sky, not the clouds.'",
    lesson: "Life's pleasures and pains are temporary. Accepting their transient nature brings stability."
  },
  {
    chapter: 3,
    verse: 21,
    sanskrit: "यद्यदाचरति श्रेष्ठस्तत्तदेवेतरो जनः",
    translation: "Whatever a great person does, others follow. Whatever standards they set, the world follows.",
    story: "A village chief always picked up litter on his morning walks. He never asked anyone to join him. Within months, the entire village became spotlessly clean. His silent action spoke louder than any decree could.",
    lesson: "Lead by example. Your actions inspire others more than your words ever will."
  },
  {
    chapter: 4,
    verse: 7,
    sanskrit: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत",
    translation: "Whenever there is a decline in righteousness, I manifest myself.",
    story: "In a corrupt kingdom, a young girl began simply telling the truth in all her dealings. Her honesty spread like ripples. One truthful person inspired another. Within a generation, the culture of the land transformed.",
    lesson: "In times of moral decline, even one person living righteously can spark positive change."
  },
  {
    chapter: 6,
    verse: 5,
    sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्",
    translation: "Elevate yourself through the power of your mind, and not degrade yourself, for the mind can be the friend or the enemy of the self.",
    story: "Two brothers faced the same hardship. One told himself 'I can overcome this' and found solutions. The other told himself 'I'm doomed' and gave up. Years later, one had prospered while the other remained stuck.",
    lesson: "Your self-talk shapes your reality. Be your own best friend, not your worst critic."
  },
  {
    chapter: 2,
    verse: 62,
    sanskrit: "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते",
    translation: "Thinking about sense objects will lead to attachment; attachment breeds desire; desire breeds anger.",
    story: "A merchant obsessed over a rival's success. Constant comparison led to jealousy, then hatred. His own business suffered as his mind was consumed. A sage advised, 'Water your own garden, not your neighbor's weeds.'",
    lesson: "Guard your thoughts. Where attention goes, energy flows. Choose wisely what you dwell upon."
  },
  {
    chapter: 9,
    verse: 22,
    sanskrit: "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते",
    translation: "To those who worship me with devotion, thinking of no other, I provide what they lack and preserve what they have.",
    story: "A devoted mother prayed not for wealth but for wisdom to guide her children. She didn't know how she'd pay for their education, but opportunities appeared at each turning point. Her faith attracted providence.",
    lesson: "Single-minded devotion to your highest purpose attracts the support you need."
  },
  {
    chapter: 18,
    verse: 66,
    sanskrit: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज",
    translation: "Abandon all varieties of dharma and surrender unto me alone. I shall deliver you from all sinful reactions; do not fear.",
    story: "A soldier, burdened by wartime actions, couldn't find peace. No ritual cleansed his guilt. Finally, he surrendered completely to the divine, accepting grace. In that surrender, he found the peace no effort could bring.",
    lesson: "When all efforts fail, complete surrender to the divine brings liberation and peace."
  },
  {
    chapter: 2,
    verse: 71,
    sanskrit: "विहाय कामान्यः सर्वान्पुमांश्चरति निःस्पृहः",
    translation: "One who has given up all desires, free from longing and sense of ownership, attains peace.",
    story: "A king renounced his throne to become a wandering sage. People pitied him. But he smiled, 'I owned a kingdom but was owned by worries. Now I own nothing but am owned by nothing. Who is richer?'",
    lesson: "True freedom comes not from having everything, but from needing nothing."
  },
  {
    chapter: 12,
    verse: 13,
    sanskrit: "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च",
    translation: "One who is not envious but is a kind friend to all living entities, free from possessiveness and ego...",
    story: "A doctor treated all patients equally—rich or poor, friend or stranger. When asked about his secret to happiness, he said, 'I see no enemies, only souls struggling like me. How can I hate what I understand?'",
    lesson: "Universal friendliness dissolves the walls that separate us from peace."
  },
];

export const GitaVerses = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);

  const currentVerse = verses[currentIndex];

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % verses.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + verses.length) % verses.length);
  };

  const toggleFavorite = () => {
    setFavorites((prev) =>
      prev.includes(currentIndex)
        ? prev.filter((i) => i !== currentIndex)
        : [...prev, currentIndex]
    );
  };

  const isFavorite = favorites.includes(currentIndex);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 to-amber-500/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-orange-500" />
          Bhagavad Gita - Chapter {currentVerse.chapter}, Verse {currentVerse.verse}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} of {verses.length} wisdom verses
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-6">
          {/* Sanskrit */}
          <div className="text-center mb-6">
            <p className="text-xl font-serif text-orange-600 dark:text-orange-400 leading-relaxed">
              {currentVerse.sanskrit}
            </p>
          </div>

          {/* Translation */}
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 mb-6">
            <p className="text-base italic text-foreground/80">
              "{currentVerse.translation}"
            </p>
          </div>

          {/* Story */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">
              A Story
            </h4>
            <p className="text-sm leading-relaxed">{currentVerse.story}</p>
          </div>

          {/* Lesson */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-2">
              ✨ Life Lesson
            </h4>
            <p className="text-sm leading-relaxed">{currentVerse.lesson}</p>
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-t">
          <Button variant="outline" size="sm" onClick={goPrev}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className={isFavorite ? "text-red-500" : ""}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </Button>

          <Button variant="outline" size="sm" onClick={goNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
