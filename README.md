# One-to-All 🚀
**Unified AI Models Integration Platform**

All AI models and many more at one place - a comprehensive platform that integrates multiple AI providers into a single, easy-to-use interface.

## 🎯 Features

- **Multi-AI Support**: OpenAI (GPT-4, GPT-3.5), Google Gemini, Anthropic Claude, Llama, Cohere, and more
- **Unified API**: Single interface to interact with all AI models
- **Auto-Scaling**: Kubernetes-based deployment with Google Cloud integration
- **Load Balancing**: Intelligent routing across multiple AI providers
- **Rate Limiting**: Built-in throttling and quota management
- **Caching**: Redis integration for response caching
- **Monitoring**: Prometheus metrics and logging
- **Multi-tenant**: Support for multiple users and API keys
- **Docker Ready**: Containerized deployment with CI/CD pipelines

## 📋 Table of Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Usage](#api-usage)
- [Supported Models](#supported-models)
- [Deployment](#deployment)
- [Development](#development)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Unified AI Gateway API                     │
│  - Authentication & Authorization                      │
│  - Request Routing & Load Balancing                    │
│  - Rate Limiting & Quota Management                    │
└──────────────────────┬──────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
    ┌──▼──┐       ┌────▼─────┐   ┌────▼────┐
    │ LLM │       │ Semantic  │   │ Vision  │
    │Cache│       │ Search    │   │ Models  │
    └─────┘       └───────────┘   └─────────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
       ┌───────────────┼───────────────────────┐
       │               │                       │
  ┌────▼────┐   ┌─────▼──────┐   ┌──────▼────┐
  │ OpenAI  │   │   Google   │   │ Anthropic│
  │ (GPT-4) │   │  (Gemini)  │   │ (Claude) │
  └─────────┘   └────────────┘   └──────────┘
```

## 🚀 Installation

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Kubernetes cluster (for production)
- Redis (optional, for caching)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/abidjan527-jpg/One-to-All.git
cd One-to-All

# Install dependencies
npm install
# or
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit and configure your API keys
nano .env

# Start the application
npm start
# or
python app.py
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# API Keys
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...

# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/onetoall
REDIS_URL=redis://localhost:6379

# Google Cloud (for GKE deployment)
GCP_PROJECT_ID=my-project
GCP_REGION=us-central1
```

## 🤖 Supported Models

### LLM (Language Models)
- **OpenAI**: GPT-4, GPT-3.5-turbo, Text-davinci-003
- **Google**: Gemini Pro, Gemini Pro Vision
- **Anthropic**: Claude 3 (Opus, Sonnet, Haiku)
- **Meta**: Llama 2, Llama 3
- **Cohere**: Command, Command Light
- **Mistral**: Mistral 7B, Mixtral 8x7B

### Vision Models
- OpenAI DALL-E 3
- Google Vertex AI Vision
- Anthropic Claude Vision
- Stability AI Stable Diffusion XL

### Embedding Models
- OpenAI Embeddings
- Google Universal Sentence Encoder
- Cohere Embeddings

### Speech Models
- OpenAI Whisper (transcription)
- Google Cloud Speech-to-Text
- Assembly AI

## 📡 API Usage

### Basic Request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

### Node.js Example

```javascript
const OneToAll = require('one-to-all');

const client = new OneToAll({
  apiKey: process.env.ONE_TO_ALL_API_KEY
});

const response = await client.chat.completions.create({
  model: 'claude-3-opus',
  messages: [
    { role: 'user', content: 'What is quantum computing?' }
  ]
});

console.log(response.choices[0].message.content);
```

### Python Example

```python
from one_to_all import OneToAll

client = OneToAll(api_key='your-api-key')

response = client.chat.completions.create(
    model='gemini-pro',
    messages=[
        {'role': 'user', 'content': 'Explain machine learning'}
    ]
)

print(response.choices[0].message.content)
```

## 🐳 Deployment

### Docker Compose (Development)

```bash
docker-compose up -d
```

### Google Kubernetes Engine (Production)

```bash
# Update environment variables in .github/workflows/google.yml
export PROJECT_ID="your-gcp-project"
export GKE_CLUSTER="your-cluster"
export GKE_ZONE="us-central1-c"

# Deploy using GitHub Actions (push to main branch)
git push origin main
```

## 🔧 Development

```bash
# Install dev dependencies
npm install --save-dev

# Run tests
npm test

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

## 📊 Monitoring

Access monitoring dashboards:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Logs**: Check `logs/` directory

## 🛡️ Security

- API key rotation every 90 days
- Rate limiting: 100 req/min per user
- Input validation and sanitization
- CORS configuration
- SSL/TLS encryption
- Audit logging

## 📝 API Endpoints

- `POST /api/chat` - Chat completions
- `POST /api/completions` - Text completions
- `POST /api/embeddings` - Generate embeddings
- `POST /api/images/generate` - Generate images
- `POST /api/transcriptions` - Transcribe audio
- `GET /api/models` - List available models
- `GET /api/usage` - Get usage statistics
- `GET /health` - Health check

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 📞 Support

- 📧 Email: support@onetoall.dev
- 🐛 Issues: [GitHub Issues](https://github.com/abidjan527-jpg/One-to-All/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/abidjan527-jpg/One-to-All/discussions)

---

**Built with ❤️ by the One-to-All Team**
