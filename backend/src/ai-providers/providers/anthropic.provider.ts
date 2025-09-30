import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AIModelName,
  AIProvider,
  AIProviderName,
  CompletionMetrics,
} from '../interface/index';

@Injectable()
export class AnthropicProvider implements AIProvider {
  providerName = AIProviderName.ANTHROPIC;
  modelName = AIModelName.CLAUDE_4_SONNET;
  private client: Anthropic;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>(
      process.env.ANTHROPIC_API_KEY!,
    );
    this.client = new Anthropic({ apiKey });
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
      const stream = this.client.messages
        .stream({
          model: AIModelName.CLAUDE_4_SONNET,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        })
        .on('text', (text) => {
          fullContent += text;
          onChunk(text);
        });

      await stream.finalMessage();

      const durationInMilliseconds = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(fullContent);
      const estimatedCost = this.calculateCost(tokensUsed);

      onComplete({
        durationInMilliseconds,
        tokensUsed,
        estimatedCost,
      });
    } catch (error) {
      const errorMessage = error.message || 'Anthropic Claude API error';
      onError(errorMessage);
    }
  }

  calculateCost(tokens: number): number {
    /* sonnet4 cost:
      --> input: $0.003 per 1K tokens
      --> output: $0.015 per 1K tokens
    */
    return (tokens / 1000) * 0.015;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
