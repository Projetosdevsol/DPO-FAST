import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';

// Inicializa Firebase Admin
const app = initializeApp();
export const db = getFirestore(app);

// Inicializa Google AI diretamente
export const genai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

export const MODEL = 'gemini-2.0-flash';
export const GROQ_MODEL = 'llama-3.1-8b-instant';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// force redeploy 2026-09-14T20:30 Groq fallback + RAG top-k

export async function callGroqWithFallback(prompt: string, systemInstruction: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY ausente');
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq ${res.status}: ${txt.slice(0,200)}`);
  }
  const j: any = await res.json();
  return j.choices?.[0]?.message?.content ?? '';
}
