# AI Model Playground - Frontend

Next.js frontend for comparing AI model responses side-by-side in real-time.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** SCSS (no Tailwind)
- **Authentication:** Clerk (@clerk/nextjs)
- **Real-time:** Socket.IO Client
- **Markdown:** react-markdown with remark-gfm

## Project Structure

```
app/
├── sign-in/[[...sign-in]]/  # Clerk sign-in page
├── sign-up/[[...sign-up]]/  # Clerk sign-up page
├── layout.tsx               # Root layout with ClerkProvider
├── page.tsx                 # Main comparison page
├── page.module.scss         # Page styles
└── globals.scss             # Global styles

lib/
└── socket.ts                # Socket.IO service wrapper

middleware.ts                # Clerk route protection
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend API
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Clerk URLs (default)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 3. Run Development Server

```bash
npm run dev
```

App runs on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

### Authentication
- **Clerk Integration:** Sign in/up with email, Google, etc.
- **Protected Routes:** All routes except sign-in/up require authentication
- **JWT Tokens:** Automatically sent to backend via WebSocket

### Real-time Comparison
- **Provider Selection:** Choose 2+ AI providers (Google, Anthropic)
- **Streaming Responses:** See AI responses in real-time as they generate
- **Side-by-Side View:** Compare responses in a multi-column layout
- **Performance Metrics:** View duration, tokens used, and estimated cost

### User Interface
- **Clean Design:** Simple, functional SCSS styling
- **Responsive Layout:** Grid adapts to screen size
- **Status Indicators:** Visual feedback for idle/streaming/complete/error states
- **Error Handling:** Clear error messages with automatic recovery

## Usage

1. **Sign In:** Navigate to `/sign-in` or click "Sign In" on home page
2. **Select Providers:** Choose at least 2 AI providers (checkboxes)
3. **Enter Prompt:** Type your question or request in the textarea
4. **Compare:** Click "Compare Providers" button
5. **View Results:** Watch responses stream in real-time side-by-side

## Architecture

### Socket Service (`lib/socket.ts`)

Wrapper around Socket.IO client:

```typescript
class SocketService {
  connect(token: string): Socket;
  disconnect(): void;
  getSocket(): Socket | null;
}
```

**Features:**
- Auto-reconnection
- JWT token authentication
- WebSocket transport

### Main Page (`app/page.tsx`)

**State Management:**
```typescript
{
  prompt: string;
  selectedProviders: string[];  // ['google', 'anthropic']
  responses: Record<string, ModelResponse>;
  isStreaming: boolean;
  sessionId: string | null;
}
```

**WebSocket Events:**
- `error` → Show alert, reset streaming
- `sessionCreated` → Store session ID
- `modelStatus` → Update status badge
- `modelChunk` → Append text to response
- `modelComplete` → Show metrics, stop streaming
- `modelError` → Display error message

### Authentication Flow

1. User signs in via Clerk
2. `useAuth()` hook provides `getToken()` and `isSignedIn`
3. On mount, get JWT token and connect to WebSocket
4. Token sent in socket handshake: `auth: { token }`
5. Backend verifies and attaches user ID to socket

### Middleware Protection

`middleware.ts` protects all routes except:
- `/sign-in/*`
- `/sign-up/*`

All other routes require authentication via `auth.protect()`.

## Styling

### SCSS Architecture

**Global Styles** (`globals.scss`):
- CSS reset
- Font family
- Base colors

**Component Styles** (`page.module.scss`):
- BEM-like naming
- SCSS variables for consistency
- Responsive breakpoints

**Key Classes:**
- `.container` - Main wrapper
- `.controls` - Prompt input and provider selection
- `.responses` - Multi-column grid for responses
- `.responseColumn` - Individual model response card
- `.status` - Status badge (idle/streaming/complete/error)

## Development

### Adding UI Features

**New Component:**
1. Create component file: `components/MyComponent.tsx`
2. Create styles: `components/MyComponent.module.scss`
3. Import and use in page

**New Page:**
1. Create directory: `app/my-page/`
2. Add `page.tsx` and `page.module.scss`
3. Update navigation if needed

### Socket Event Handling

**Add new event listener:**
```typescript
socket.on('newEvent', (data) => {
  setState(newState);
});
```

**Emit new event:**
```typescript
socket.emit('newEvent', { payload });
```

### Environment Variables

**Public (available in browser):**
- Prefix with `NEXT_PUBLIC_`
- Access via `process.env.NEXT_PUBLIC_VAR_NAME`