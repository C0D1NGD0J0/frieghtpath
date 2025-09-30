import { Module } from '@nestjs/common';
import { GoogleProvider } from './providers/google.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { AiProvidersService } from './ai-providers.service';

@Module({
  providers: [GoogleProvider, AnthropicProvider, AiProvidersService],
  exports: [AiProvidersService],
})
export class AiProvidersModule {}
