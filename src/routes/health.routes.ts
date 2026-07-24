import { Router, Request, Response } from 'express';

export const healthRouter = Router();

/**
 * GET /health
 * Health check endpoint
 */
healthRouter.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * GET /health/ready
 * Readiness check
 */
healthRouter.get('/ready', (req: Request, res: Response) => {
  // Add database/service checks here
  res.json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/live
 * Liveness check
 */
healthRouter.get('/live', (req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});
