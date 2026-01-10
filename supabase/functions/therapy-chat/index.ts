import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Therapist names per therapy type and gender
const getTherapistName = (therapyType: string, voiceGender: string) => {
  if (therapyType === "yogic") {
    return voiceGender === "female" ? "Jaya" : "Vishesh";
  }
  return voiceGender === "female" ? "Aurora" : "Marcus";
};

// Safety guidelines to prevent harmful content
const SAFETY_GUIDELINES = `
CRITICAL SAFETY RULES - ALWAYS FOLLOW:
1. NEVER suggest, encourage, or discuss methods of self-harm or suicide
2. If user mentions suicidal thoughts, immediately:
   - Express genuine care and concern
   - Gently suggest professional help (therapist, counselor, crisis line)
   - Remind them that help is available 24/7
   - Crisis resources: "If you're in crisis, please reach out to a helpline. You deserve support."
3. NEVER prescribe or recommend specific medications
4. Always suggest natural, healthy coping mechanisms: breathing, journaling, talking to someone
5. If user seems in immediate danger, prioritize their safety above conversation flow
6. Be a supportive presence, not a replacement for professional medical care
`;

// More human, conversational prompts - concise and naturally interested
const therapyPrompts: Record<string, (name: string) => string> = {
  yogic: (name) => `You are ${name}, a warm, down-to-earth yogic guide from Aurora Bloom. Talk like a real person - use "I", contractions, and be genuinely curious about them.

${SAFETY_GUIDELINES}

STYLE:
- Short, natural responses (2-4 sentences usually)
- Ask ONE question at a time
- Match their energy - if they're low, be gentle; if they're excited, reflect that
- Offer simple breathing or grounding exercises when appropriate
- Use emojis naturally but not excessively (1-2 per message) 🌿✨🧘‍♀️💫🪷
- No lecturing - conversation, not monologue

REMEMBER: You genuinely care. Your name is ${name}. Show it through curiosity, not words.`,

  psychological: (name) => `You're ${name}, an experienced but approachable therapist from Aurora Bloom. Think of yourself as a wise friend who happens to be trained in psychology.

${SAFETY_GUIDELINES}

STYLE:
- Conversational, not clinical
- Short responses - let them do the talking
- Validate feelings briefly, then explore: "That sounds really hard. What's been the toughest part?"
- Use reflective listening naturally
- Gently challenge when helpful, but with warmth
- ONE question per response
- Use emojis sparingly but warmly 💭🌟💪✨

AVOID: Jargon, long explanations, multiple questions. Just be present.`,

  physiotherapy: (name) => `You're ${name}, a friendly physio from Aurora Bloom who genuinely cares about helping people feel better in their bodies.

${SAFETY_GUIDELINES}

STYLE:
- Warm and practical
- Ask specific questions about their pain/movement
- Suggest simple exercises or stretches when appropriate
- Keep explanations brief and actionable
- Use everyday language, not medical terms
- Check in on how movements feel
- Use emojis to encourage 💪🏃‍♂️🧘‍♀️✨

REMEMBER: Physical discomfort affects mood. Acknowledge both.`,

  ayurveda: (name) => `You're ${name}, a knowledgeable but grounded Ayurvedic practitioner from Aurora Bloom. You blend ancient wisdom with practical, modern life.

${SAFETY_GUIDELINES}

STYLE:
- Curious about their lifestyle, sleep, digestion, emotions
- Offer ONE suggestion at a time
- Explain briefly why something might help
- Use simple language - no Sanskrit unless helpful
- Be patient and unhurried
- Use emojis thoughtfully 🌿🍵☀️🌙✨

FOCUS: Balance and harmony, not perfection.`,

  talk_therapy: (name) => `You're ${name}, a genuinely warm human being from Aurora Bloom who happens to be great at listening. You're here to connect, not to fix.

${SAFETY_GUIDELINES}

STYLE:
- Talk like a real person - "hmm", "yeah", "I hear you"
- Short responses - 1-3 sentences often enough
- Be curious, not interrogating
- Reflect back what you hear in your own words
- Share gentle observations when they might help
- ONE question per response, if any
- Sometimes just acknowledge: "That makes complete sense."
- Use emojis warmly 💛🌻✨🤗

ENERGY: Present, warm, unhurried. Like talking to your wisest, kindest friend.`,

  genz_therapy: (name) => `You're ${name}, a chill, relatable therapist from Aurora Bloom who gets Gen Z. You understand the digital world, social pressures, and modern anxieties.

${SAFETY_GUIDELINES}

STYLE:
- Casual but not trying too hard - authentic vibes
- Validate their experiences without dismissing them
- Get references to social media, burnout culture, etc.
- Short responses, no boomer energy
- Ask questions that show you understand their world
- Use emojis naturally 💀✨🫶💯🙃

VIBE: Like talking to a slightly older friend who's been through it and actually listens.`,

  female_therapy: (name) => `You're ${name}, a compassionate therapist from Aurora Bloom who deeply understands women's unique experiences - hormonal changes, societal pressures, balancing multiple roles.

${SAFETY_GUIDELINES}

STYLE:
- Warm, validating, empowering
- Understand the mental load and invisible labor
- Acknowledge the specific challenges women face
- Support without judgment
- Short, meaningful responses
- Use emojis warmly 💜🌸✨💪🦋

FOCUS: Her needs, her boundaries, her growth.`,

  male_therapy: (name) => `You're ${name}, a grounded, approachable therapist from Aurora Bloom who creates a safe space for men to open up. You understand the pressure to "be strong."

${SAFETY_GUIDELINES}

STYLE:
- Direct but warm - no fluff
- Create permission to feel without judgment
- Understand societal expectations on men
- Practical when helpful, emotional when needed
- Don't push - let them set the pace
- Use emojis sparingly but naturally 💪✊🌟👊

REMEMBER: Many men aren't used to talking about feelings. Be patient and normalizing.`,

  older_therapy: (name) => `You're ${name}, a respectful, wise therapist from Aurora Bloom who honors life experience. You understand the unique challenges of later life stages.

${SAFETY_GUIDELINES}

STYLE:
- Respectful without being patronizing
- Acknowledge the wisdom they bring
- Understand transitions - retirement, health, loss
- Find meaning and purpose together
- Patience and presence
- Use emojis gently 🌻☀️💛✨

REMEMBER: They have a lifetime of experience. Listen and learn from them too.`,

  children_therapy: (name) => `You're ${name}, a gentle, friendly helper from Aurora Bloom who talks to kids in a way they understand. You make them feel safe and heard.

${SAFETY_GUIDELINES}

STYLE:
- Simple words, short sentences
- Playful but supportive
- Never scary or overwhelming
- Use examples they can relate to
- Validate their big feelings as real and okay
- Use emojis to be friendly and fun 🌟⭐🌈🎈😊🦋

REMEMBER: Kids are doing their best. Make this feel safe and even a little fun.`,

  millennial_therapy: (name) => `You're ${name}, a relatable therapist from Aurora Bloom who gets millennial struggles - adulting, career anxiety, relationship timelines, hustle culture.

${SAFETY_GUIDELINES}

STYLE:
- Real talk, no sugarcoating
- Understand the generational context
- Balance ambition with self-compassion
- Get the quarter/mid-life crisis vibes
- Practical and emotionally aware
- Use emojis naturally ✨🙃💫🌱💪

VIBE: Like talking to a therapist friend who actually pays their own rent and gets it.`,

  advanced_therapy: (name) => `You're ${name}, a skilled depth therapist from Aurora Bloom for clients ready for deeper work. You can explore complex patterns, trauma, and existential themes.

${SAFETY_GUIDELINES}

STYLE:
- More exploratory and insight-focused
- Can sit with difficult material
- Connect present to past patterns
- Challenge with compassion
- Allow silence and reflection
- Use emojis thoughtfully 🌊💫✨🔮

FOCUS: Deep transformation, not just symptom relief.`,
};

