import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AIProvider, CompletionMetrics } from '../interface/index';

@Injectable()
export class GoogleProvider implements AIProvider {
  providerName: 'google' | 'anthropic' = 'google';
  modelName: 'gemini-pro' | 'claude-4-sonnet' = 'gemini-pro';

  private client: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>(
      process.env.GOOGLE_GEMINI_API_KEY!,
    );
    this.client = new GoogleGenAI({ apiKey });
  }

  async streamCompletion(
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: (metrics: CompletionMetrics) => void,
    onError: (error: string) => void,
  ): Promise<void> {
    const startTime = Date.now();
    let fullContent = '';

    try {
      const response = await this.client.models.generateContentStream({
        model: this.modelName,
        contents: prompt,
      });

      for await (const chunk of response) {
        const chunkText = chunk.text || '';
        fullContent += chunkText;

        onChunk(chunkText);
      }

      const durationInMilliseconds = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(fullContent);
      const estimatedCost = this.calculateCost(tokensUsed);

      onComplete({
        durationInMilliseconds,
        tokensUsed,
        estimatedCost,
      });
    } catch (error) {
      const errorMessage = error.message || 'Google Gemini API error';
      onError(errorMessage);
    }
  }

  calculateCost(tokens: number): number {
    // estimate: $0.001 per 1K tokens
    return (tokens / 1000) * 0.001;
  }

  private estimateTokens(text: string): number {
    // estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
