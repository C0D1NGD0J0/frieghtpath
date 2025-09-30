export enum AIProviderName {
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic',
}

export enum AIModelName {
  GEMINI_PRO = 'gemini-2.0-flash-exp',
  CLAUDE_4_SONNET = 'claude-sonnet-4-5-20250929',
}
export interface AIProvider {
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

export interface CompletionMetrics {
  durationInMilliseconds: number;
  tokensUsed: number;
  estimatedCost: number;
}
