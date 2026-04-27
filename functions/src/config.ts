import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Inicializa Firebase Admin
const app = initializeApp();
export const db = getFirestore(app);

/**
 * Inicializa Genkit com suporte ao Google AI.
 * Tentando a versão '-latest' do flash para resolver o 404 da API v1beta.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || 'BUILD_TIME_DUMMY_KEY'
    }),
  ],
  model: 'googleai/gemini-1.5-flash-latest',
});