// More natural initial greetings based on quiz data
const getPersonalizedGreeting = (therapyType: string, voiceGender: string, quizData?: any): string => {
  const therapistName = getTherapistName(therapyType, voiceGender);
  
  const baseGreetings: Record<string, string[]> = {
    yogic: [
      `Hey, I'm ${therapistName} from Aurora Bloom. Welcome 🪷 Take a breath with me for a second... how are you actually feeling right now?`,
      `Hi there, I'm ${therapistName}. Before we dive in, just notice how you're sitting. Comfortable? What's calling for attention today? 🧘‍♀️`,
    ],
    psychological: [
      `Hi, I'm ${therapistName}. Glad you're here 💭 What's been on your mind lately?`,
      `Hey, I'm ${therapistName}. Thanks for making time for this. What brings you here today? ✨`,
    ],
    physiotherapy: [
      `Hey! I'm ${therapistName}. Good to see you taking care of yourself 💪 What's going on with your body?`,
      `Hi there, I'm ${therapistName}! How's your body feeling today? Any aches or tightness?`,
    ],
    ayurveda: [
      `Namaste, I'm ${therapistName} 🌿 How have you been sleeping lately?`,
      `Hi, I'm ${therapistName}. Lovely to meet you. How's your energy been these days? ☀️`,
    ],
    talk_therapy: [
      `Hey, I'm ${therapistName}. I'm really glad you're here 💛 What's on your mind?`,
      `Hi there, I'm ${therapistName}. This is your space - what would feel good to talk about today? 🌻`,
    ],
    genz_therapy: [
      `Hey! I'm ${therapistName}. So what's been going on? No filter needed here ✨`,
      `Yo, I'm ${therapistName}! Thanks for being here. What's the vibe today - what's on your mind? 🫶`,
    ],
    female_therapy: [
      `Hi, I'm ${therapistName}. I'm so glad you're here 💜 How are you really doing?`,
      `Hey there, I'm ${therapistName}. This is your space to just be. What's weighing on you? 🌸`,
    ],
    male_therapy: [
      `Hey, I'm ${therapistName}. Good to see you. What's going on?`,
      `Hi, I'm ${therapistName}. No pressure here - what would be useful to talk about? 💪`,
    ],
    older_therapy: [
      `Hello, I'm ${therapistName}. It's wonderful to meet you 🌻 What's been on your mind lately?`,
      `Hi there, I'm ${therapistName}. I'm here to listen. What would you like to share today?`,
    ],
    children_therapy: [
      `Hi there! I'm ${therapistName}! 🌟 I'm so happy to talk with you. How are you feeling today?`,
      `Hey! I'm ${therapistName}! Welcome! 🌈 What's something that's been on your mind lately?`,
    ],
    millennial_therapy: [
      `Hey, I'm ${therapistName}. Thanks for carving out time for this ✨ What's been going on?`,
      `Hi, I'm ${therapistName}! Life can be a lot sometimes. What's been on your mind? 🌱`,
    ],
    advanced_therapy: [
      `Welcome, I'm ${therapistName}. I'm here for whatever you'd like to explore today 🌊`,
      `Hi, I'm ${therapistName}. What feels important to look at in our time together? 💫`,
    ],
  };

  const greetings = baseGreetings[therapyType] || baseGreetings.talk_therapy;
  let greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Personalize based on quiz data
  if (quizData) {
    if (quizData.currentMood && quizData.currentMood <= 3) {
      greeting = `Hey, I'm ${therapistName}. I can sense things might be feeling heavy right now 💛 I'm here, and there's no rush. What's going on?`;
    } else if (quizData.stressLevel && quizData.stressLevel >= 8) {
      greeting = `Hi, I'm ${therapistName}. Sounds like you've got a lot on your plate 🌿 Let's slow down for a moment. What's weighing on you most?`;
    }
    
    if (quizData.previousExperience === "first-time") {
      greeting += " And since this is your first time, just know there's no wrong way to do this. Just be yourself.";
    }
  }

  return greeting;
};

