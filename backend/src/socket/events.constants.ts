import { AIModelName, AIProviderName } from 'src/ai-providers/interface';

export const SOCKET_EVENTS_IN = {
  START_COMPARISON: 'startComparison',
} as const;

export const SOCKET_EVENTS_OUT = {
  ERROR: 'error',
  SESSION_CREATED: 'sessionCreated',
  MODEL_STATUS: 'modelStatus',
  MODEL_CHUNK: 'modelChunk',
  MODEL_COMPLETE: 'modelComplete',
  MODEL_ERROR: 'modelError',
} as const;

export interface StartComparisonPayload {
  prompt: string;
  models: { provider: AIProviderName; modelName: AIModelName }[];
}

export interface ErrorPayload {
  message: string;
}

export interface SessionCreatedPayload {
  sessionId: string;
}

export interface ModelStatusPayload {
  sessionId: string;
  status: 'streaming' | 'complete' | 'error';
  model: { provider: AIProviderName; modelName: AIModelName };
}

export interface ModelChunkPayload {
  sessionId: string;
  model: { provider: AIProviderName; modelName: AIModelName };
  chunk: string;
}

export interface ModelCompletePayload {
  sessionId: string;
  model: { provider: AIProviderName; modelName: AIModelName };
  metrics: {
    durationInMilliseconds: number;
    tokensUsed: number;
    estimatedCost: number;
  };
}

export interface ModelErrorPayload {
  model: { provider: AIProviderName; modelName: AIModelName };
  sessionId: string;
  error: string;
}
