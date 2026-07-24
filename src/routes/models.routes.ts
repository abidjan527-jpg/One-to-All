import { Router, Request, Response } from 'express';
import { aiRouterService } from '../services/ai-router.service';

export const modelsRouter = Router();

/**
 * GET /api/models
 * List all available AI models
 */
modelsRouter.get('/', (req: Request, res: Response) => {
  const models = aiRouterService.getAllAvailableModels();

  res.json({
    data: models,
    total: models.reduce((acc, m) => acc + m.models.length, 0),
    providers: models.map(m => m.provider),
  });
});

/**
 * GET /api/models/:provider
 * Get models from a specific provider
 */
modelsRouter.get('/:provider', (req: Request, res: Response) => {
  const { provider } = req.params;
  const allModels = aiRouterService.getAllAvailableModels();
  const providerModels = allModels.find(m => m.provider === provider);

  if (!providerModels) {
    return res.status(404).json({
      error: 'Provider not found',
      message: `Provider '${provider}' is not available`,
      availableProviders: allModels.map(m => m.provider),
    });
  }

  res.json(providerModels);
});