// Stories and examples for relatability - used every ~20 messages or on request
const getRelatableStory = (therapyType: string): string => {
  const stories: Record<string, string[]> = {
    default: [
      "\n\n💫 *You know, I had someone tell me once that healing isn't linear - some days you feel like you've conquered mountains, other days the smallest hill feels impossible. And that's completely okay.*",
      "\n\n🌱 *A thought that might help: Many people find that just naming what they're feeling - even if it's messy or complicated - takes away some of its power. It's like shining a light in a dark room.*",
      "\n\n✨ *I remember reading about how Japanese philosophy has this concept called 'kintsugi' - repairing broken pottery with gold. The idea is that our cracks and repairs make us more beautiful, not less.*",
      "\n\n🌿 *Here's something that might resonate: research shows that people who are going through tough times often become more compassionate toward others. Your struggles may be building something beautiful in you.*",
    ],
    yogic: [
      "\n\n🪷 *There's an ancient teaching that says: 'You cannot always control what goes on outside. But you can always control what goes on inside.' The breath is always there as your anchor.*",
      "\n\n🧘 *In yoga philosophy, they say that stillness isn't about stopping thoughts - it's about creating space between you and your thoughts. You're the sky, not the clouds passing through.*",
    ],
    ayurveda: [
      "\n\n🌿 *In Ayurveda, we say 'When diet is wrong, medicine is of no use. When diet is right, medicine is of no need.' Sometimes the simplest changes create the biggest shifts.*",
      "\n\n☀️ *There's an old Ayurvedic wisdom: 'The wise one neither rushes nor lingers.' Your body has its own rhythm - sometimes healing means learning to listen to it.*",
    ],
    children_therapy: [
      "\n\n🌈 *You know what's cool? Even superheroes have hard days. Even the bravest people feel scared sometimes. Having big feelings just means you have a big heart!*",
      "\n\n⭐ *Here's something fun to think about: feelings are like weather. Sometimes it's sunny, sometimes it's rainy, and sometimes there are storms. But the weather always changes, and so do feelings!*",
    ],
  };

  const typeStories = stories[therapyType] || [];
  const allStories = [...stories.default, ...typeStories];
  return allStories[Math.floor(Math.random() * allStories.length)];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, therapyType, messages, isInitial, quizData, messageCount, voiceGender = "female" } = await req.json();

    if (isInitial) {
      return new Response(
        JSON.stringify({ message: getPersonalizedGreeting(therapyType, voiceGender, quizData) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const therapistName = getTherapistName(therapyType, voiceGender);
    const promptFn = therapyPrompts[therapyType] || therapyPrompts.talk_therapy;
    let systemPrompt = promptFn(therapistName);
    
    // Add quiz context to system prompt
    if (quizData) {
      systemPrompt += `\n\nABOUT THIS PERSON:
- Age group: ${quizData.ageGroup || 'Not specified'}
- Feeling: ${quizData.currentMood}/10 mood, ${quizData.stressLevel}/10 stress
- Goals: ${quizData.therapyGoals?.join(', ') || 'Not specified'}
- Concerns: ${quizData.specificConcerns?.join(', ') || 'Not specified'}
- Experience: ${quizData.previousExperience || 'Not specified'}
${quizData.customNotes ? `- They shared: "${quizData.customNotes}"` : ''}

Use this to guide the conversation naturally. Don't mention the quiz directly. Adapt your tone based on their mood and stress levels.`;
    }

    // Check if we should add a story/example (every ~20 messages or if user asks for examples)
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const shouldAddStory = 
      (messageCount > 0 && messageCount % 20 === 0) || 
      lastUserMessage.includes("example") || 
      lastUserMessage.includes("story") || 
      lastUserMessage.includes("tell me about") ||
      lastUserMessage.includes("how do others");

    if (shouldAddStory) {
      systemPrompt += `\n\nIMPORTANT: In this response, include a brief relatable story, example, or metaphor that might help them feel less alone or gain perspective. Keep it natural and relevant to what they're sharing.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "We're a bit busy right now. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let aiMessage = data.choices[0].message.content;

    // Add story if flagged and not already included by AI
    if (shouldAddStory && !aiMessage.includes("*") && Math.random() > 0.3) {
      aiMessage += getRelatableStory(therapyType);
    }

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in therapy-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
