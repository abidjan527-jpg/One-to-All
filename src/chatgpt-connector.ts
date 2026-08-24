import axios, { AxiosInstance } from 'axios';
import winston from 'winston';

/**
 * ChatGPT Connector Module
 * Enables ChatGPT to communicate with the One-to-All unified API
 */

interface ChatGPTConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

class ChatGPTConnector {
  private client: AxiosInstance;
  private logger: winston.Logger;
  private config: ChatGPTConfig;

  constructor(config: ChatGPTConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });
  }

  /**
   * Send a chat request to the One-to-All API
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      this.logger.info(`ChatGPT -> One-to-All: Model=${request.model}`);

      const response = await this.client.post<ChatResponse>('/api/chat', request);

      this.logger.info(`ChatGPT <- One-to-All: Response received (${response.data.usage.total_tokens} tokens)`);

      return response.data;
    } catch (error: any) {
      this.logger.error('ChatGPT Connector Error:', error.message);
      throw new Error(`Failed to communicate with One-to-All API: ${error.message}`);
    }
  }

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<any> {
    try {
      const response = await this.client.get('/api/models');
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to fetch models:', error.message);
      throw new Error(`Failed to fetch available models: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Create embeddings
   */
  async createEmbeddings(input: string | string[], model: string = 'text-embedding-3-small'): Promise<any> {
    try {
      const response = await this.client.post('/api/embeddings', {
        input,
        model,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to create embeddings:', error.message);
      throw new Error(`Failed to create embeddings: ${error.message}`);
    }
  }
}

export default ChatGPTConnector;
export { ChatGPTConfig, ChatMessage, ChatRequest, ChatResponse };
