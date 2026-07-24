import { VertexAI } from '@google-cloud/vertexai';
import { logger } from '../config/logger';

const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_REGION || 'us-central1',
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GoogleChatParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  top_k?: number;
}

export class GoogleService {
  async chatCompletion(params: GoogleChatParams): Promise<any> {
    try {
      const model = vertexAI.getGenerativeModel({
        model: params.model,
      });

      const history = params.messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const lastMessage = params.messages[params.messages.length - 1];

      const response = await model.generateContent({
        contents: [
          ...history,
          {
            role: 'user',
            parts: [{ text: lastMessage.content }],
          },
        ],
        generationConfig: {
          temperature: params.temperature || 0.7,
          maxOutputTokens: params.max_output_tokens || 500,
          topP: params.top_p,
          topK: params.top_k,
        },
      });

      const textContent = response.response.candidates?.[0].content?.parts?.[0];
      const responseText = textContent?.text || '';

      logger.info(`Google Gemini - Model: ${params.model}`);

      return {
        id: `google-${Date.now()}`,
        model: params.model,
        choices: [{
          message: {
            role: 'assistant',
            content: responseText,
          },
          finish_reason: 'stop',
          index: 0,
        }],
        usage: {
          prompt_tokens: 0, // Google doesn't provide this in basic response
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    } catch (error) {
      logger.error('Google API Error:', error);
      throw error;
    }
  }

  async generateEmbeddings(text: string[]): Promise<number[][]> {
    try {
      const model = vertexAI.getGenerativeModel({
        model: 'text-embedding-004',
      });

      const embeddings = await Promise.all(
        text.map(async (t) => {
          const result = await model.embedContent({
            content: { parts: [{ text: t }] },
          });
          return result.embedding?.values || [];
        })
      );

      return embeddings;
    } catch (error) {
      logger.error('Google Embeddings Error:', error);
      throw error;
    }
  }

  getAvailableModels(): string[] {
    return [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-pro-vision',
    ];
  }
}

export const googleService = new GoogleService();
