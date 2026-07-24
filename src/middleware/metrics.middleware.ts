import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'path'],
  buckets: [100, 300, 500, 1000, 3000, 5000],
});

const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total AI API requests',
  labelNames: ['model', 'provider', 'status'],
});

const tokensUsed = new Counter({
  name: 'ai_tokens_used_total',
  help: 'Total tokens used across all AI requests',
  labelNames: ['model', 'provider', 'type'],
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
    httpRequestDuration.observe(
      {
        method: req.method,
        path: req.path,
      },
      duration
    );
  });

  next();
};

export { httpRequestsTotal, httpRequestDuration, aiRequestsTotal, tokensUsed };
