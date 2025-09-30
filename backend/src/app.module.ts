import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';

import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { SocketModule } from './socket/socket.module';
import { ClerkMiddleware } from './auth/clerk.middleware';
import { SessionsModule } from './sessions/sessions.module';
import { AiProvidersModule } from './ai-providers/ai-providers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    AuthModule,
    SessionsModule,
    AiProvidersModule,
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClerkMiddleware).forRoutes('*');
  }
}
