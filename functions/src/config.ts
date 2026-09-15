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
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';
// Nomes históricos (podem ser descontinuados); a descoberta via /models é a fonte real
const GROQ_PREFERRED = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'groq/compound-mini',
];

let cachedGroqModel: string | null = null;

/** Descobre um modelo de chat válido na conta Groq (o catálogo muda; nomes fixos quebram). */
export async function getGroqModel(key: string): Promise<string> {
  if (cachedGroqModel) return cachedGroqModel;
  try {
    const res = await fetch(GROQ_MODELS_URL, {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`models ${res.status}`);
    const j: any = await res.json();
    const ids: string[] = (j.data || []).map((m: any) => m.id).filter(Boolean);
    // prefere conhecidos, senão primeiro modelo de chat (exclui whisper/tts/guard)
    for (const pref of GROQ_PREFERRED) {
      if (ids.includes(pref)) { cachedGroqModel = pref; return pref; }
    }
    const chat = ids.find((id) => /llama|qwen|mixtral|gemma|gpt-oss|kimi|deepseek/i.test(id) && !/whisper|tts|guard|moderation/i.test(id));
    cachedGroqModel = chat || ids[0];
    if (!cachedGroqModel) throw new Error('catálogo vazio');
    console.log(`[groq] modelo auto-detectado: ${cachedGroqModel}`);
    return cachedGroqModel;
  } catch (e: any) {
    // último recurso: tenta preferidos em ordem (compat com comportamento anterior)
    console.warn('[groq] falha ao listar modelos, usando preferido:', e?.message);
    cachedGroqModel = GROQ_PREFERRED[0];
    return cachedGroqModel;
  }
}

export async function callGroqWithFallback(prompt: string, systemInstruction: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY ausente');
  const model = await getGroqModel(key);
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    // se o modelo cacheado foi removido, invalida e tenta uma vez com redescoberta
    if (res.status === 404) {
      cachedGroqModel = null;
      const txt = await res.text();
      throw new Error(`Groq 404 modelo '${model}' inválido: ${txt.slice(0,200)}`);
    }
    const txt = await res.text();
    throw new Error(`Groq ${res.status}: ${txt.slice(0,200)}`);
  }
  const j: any = await res.json();
  return j.choices?.[0]?.message?.content ?? '';
}
