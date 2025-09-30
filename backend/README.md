# AI Model Playground - Backend

NestJS backend for comparing AI model responses in real-time via WebSocket streaming.

## Tech Stack

- **Framework:** NestJS with TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** Clerk (@clerk/backend)
- **Real-time:** Socket.IO (WebSockets)
- **AI Providers:**
  - Google Gemini (@google/genai)
  - Anthropic Claude (@anthropic-ai/sdk)

## Project Structure

```
src/
├── ai-providers/          # AI provider implementations
│   ├── interface/         # Provider interface and types
│   ├── providers/         # Google and Anthropic implementations
│   ├── ai-providers.module.ts
│   └── ai-providers.service.ts
├── auth/                  # Clerk authentication
│   ├── clerk.service.ts   # Token verification
│   ├── clerk.middleware.ts # Extract token from requests
│   ├── clerk.guard.ts     # Protect routes
│   ├── public.decorator.ts
│   └── user-id.decorator.ts
├── sessions/              # Session management
│   ├── schemas/           # MongoDB session schema
│   ├── sessions.controller.ts
│   ├── sessions.service.ts
│   └── sessions.module.ts
├── socket/                # WebSocket gateway
│   ├── gateway.ts         # Main WebSocket handler
│   ├── events.constants.ts # Event names and types
│   └── socket.module.ts
├── app.module.ts
└── main.ts
```

## Setup

### 1. Install Dependencies
npm install

### 2. Environment Variables
Create `.env` file:

PORT=3001
CORS_ORIGIN=http://localhost:3000

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=AIza...

### 3. Start MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-playground
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo

### 4. Run the Server
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

Server runs on `http://localhost:3001`

## API Endpoints

### REST API

**Authentication:** All endpoints require JWT token in `Authorization: Bearer <token>` header

#### `GET /`
Health check endpoint (public)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T...",
  "service": "AI Playground API"
}
```

#### `GET /sessions`
Get all sessions for authenticated user

**Response:**
```json
[
  {
    "_id": "session_id",
    "prompt": "User's prompt",
    "models": [
      { "provider": "google", "modelName": "gemini-2.0-flash-exp" },
      { "provider": "anthropic", "modelName": "claude-sonnet-4-5-20250929" }
    ],
    "responses": { ... },
    "userId": "user_id",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### `GET /sessions/:id`
Get specific session (ownership verified)

**Response:** Single session object

### WebSocket API

**Connect:** `ws://localhost:3001`

**Authentication:** Pass JWT token in socket handshake
```javascript
socket = io('http://localhost:3001', {
  auth: { token: '<jwt_token>' }
});
```

#### Client → Server Events

**`startComparison`**
```typescript
{
  prompt: string;
  providers: string[];  // ['google', 'anthropic']
}
```

#### Server → Client Events

**`error`**
```typescript
{
  message: string;
}
```

**`sessionCreated`**
```typescript
{
  sessionId: string;
}
```

**`modelStatus`**
```typescript
{
  sessionId: string;
  model: string;  // Model name
  status: 'streaming' | 'complete' | 'error';
}
```

**`modelChunk`**
```typescript
{
  sessionId: string;
  model: string;
  chunk: string;  // Text chunk
}
```

**`modelComplete`**
```typescript
{
  sessionId: string;
  model: string;
  metrics: {
    durationInMilliseconds: number;
    tokensUsed: number;
    estimatedCost: number;
  };
}
```

**`modelError`**
```typescript
{
  sessionId: string;
  model: string;
  error: string;
}
```

## Architecture

### AI Provider System

Each provider implements the `AIProvider` interface:

```typescript
interface AIProvider {
  providerName: AIProviderName;
  modelName: AIModelName;

  streamCompletion(
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: (metrics: CompletionMetrics) => void,
    onError: (error: string) => void,
  ): Promise<void>;

  calculateCost(tokensUsed: number): number;
}
```

**Adding a New Provider:**

1. Create provider class in `src/ai-providers/providers/`
2. Implement `AIProvider` interface
3. Register in `AiProvidersService`
4. Add to `AIProviderName` and `AIModelName` enums

### Authentication Flow

1. Client sends JWT token in WebSocket handshake
2. `ClerkMiddleware` verifies token on connection
3. `userId` attached to socket: `client.data.userId`
4. All operations use this `userId` for ownership

### Session Storage

Sessions stored in MongoDB with:
- User's prompt
- Selected models (provider + model name)
- Real-time responses from each model
- Status tracking (streaming/complete/error)
- Performance metrics

## Development

### Key Files to Modify

**Add AI Provider:**
- `src/ai-providers/providers/new-provider.provider.ts`
- `src/ai-providers/ai-providers.service.ts`
- `src/ai-providers/interface/index.ts`

**Modify WebSocket Events:**
- `src/socket/events.constants.ts` (add event types)
- `src/socket/gateway.ts` (handle events)

**Change Session Schema:**
- `src/sessions/schemas/session.schema.ts`

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```