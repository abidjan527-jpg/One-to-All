import 'express-async-errors';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

dotenv.config();

type ChatRole = 'system' | 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };
type Provider = 'openai' | 'anthropic' | 'google';

type ModelDefinition = {
  id: string;
  name: string;
  provider: Provider;
  configured: boolean;
};

const app: Express = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    name: 'OpenAI',
    provider: 'openai',
    configured: Boolean(process.env.OPENAI_API_KEY),
  },
  {
    id: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
    name: 'Claude',
    provider: 'anthropic',
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
  },
  {
    id: process.env.GOOGLE_MODEL || 'gemini-2.0-flash',
    name: 'Gemini',
    provider: 'google',
    configured: Boolean(process.env.GOOGLE_API_KEY),
  },
];

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", 'https://pagead2.googlesyndication.com'],
      connectSrc: ["'self'", 'https://pagead2.googlesyndication.com', 'https://googleads.g.doubleclick.net'],
      frameSrc: ["'self'", 'https://googleads.g.doubleclick.net', 'https://tpc.googlesyndication.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '*') === '*'
    ? true
    : (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()),
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT || 60),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));
app.use(express.static(PUBLIC_DIR, { maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));

function getProvider(model: string): Provider | undefined {
  return MODEL_DEFINITIONS.find((item) => item.id === model)?.provider;
}

function validateMessages(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return false;
  return value.every((message) => {
    if (!message || typeof message !== 'object') return false;
    const candidate = message as Partial<ChatMessage>;
    return ['system', 'user', 'assistant'].includes(candidate.role || '')
      && typeof candidate.content === 'string'
      && candidate.content.trim().length > 0
      && candidate.content.length <= 12000;
  });
}

function normalizeOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({ role: message.role, content: message.content }));
}

async function callOpenAI(model: string, messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI is not configured on the server.');

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: normalizeOpenAIMessages(messages),
      temperature: 0.7,
      max_tokens: 1600,
    },
    {
      timeout: 90000,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    },
  );

  return response.data.choices?.[0]?.message?.content || 'No response returned.';
}

async function callAnthropic(model: string, messages: ChatMessage[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Claude is not configured on the server.');

  const system = messages.filter((item) => item.role === 'system').map((item) => item.content).join('\n');
  const providerMessages = messages
    .filter((item) => item.role !== 'system')
    .map((item) => ({ role: item.role, content: item.content }));

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model, system: system || undefined, messages: providerMessages, max_tokens: 1600, temperature: 0.7 },
    {
      timeout: 90000,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data.content?.find((item: { type: string; text?: string }) => item.type === 'text')?.text
    || 'No response returned.';
}

async function callGoogle(model: string, messages: ChatMessage[]) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Gemini is not configured on the server.');

  const contents = messages
    .filter((item) => item.role !== 'system')
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    }));
  const systemText = messages.filter((item) => item.role === 'system').map((item) => item.content).join('\n');

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      contents,
      systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1600 },
    },
    {
      timeout: 90000,
      params: { key: apiKey },
      headers: { 'Content-Type': 'application/json' },
    },
  );

  return response.data.candidates?.[0]?.content?.parts?.map((item: { text?: string }) => item.text || '').join('')
    || 'No response returned.';
}

async function complete(model: string, messages: ChatMessage[]) {
  const provider = getProvider(model);
  if (!provider) throw new Error('Unsupported model.');
  if (provider === 'openai') return callOpenAI(model, messages);
  if (provider === 'anthropic') return callAnthropic(model, messages);
  return callGoogle(model, messages);
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '1.1.0',
    configuredProviders: MODEL_DEFINITIONS.filter((model) => model.configured).map((model) => model.provider),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/models', (_req: Request, res: Response) => {
  res.json({ models: MODEL_DEFINITIONS });
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const { model, messages } = req.body as { model?: string; messages?: unknown };
  if (!model || !getProvider(model)) {
    return res.status(400).json({ error: 'Choose a supported model.' });
  }
  if (!validateMessages(messages)) {
    return res.status(400).json({ error: 'Messages must be a non-empty valid chat history.' });
  }

  try {
    const content = await complete(model, messages);
    return res.json({
      id: uuidv4(),
      model,
      choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
      created: Math.floor(Date.now() / 1000),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'The provider request failed.';
    return res.status(502).json({ error: message });
  }
});

app.post('/api/multi-chat', async (req: Request, res: Response) => {
  const { models, messages } = req.body as { models?: unknown; messages?: unknown };
  if (!Array.isArray(models) || models.length === 0 || models.length > 3) {
    return res.status(400).json({ error: 'Choose between 1 and 3 models.' });
  }
  if (!models.every((model) => typeof model === 'string' && getProvider(model))) {
    return res.status(400).json({ error: 'One or more selected models are unsupported.' });
  }
  if (!validateMessages(messages)) {
    return res.status(400).json({ error: 'Messages must be a non-empty valid chat history.' });
  }

  const startedAt = Date.now();
  const results = await Promise.all(models.map(async (model) => {
    try {
      const content = await complete(model, messages);
      return { model, provider: getProvider(model), ok: true, content };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'The provider request failed.';
      return { model, provider: getProvider(model), ok: false, error: message };
    }
  }));

  return res.json({ id: uuidv4(), results, duration_ms: Date.now() - startedAt });
});

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((error: unknown, _req: Request, res: Response, _next: unknown) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  res.status(500).json({ error: message });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI ONE-TO-ALL is running on port ${PORT}`);
  });
}

export default app;
