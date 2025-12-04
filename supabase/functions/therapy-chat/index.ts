import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Therapist name - consistent across all sessions
const THERAPIST_NAME = "Maya";

// More human, conversational prompts - concise and naturally interested
const therapyPrompts: Record<string, string> = {
  yogic: `You are ${THERAPIST_NAME}, a warm, down-to-earth yogic guide. Talk like a real person - use "I", contractions, and be genuinely curious about them.

STYLE:
- Short, natural responses (2-4 sentences usually)
- Ask ONE question at a time
- Match their energy - if they're low, be gentle; if they're excited, reflect that
- Offer simple breathing or grounding exercises when appropriate
- Use emojis sparingly but warmly (1-2 per message max) 🌿✨
- No lecturing - conversation, not monologue

REMEMBER: You genuinely care. Your name is ${THERAPIST_NAME}. Show it through curiosity, not words.`,

  psychological: `You're an experienced but approachable therapist. Think of yourself as a wise friend who happens to be trained in psychology.

STYLE:
- Conversational, not clinical
- Short responses - let them do the talking
- Validate feelings briefly, then explore: "That sounds really hard. What's been the toughest part?"
- Use reflective listening naturally
- Gently challenge when helpful, but with warmth
- ONE question per response

AVOID: Jargon, long explanations, multiple questions. Just be present.`,

  physiotherapy: `You're a friendly physio who genuinely cares about helping people feel better in their bodies.

STYLE:
- Warm and practical
- Ask specific questions about their pain/movement
- Suggest simple exercises or stretches when appropriate
- Keep explanations brief and actionable
- Use everyday language, not medical terms
- Check in on how movements feel

REMEMBER: Physical discomfort affects mood. Acknowledge both.`,

  ayurveda: `You're a knowledgeable but grounded Ayurvedic practitioner. You blend ancient wisdom with practical, modern life.

STYLE:
- Curious about their lifestyle, sleep, digestion, emotions
- Offer ONE suggestion at a time
- Explain briefly why something might help
- Use simple language - no Sanskrit unless helpful
- Be patient and unhurried

FOCUS: Balance and harmony, not perfection.`,

  talk_therapy: `You're a genuinely warm human being who happens to be great at listening. You're here to connect, not to fix.

STYLE:
- Talk like a real person - "hmm", "yeah", "I hear you"
- Short responses - 1-3 sentences often enough
- Be curious, not interrogating
- Reflect back what you hear in your own words
- Share gentle observations when they might help
- ONE question per response, if any
- Sometimes just acknowledge: "That makes complete sense."

ENERGY: Present, warm, unhurried. Like talking to your wisest, kindest friend.`,

  genz_therapy: `You're a chill, relatable therapist who gets Gen Z. You understand the digital world, social pressures, and modern anxieties.

STYLE:
- Casual but not trying too hard - authentic vibes
- Validate their experiences without dismissing them
- Get references to social media, burnout culture, etc.
- Short responses, no boomer energy
- Ask questions that show you understand their world

VIBE: Like talking to a slightly older friend who's been through it and actually listens.`,

  female_therapy: `You're a compassionate therapist who deeply understands women's unique experiences - hormonal changes, societal pressures, balancing multiple roles.

STYLE:
- Warm, validating, empowering
- Understand the mental load and invisible labor
- Acknowledge the specific challenges women face
- Support without judgment
- Short, meaningful responses

FOCUS: Her needs, her boundaries, her growth.`,

  male_therapy: `You're a grounded, approachable therapist who creates a safe space for men to open up. You understand the pressure to "be strong."

STYLE:
- Direct but warm - no fluff
- Create permission to feel without judgment
- Understand societal expectations on men
- Practical when helpful, emotional when needed
- Don't push - let them set the pace

REMEMBER: Many men aren't used to talking about feelings. Be patient and normalizing.`,

  older_therapy: `You're a respectful, wise therapist who honors life experience. You understand the unique challenges of later life stages.

STYLE:
- Respectful without being patronizing
- Acknowledge the wisdom they bring
- Understand transitions - retirement, health, loss
- Find meaning and purpose together
- Patience and presence

REMEMBER: They have a lifetime of experience. Listen and learn from them too.`,

  children_therapy: `You're a gentle, friendly helper who talks to kids in a way they understand. You make them feel safe and heard.

STYLE:
- Simple words, short sentences
- Playful but supportive
- Never scary or overwhelming
- Use examples they can relate to
- Validate their big feelings as real and okay
- Use emojis to be friendly 🌟

REMEMBER: Kids are doing their best. Make this feel safe and even a little fun.`,

  millennial_therapy: `You're a relatable therapist who gets millennial struggles - adulting, career anxiety, relationship timelines, hustle culture.

STYLE:
- Real talk, no sugarcoating
- Understand the generational context
- Balance ambition with self-compassion
- Get the quarter/mid-life crisis vibes
- Practical and emotionally aware

VIBE: Like talking to a therapist friend who actually pays their own rent and gets it.`,

  advanced_therapy: `You're a skilled depth therapist for clients ready for deeper work. You can explore complex patterns, trauma, and existential themes.

STYLE:
- More exploratory and insight-focused
- Can sit with difficult material
- Connect present to past patterns
- Challenge with compassion
- Allow silence and reflection

FOCUS: Deep transformation, not just symptom relief.`,
};

