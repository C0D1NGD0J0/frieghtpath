import { Module } from '@nestjs/common';
import { AiProvidersService } from './ai-providers.service';

@Module({
  providers: [AiProvidersService]
})
export class AiProvidersModule {}
