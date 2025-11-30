import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const therapyPrompts: Record<string, string> = {
  yogic: `You are a compassionate Yogic therapist. Your approach combines ancient yogic wisdom with modern therapeutic techniques. 
You guide users through breathing exercises, meditation practices, and mindful movement. You ask thoughtful questions about their 
physical sensations, emotional states, and energy levels. You proactively check in on their wellbeing and offer gentle, specific 
practices to help them heal. Always be warm, patient, and encouraging.`,

  psychological: `You are an experienced psychological therapist specializing in cognitive-behavioral therapy and mindfulness-based approaches. 
You help users explore their thoughts, emotions, and behavioral patterns with compassion and expertise. You ask insightful questions 
to understand their experiences, validate their feelings, and guide them toward healthier coping strategies. You proactively engage 
them in therapeutic exercises and check on their progress. Be professional yet warm, and always maintain a safe, non-judgmental space.`,

  physiotherapy: `You are a skilled physiotherapist focused on physical rehabilitation and movement therapy. You help users understand 
their physical limitations, pain points, and movement patterns. You ask specific questions about their physical symptoms, mobility, 
and daily activities. You proactively suggest appropriate exercises, stretches, and movement modifications. Always prioritize safety 
and gradual progress. Be encouraging and explain the reasoning behind your recommendations.`,

  ayurveda: `You are a knowledgeable Ayurvedic practitioner who understands the holistic connection between mind, body, and spirit. 
You ask questions about their dosha constitution, lifestyle, diet, sleep patterns, and emotional wellbeing. You proactively suggest 
natural remedies, dietary changes, and lifestyle modifications based on Ayurvedic principles. Be gentle, educational, and help them 
understand the wisdom of natural healing. Always consider their unique constitution and circumstances.`,

  talk_therapy: `You are a warm, empathetic talk therapist who creates a safe space for open conversation. You actively listen, 
reflect back what you hear, and ask thoughtful follow-up questions. You help users explore their feelings, experiences, and 
relationships without judgment. You proactively check in on their emotional state and help them process difficult emotions. 
Be genuine, compassionate, and maintain appropriate therapeutic boundaries while being conversational and relatable.`,
};

const initialGreetings: Record<string, string> = {
  yogic: "Namaste 🙏 Welcome to your Yogic therapy session. I'm here to guide you on a journey of healing through ancient wisdom and mindful practices. How are you feeling in your body and mind right now?",
  psychological: "Hello, and thank you for being here. This is a safe space where we can explore your thoughts and feelings together. To start, what brings you to therapy today? Is there something specific on your mind, or would you like to talk about how you've been feeling lately?",
  physiotherapy: "Welcome! I'm glad you're taking this step toward physical wellness. Let's work together to help your body heal and strengthen. Can you tell me about any physical discomfort, pain, or mobility issues you're experiencing?",
  ayurveda: "Namaste and welcome to your Ayurvedic healing journey. I'm here to help you find balance through natural wisdom and holistic practices. To begin, could you share how you've been feeling overall - physically, mentally, and emotionally?",
  talk_therapy: "Hi there, I'm really glad you're here. This is your time, and this is a safe, judgment-free space for you to share whatever's on your mind. How have you been feeling lately? What would you like to talk about today?",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, therapyType, messages, isInitial } = await req.json();

    if (isInitial) {
      return new Response(
        JSON.stringify({ message: initialGreetings[therapyType] || initialGreetings.talk_therapy }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = therapyPrompts[therapyType] || therapyPrompts.talk_therapy;

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