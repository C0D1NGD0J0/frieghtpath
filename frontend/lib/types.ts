export interface Provider {
  provider: string;
  displayName: string;
}

export type Status = "idle" | "streaming" | "complete" | "error";

export interface CompletionMetrics {
  durationInMilliseconds: number;
  tokensUsed: number;
  estimatedCost: number;
}

export interface APIResponse {
  content: string;
  status: Status;
  error?: string;
  metrics?: CompletionMetrics;
}

export interface StartComparisonPayload {
  prompt: string;
  providers: string[];
}

export interface SessionCreatedPayload {
  sessionId: string;
}

export interface StatusPayload {
  sessionId: string;
  model: string;
  status: Status;
}

export interface ChunkPayload {
  sessionId: string;
  model: string;
  chunk: string;
}

export interface CompletePayload {
  sessionId: string;
  model: string;
  metrics: CompletionMetrics;
}

export interface ErrorPayload {
  sessionId: string;
  model: string;
  error: string;
  message?: string;
}

export interface Session {
  _id: string;
  prompt: string;
  models: Array<{
    provider: string;
    modelName: string;
  }>;
  responses: Record<
    string,
    {
      content: string;
      status: Status;
      error?: string;
      metrics?: CompletionMetrics;
    }
  >;
  status: "active" | "completed" | "error";
  userId: string;
  createdAt: string;
  updatedAt: string;
}
