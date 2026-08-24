import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ============================================
// CHATGPT INTEGRATION ENDPOINTS
// ============================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// List all available models
app.get('/api/models', (req: Request, res: Response) => {
  const models = {
    llm: [
      { id: 'gpt-4', provider: 'OpenAI', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', provider: 'OpenAI', name: 'GPT-3.5 Turbo' },
      { id: 'claude-3-opus', provider: 'Anthropic', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet', provider: 'Anthropic', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku', provider: 'Anthropic', name: 'Claude 3 Haiku' },
      { id: 'gemini-pro', provider: 'Google', name: 'Gemini Pro' },
      { id: 'command', provider: 'Cohere', name: 'Command' },
    ],
    vision: [
      { id: 'dall-e-3', provider: 'OpenAI', name: 'DALL-E 3' },
      { id: 'gemini-pro-vision', provider: 'Google', name: 'Gemini Pro Vision' },
    ],
    embedding: [
      { id: 'text-embedding-3-small', provider: 'OpenAI', name: 'Text Embedding 3 Small' },
      { id: 'text-embedding-3-large', provider: 'OpenAI', name: 'Text Embedding 3 Large' },
    ],
  };
  res.json(models);
});

// ChatGPT Chat Completions Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  
  try {
    const { model, messages, temperature = 0.7, max_tokens = 2048 } = req.body;

    // Validation
    if (!model) {
      return res.status(400).json({ error: 'Model parameter is required' });
    }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    logger.info(`[${requestId}] Chat request received - Model: ${model}`);

    let response;

    // Route to appropriate provider
    if (model.startsWith('gpt')) {
      response = await handleOpenAI(model, messages, temperature, max_tokens);
    } else if (model.startsWith('claude')) {
      response = await handleAnthropic(model, messages, temperature, max_tokens);
    } else if (model.startsWith('gemini')) {
      response = await handleGoogle(model, messages, temperature, max_tokens);
    } else if (model.startsWith('command')) {
      response = await handleCohere(model, messages, temperature, max_tokens);
    } else {
      return res.status(400).json({ error: `Unsupported model: ${model}` });
    }

    logger.info(`[${requestId}] Chat response generated successfully`);
    
    res.json({
      id: requestId,
      model,
      choices: response.choices,
      usage: response.usage,
      created: Math.floor(Date.now() / 1000),
    });
  } catch (error: any) {
    logger.error(`[${requestId}] Error processing chat request:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      requestId,
    });
  }
});

// Text Completions Endpoint
app.post('/api/completions', async (req: Request, res: Response) => {
  try {
    const { model, prompt, max_tokens = 512, temperature = 0.7 } = req.body;

    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }

    logger.info(`Completion request - Model: ${model}`);

    // Convert prompt to messages format for consistency
    const messages = [{ role: 'user', content: prompt }];
    
    let response;
    if (model.startsWith('gpt')) {
      response = await handleOpenAI(model, messages, temperature, max_tokens);
    } else if (model.startsWith('claude')) {
      response = await handleAnthropic(model, messages, temperature, max_tokens);
    } else {
      return res.status(400).json({ error: `Unsupported model: ${model}` });
    }

    res.json({
      id: uuidv4(),
      model,
      text: response.choices[0]?.message?.content || '',
      usage: response.usage,
    });
  } catch (error: any) {
    logger.error('Error processing completion request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Embeddings Endpoint
app.post('/api/embeddings', async (req: Request, res: Response) => {
  try {
    const { input, model = 'text-embedding-3-small' } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    logger.info(`Embeddings request - Model: ${model}`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const response = await axios.post('https://api.openai.com/v1/embeddings', {
      model,
      input: Array.isArray(input) ? input : [input],
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    res.json({
      data: response.data.data,
      model,
      usage: response.data.usage,
    });
  } catch (error: any) {
    logger.error('Error processing embeddings request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PROVIDER HANDLERS
// ============================================

async function handleOpenAI(
  model: string,
  messages: any[],
  temperature: number,
  max_tokens: number
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model,
    messages,
    temperature,
    max_tokens,
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    choices: response.data.choices.map((choice: any) => ({
      message: {
        role: 'assistant',
        content: choice.message.content,
      },
      finish_reason: choice.finish_reason,
    })),
    usage: {
      prompt_tokens: response.data.usage.prompt_tokens,
      completion_tokens: response.data.usage.completion_tokens,
      total_tokens: response.data.usage.total_tokens,
    },
  };
}

async function handleAnthropic(
  model: string,
  messages: any[],
  temperature: number,
  max_tokens: number
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model,
    max_tokens,
    temperature,
    messages,
  }, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
  });

  return {
    choices: [{
      message: {
        role: 'assistant',
        content: response.data.content[0].text,
      },
      finish_reason: response.data.stop_reason,
    }],
    usage: {
      prompt_tokens: response.data.usage.input_tokens,
      completion_tokens: response.data.usage.output_tokens,
      total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
    },
  };
}

async function handleGoogle(
  model: string,
  messages: any[],
  temperature: number,
  max_tokens: number
) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  // Convert messages to Google format
  const contents = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: max_tokens,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    choices: [{
      message: {
        role: 'assistant',
        content: response.data.candidates[0].content.parts[0].text,
      },
      finish_reason: response.data.candidates[0].finishReason,
    }],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

async function handleCohere(
  model: string,
  messages: any[],
  temperature: number,
  max_tokens: number
) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error('Cohere API key not configured');
  }

  // Extract the last user message as the prompt
  const prompt = messages[messages.length - 1]?.content || '';

  const response = await axios.post('https://api.cohere.ai/v1/generate', {
    model,
    prompt,
    max_tokens,
    temperature,
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    choices: [{
      message: {
        role: 'assistant',
        content: response.data.generations[0].text,
      },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Available models: http://localhost:${PORT}/api/models`);
});

export default app;
