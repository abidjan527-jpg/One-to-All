# ChatGPT Integration Guide

This document explains how to connect ChatGPT to the One-to-All unified AI platform.

## Overview

The One-to-All platform now provides a unified API endpoint that ChatGPT can use to access multiple AI models (OpenAI, Anthropic Claude, Google Gemini, Cohere, and more) through a single gateway.

## Prerequisites

- Node.js 18+
- API keys for the AI providers you want to use:
  - **OpenAI** (required): https://platform.openai.com/api-keys
  - **Anthropic** (optional): https://console.anthropic.com/
  - **Google** (optional): https://cloud.google.com/
  - **Cohere** (optional): https://dashboard.cohere.ai/

## Setup Steps

### 1. Clone and Setup Repository

```bash
git clone https://github.com/abidjan527-jpg/One-to-All.git
cd One-to-All
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# REQUIRED - OpenAI API Key
OPENAI_API_KEY=sk-your-actual-key

# OPTIONAL - Additional providers
ANTHROPIC_API_KEY=sk-ant-your-key
GOOGLE_API_KEY=your-google-key
COHERE_API_KEY=your-cohere-key

# Server Settings
PORT=3000
NODE_ENV=production
```

### 3. Build and Start the Server

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

Verify it's running:
```bash
curl http://localhost:3000/health
```

## API Endpoints

### Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 123.45
}
```

### List Available Models
```bash
GET /api/models
```
Response:
```json
{
  "llm": [
    { "id": "gpt-4", "provider": "OpenAI", "name": "GPT-4" },
    { "id": "claude-3-opus", "provider": "Anthropic", "name": "Claude 3 Opus" },
    { "id": "gemini-pro", "provider": "Google", "name": "Gemini Pro" }
  ],
  "vision": [...],
  "embedding": [...]
}
```

### Chat Completions (ChatGPT Integration)
```bash
POST /api/chat
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

Response:
```json
{
  "id": "chatcmpl-abc123",
  "model": "gpt-4",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I'm doing well, thank you for asking!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  },
  "created": 1705320600
}
```

### Text Completions
```bash
POST /api/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "prompt": "Write a haiku about AI",
  "max_tokens": 100,
  "temperature": 0.7
}
```

### Embeddings
```bash
POST /api/embeddings
Content-Type: application/json

{
  "input": "Your text here",
  "model": "text-embedding-3-small"
}
```

## Using with ChatGPT

### Option 1: Through Custom Actions (GPT-4 with Plugins)

1. Create a ChatGPT custom action:
   - Name: "One-to-All AI Gateway"
   - URL: `http://your-server.com` (your One-to-All server)
   - Authentication: API Key (if you want to secure it)

2. Instruct ChatGPT to call:
   ```
   POST /api/chat with model selection
   ```

### Option 2: Direct API Call from ChatGPT

Ask ChatGPT to call your API:
```
Please call http://localhost:3000/api/chat with:
{
  "model": "claude-3-opus",
  "messages": [{"role": "user", "content": "What is machine learning?"}],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Option 3: Use ChatGPT Connector Module

```typescript
import ChatGPTConnector from 'one-to-all';

const connector = new ChatGPTConnector({
  baseUrl: 'http://localhost:3000',
  apiKey: 'optional-key'
});

// Get available models
const models = await connector.getAvailableModels();

// Send chat request
const response = await connector.chat({
  model: 'claude-3-opus',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  max_tokens: 2048
});

console.log(response.choices[0].message.content);
```

## Supported Models

### Language Models (LLM)
- **OpenAI**: gpt-4, gpt-3.5-turbo
- **Anthropic**: claude-3-opus, claude-3-sonnet, claude-3-haiku
- **Google**: gemini-pro
- **Cohere**: command

### Vision Models
- dall-e-3 (OpenAI)
- gemini-pro-vision (Google)

### Embedding Models
- text-embedding-3-small (OpenAI)
- text-embedding-3-large (OpenAI)

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable in `server.ts`

## Security Notes

- Keep API keys secure - never commit them to version control
- Use environment variables for all sensitive data
- Enable CORS only for trusted origins
- Use HTTPS in production
- Rotate API keys regularly
- Set up rate limiting for public endpoints

## Docker Deployment

```bash
# Build Docker image
docker build -t one-to-all .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-xxx \
  -e ANTHROPIC_API_KEY=sk-ant-xxx \
  one-to-all
```

## Troubleshooting

### "API key not configured" error
- Verify your `.env` file has the correct API key
- Check that you've run `npm run build` after updating `.env`
- Restart the server

### "Model not found" error
- Ensure the model is listed in `/api/models`
- Verify you have the correct API key for that provider
- Check the model name spelling

### Connection refused
- Verify the server is running on the correct port
- Check if the port is already in use
- Make sure your firewall allows the connection

### Rate limit exceeded
- Wait for the rate limit window to reset
- Implement exponential backoff in your client
- Contact support to increase limits

## Support

For issues or questions:
- 📧 Email: support@onetoall.dev
- 🐛 Issues: https://github.com/abidjan527-jpg/One-to-All/issues
- 💬 Discussions: https://github.com/abidjan527-jpg/One-to-All/discussions

## Examples

### Example 1: Simple Chat
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "What is AI?"}
    ]
  }'
```

### Example 2: Stream Response (with ChatGPT)
ChatGPT can set up streaming requests:
```bash
POST /api/chat
{
  "model": "claude-3-opus",
  "messages": [...],
  "stream": true
}
```

### Example 3: Using Different Providers
```typescript
// Switch between providers without changing code
const providers = ['gpt-4', 'claude-3-opus', 'gemini-pro'];

for (const model of providers) {
  const response = await connector.chat({
    model,
    messages: [{ role: 'user', content: 'Test' }]
  });
  console.log(`${model}: ${response.choices[0].message.content}`);
}
```

---

**Made with ❤️ for the One-to-All Community**
