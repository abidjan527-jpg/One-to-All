import { Router, Request, Response } from 'express';
import { aiRouterService } from '../services/ai-router.service';
import { validateChatRequest, validateEmbeddingsRequest } from '../middleware/validation.middleware';
import { logger } from '../config/logger';

export const aiRouter = Router();

/**
 * POST /api/chat
 * Chat completions endpoint
 */
aiRouter.post('/', validateChatRequest, async (req: Request, res: Response) => {
  try {
    const { model, messages, temperature, max_tokens } = req.body;

    // Validate model is supported
    if (!aiRouterService.isModelSupported(model)) {
      return res.status(400).json({
        error: 'Invalid model',
        message: `Model '${model}' is not supported`,
        availableModels: aiRouterService.getAllAvailableModels(),
      });
    }

    const startTime = Date.now();

    const response = await aiRouterService.handleChatCompletion({
      model,
      messages,
      temperature,
      max_tokens,
    });

    const duration = Date.now() - startTime;

    logger.info(`Chat completion successful - Duration: ${duration}ms, Tokens: ${response.usage?.total_tokens}`);

    res.json({
      ...response,
      metadata: {
        duration_ms: duration,
        provider: aiRouterService.getProvider(model),
      },
    });
  } catch (error: any) {
    logger.error('Chat completion error:', error);
    res.status(500).json({
      error: 'Chat completion failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/embeddings
 * Generate embeddings endpoint
 */
aiRouter.post('/embeddings', validateEmbeddingsRequest, async (req: Request, res: Response) => {
  try {
    const { input, model = 'text-embedding-3-small' } = req.body;

    const texts = Array.isArray(input) ? input : [input];

    const startTime = Date.now();

    const embeddings = await aiRouterService.handleEmbeddings(texts, model);

    const duration = Date.now() - startTime;

    res.json({
      data: embeddings.map((embedding, index) => ({
        object: 'embedding',
        embedding,
        index,
      })),
      model,
      usage: {
        prompt_tokens: texts.length,
        total_tokens: texts.length,
      },
      metadata: {
        duration_ms: duration,
        provider: aiRouterService.getProvider(model),
      },
    });
  } catch (error: any) {
    logger.error('Embeddings error:', error);
    res.status(500).json({
      error: 'Embeddings generation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/images/generate
 * Generate images endpoint
 */
aiRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, model = 'dall-e-3', n = 1, size = '1024x1024' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Prompt is required',
      });
    }

    const startTime = Date.now();

    const urls = await aiRouterService.handleImageGeneration(prompt, model, n, size);

    const duration = Date.now() - startTime;

    res.json({
      data: urls.map((url, index) => ({
        url,
        index,
      })),
      model,
      created: new Date().toISOString(),
      metadata: {
        duration_ms: duration,
        provider: aiRouterService.getProvider(model),
      },
    });
  } catch (error: any) {
    logger.error('Image generation error:', error);
    res.status(500).json({
      error: 'Image generation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/completions
 * Text completions endpoint
 */
aiRouter.post('/completions', async (req: Request, res: Response) => {
  try {
    const { model, prompt, max_tokens = 500, temperature = 0.7 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Prompt is required',
      });
    }

    const response = await aiRouterService.handleChatCompletion({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
    });

    res.json(response);
  } catch (error: any) {
    logger.error('Completions error:', error);
    res.status(500).json({
      error: 'Completions failed',
      message: error.message,
    });
  }
});
