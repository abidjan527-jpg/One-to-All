import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/logger';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicChatParams {
  model: string;
  messages: ChatMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
}

export class AnthropicService {
  async chatCompletion(params: AnthropicChatParams): Promise<any> {
    try {
      const response = await client.messages.create({
        model: params.model,
        max_tokens: params.max_tokens,
        messages: params.messages,
        system: params.system,
        temperature: params.temperature || 0.7,
      });

      logger.info(`Anthropic - Model: ${params.model}, Stop Reason: ${response.stop_reason}`);

      return {
        id: response.id,
        model: response.model,
        choices: [{
          message: {
            role: 'assistant',
            content: response.content[0].type === 'text' ? response.content[0].text : '',
          },
          finish_reason: response.stop_reason,
          index: 0,
        }],
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error('Anthropic API Error:', error);
      throw error;
    }
  }

  async streamCompletion(params: AnthropicChatParams): Promise<AsyncIterable<string>> {
    try {
      return await client.messages.stream({
        model: params.model,
        max_tokens: params.max_tokens,
        messages: params.messages,
        system: params.system,
        temperature: params.temperature || 0.7,
      }).on('text', (text: string) => {
        logger.debug(`Stream chunk: ${text.substring(0, 50)}...`);
      });
    } catch (error) {
      logger.error('Anthropic Stream Error:', error);
      throw error;
    }
  }

  getAvailableModels(): string[] {
    return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
  }
}

export const anthropicService = new AnthropicService();
