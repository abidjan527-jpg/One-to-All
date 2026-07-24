import { logger } from '../config/logger';
import { openaiService } from './openai.service';
import { anthropicService } from './anthropic.service';
import { googleService } from './google.service';

export interface AIRequest {
  model: string;
  messages: any[];
  temperature?: number;
  max_tokens?: number;
  [key: string]: any;
}

export class AIRouterService {
  private modelProviderMap = {
    // OpenAI Models
    'gpt-4': 'openai',
    'gpt-4-turbo': 'openai',
    'gpt-3.5-turbo': 'openai',
    'text-davinci-003': 'openai',

    // Anthropic Claude Models
    'claude-3-opus-20240229': 'anthropic',
    'claude-3-sonnet-20240229': 'anthropic',
    'claude-3-haiku-20240307': 'anthropic',

    // Google Gemini Models
    'gemini-1.5-pro': 'google',
    'gemini-1.5-flash': 'google',
    'gemini-pro': 'google',
    'gemini-pro-vision': 'google',
  };

  async handleChatCompletion(request: AIRequest): Promise<any> {
    const provider = this.getProvider(request.model);

    logger.info(`Routing request to ${provider} - Model: ${request.model}`);

    try {
      switch (provider) {
        case 'openai':
          return await openaiService.chatCompletion(request);
        case 'anthropic':
          return await anthropicService.chatCompletion({
            ...request,
            max_tokens: request.max_tokens || 1024,
          });
        case 'google':
          return await googleService.chatCompletion({
            ...request,
            max_output_tokens: request.max_tokens,
          });
        default:
          throw new Error(`Unknown provider for model: ${request.model}`);
      }
    } catch (error) {
      logger.error(`Error with ${provider}:`, error);
      throw error;
    }
  }

  async handleEmbeddings(text: string[], model: string = 'text-embedding-3-small'): Promise<number[][]> {
    const provider = this.getProvider(model);

    logger.info(`Routing embeddings request to ${provider} - Model: ${model}`);

    try {
      switch (provider) {
        case 'openai':
          return await openaiService.generateEmbeddings(text);
        case 'google':
          return await googleService.generateEmbeddings(text);
        default:
          throw new Error(`Embeddings not supported for provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`Error generating embeddings with ${provider}:`, error);
      throw error;
    }
  }

  async handleImageGeneration(
    prompt: string,
    model: string = 'dall-e-3',
    n: number = 1,
    size: string = '1024x1024'
  ): Promise<string[]> {
    const provider = this.getProvider(model);

    logger.info(`Routing image generation to ${provider} - Model: ${model}`);

    try {
      switch (provider) {
        case 'openai':
          return await openaiService.generateImage(prompt, n, size);
        default:
          throw new Error(`Image generation not supported for provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`Error generating image with ${provider}:`, error);
      throw error;
    }
  }

  getProvider(model: string): string {
    return this.modelProviderMap[model as keyof typeof this.modelProviderMap] || 'openai';
  }

  getAllAvailableModels(): any[] {
    return [
      {
        provider: 'openai',
        models: openaiService.getAvailableModels(),
      },
      {
        provider: 'anthropic',
        models: anthropicService.getAvailableModels(),
      },
      {
        provider: 'google',
        models: googleService.getAvailableModels(),
      },
    ];
  }

  isModelSupported(model: string): boolean {
    return model in this.modelProviderMap;
  }
}

export const aiRouterService = new AIRouterService();
