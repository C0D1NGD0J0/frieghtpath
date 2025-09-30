import { Injectable } from '@nestjs/common';
import { AIProvider, AIProviderName, AIModelName } from './interface/index';
import { GoogleProvider } from './providers/google.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

@Injectable()
export class AiProvidersService {
  private providers: { [key in AIProviderName]: AIProvider };

  constructor(
    private googleProvider: GoogleProvider,
    private anthropicProvider: AnthropicProvider,
  ) {
    this.providers = {
      [AIProviderName.GOOGLE]: this.googleProvider,
      [AIProviderName.ANTHROPIC]: this.anthropicProvider,
    };
  }

  getProvider(provider: AIProviderName): AIProvider | undefined {
    return this.providers[provider];
  }

  getAllProviders(): AIProviderName[] {
    return Object.keys(this.providers) as AIProviderName[];
  }

  hasProvider(provider: AIProviderName): boolean {
    return provider in this.providers;
  }
}