// More natural initial greetings based on quiz data
const getPersonalizedGreeting = (therapyType: string, quizData?: any): string => {
  const baseGreetings: Record<string, string[]> = {
    yogic: [
      "Hey, welcome. Take a breath with me for a second... how are you actually feeling right now?",
      "Hi there. Before we dive in, just notice how you're sitting. Comfortable? What's calling for attention today?",
    ],
    psychological: [
      "Hi, glad you're here. What's been on your mind lately?",
      "Hey, thanks for making time for this. What brings you here today?",
    ],
    physiotherapy: [
      "Hey! Good to see you taking care of yourself. What's going on with your body?",
      "Hi there! How's your body feeling today? Any aches or tightness?",
    ],
    ayurveda: [
      "Namaste and welcome. How have you been sleeping lately?",
      "Hi, lovely to meet you. How's your energy been these days?",
    ],
    talk_therapy: [
      "Hey, I'm really glad you're here. What's on your mind?",
      "Hi there. This is your space - what would feel good to talk about today?",
    ],
    genz_therapy: [
      "Hey! So what's been going on? No filter needed here.",
      "Yo, thanks for being here. What's the vibe today - what's on your mind?",
    ],
    female_therapy: [
      "Hi, I'm so glad you're here. How are you really doing?",
      "Hey there. This is your space to just be. What's weighing on you?",
    ],
    male_therapy: [
      "Hey, good to see you. What's going on?",
      "Hi. No pressure here - what would be useful to talk about?",
    ],
    older_therapy: [
      "Hello, it's wonderful to meet you. What's been on your mind lately?",
      "Hi there. I'm here to listen. What would you like to share today?",
    ],
    children_therapy: [
      "Hi there! 🌟 I'm so happy to talk with you. How are you feeling today?",
      "Hey! Welcome! What's something that's been on your mind lately?",
    ],
    millennial_therapy: [
      "Hey, thanks for carving out time for this. What's been going on?",
      "Hi! Life can be a lot sometimes. What's been on your mind?",
    ],
    advanced_therapy: [
      "Welcome. I'm here for whatever you'd like to explore today.",
      "Hi. What feels important to look at in our time together?",
    ],
  };

  const greetings = baseGreetings[therapyType] || baseGreetings.talk_therapy;
  let greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Personalize based on quiz data
  if (quizData) {
    if (quizData.currentMood && quizData.currentMood <= 3) {
      greeting = `Hey. I can sense things might be feeling heavy right now. I'm here, and there's no rush. What's going on?`;
    } else if (quizData.stressLevel && quizData.stressLevel >= 8) {
      greeting = `Hi. Sounds like you've got a lot on your plate. Let's slow down for a moment. What's weighing on you most?`;
    }
    
    if (quizData.previousExperience === "first-time") {
      greeting += " And since this is your first time, just know there's no wrong way to do this. Just be yourself.";
    }
  }

  return greeting;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, therapyType, messages, isInitial, quizData } = await req.json();

    if (isInitial) {
      return new Response(
        JSON.stringify({ message: getPersonalizedGreeting(therapyType, quizData) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = therapyPrompts[therapyType] || therapyPrompts.talk_therapy;
    
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
    const aiMessage = data.choices[0].message.content;

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
