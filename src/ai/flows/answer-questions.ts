// src/ai/flows/answer-questions.ts
'use server';
/**
 * @fileOverview A question answering AI agent.
 *
 * - answerQuestions - A function that handles the question answering process.
 * - AnswerQuestionsInput - The input type for the answerQuestions function.
 * - AnswerQuestionsOutput - The return type for the answerQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsInputSchema = z.object({
  topic: z.string().describe('The specific topic to ask questions about.'),
  question: z.string().describe('The question to be answered about the topic.'),
});
export type AnswerQuestionsInput = z.infer<typeof AnswerQuestionsInputSchema>;

const AnswerQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the topic.'),
});
export type AnswerQuestionsOutput = z.infer<typeof AnswerQuestionsOutputSchema>;

export async function answerQuestions(input: AnswerQuestionsInput): Promise<AnswerQuestionsOutput> {
  return answerQuestionsFlow(input);
}

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionsInputSchema},
  output: {schema: AnswerQuestionsOutputSchema},
  prompt: `Eres un experto en el tema de {{topic}}. Por favor, responde la siguiente pregunta sobre el tema:

Pregunta: {{{question}}}

Devuelve un objeto JSON con la respuesta.

Aquí está la respuesta en JSON:
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const answerQuestionsFlow = ai.defineFlow(
  {
    name: 'answerQuestionsFlow',
    inputSchema: AnswerQuestionsInputSchema,
    outputSchema: AnswerQuestionsOutputSchema,
  },
  async input => {
    const maxRetries = 3;
    const delayMs = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await answerQuestionPrompt(input);
        return output!;
      } catch (error: any) {
        if (i === maxRetries - 1) {
          // Si es el último intento, lanza el error
          throw error;
        }
        // Espera antes de volver a intentar
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    // Esto no debería suceder, pero TypeScript lo necesita
    throw new Error('No se pudo obtener una respuesta de la API después de varios intentos.');
  }
);
