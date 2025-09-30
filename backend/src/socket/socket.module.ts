import { Module } from '@nestjs/common';
import { SocketGateway } from './gateway';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
  imports: [SessionsModule, AiProvidersModule, AuthModule],
  providers: [SocketGateway],
})
export class SocketModule {}
