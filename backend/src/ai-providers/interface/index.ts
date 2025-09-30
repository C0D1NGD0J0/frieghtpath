export interface AIProvider {
  providerName: 'google' | 'anthropic';
  modelName: 'gemini-pro' | 'claude-4-sonnet';

  /**
   * Stream completion from the AI model
   * @param prompt - User's input text
   * @param onChunk - Callback fired for each text chunk received
   * @param onComplete - Callback fired when streaming completes with metrics
   * @param onError - Callback fired if an error occurs
   */
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
