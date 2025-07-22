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
  correctness: z.number().describe('The level of correctness of the answer (0-1).'),
  usefulness: z.number().describe('The level of usefulness of the answer (0-1).'),
});
export type AnswerQuestionsOutput = z.infer<typeof AnswerQuestionsOutputSchema>;

export async function answerQuestions(input: AnswerQuestionsInput): Promise<AnswerQuestionsOutput> {
  return answerQuestionsFlow(input);
}

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: AnswerQuestionsInputSchema},
  output: {schema: AnswerQuestionsOutputSchema},
  prompt: `You are an expert in the topic of {{topic}}. Please answer the following question about the topic:

Question: {{{question}}}

After answering the question, please evaluate the correctness and usefulness of your answer on a scale of 0 to 1, with 1 being the most correct/useful. Return a JSON object with the answer, correctness and usefulness.

Here is the answer in JSON:
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
    const {output} = await answerQuestionPrompt(input);
    return output!;
  }
);
