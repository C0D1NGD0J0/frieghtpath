import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { ClerkService } from '../auth/clerk.service';
import * as eventsConstants from './events.constants';
import { SessionsService } from '../sessions/sessions.service';
import { AIProviderName } from '../ai-providers/interface/index';
import { AiProvidersService } from '../ai-providers/ai-providers.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private sessionsService: SessionsService,
    private aiProvidersService: AiProvidersService,
    private clerkService: ClerkService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const verifiedUserId = await this.clerkService.verifyToken(token);

      client.data.userId = verifiedUserId; //add this user to socket data

      this.logger.log(
        `Client ${client.id} connected (User: ${verifiedUserId})`,
      );
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error.message,
      );
      client.emit(eventsConstants.SOCKET_EVENTS_OUT.ERROR, {
        message: 'Authentication failed',
      } as eventsConstants.ErrorPayload);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage(eventsConstants.SOCKET_EVENTS_IN.START_COMPARISON)
  async handleComparison(
    @MessageBody() data: eventsConstants.StartComparisonPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { prompt, models } = data;
    const userId = client.data.userId;

    if (!prompt || !prompt.trim()) {
      client.emit(eventsConstants.SOCKET_EVENTS_OUT.ERROR, {
        message: 'Prompt is required',
      } as eventsConstants.ErrorPayload);
      return;
    }

    if (!models || models.length < 2) {
      client.emit(eventsConstants.SOCKET_EVENTS_OUT.ERROR, {
        message: 'At least 2 models are required',
      } as eventsConstants.ErrorPayload);
      return;
    }

    try {
      const session = await this.sessionsService.createSession(
        prompt,
        models,
        userId,
      );

      if (!session) {
        client.emit(eventsConstants.SOCKET_EVENTS_OUT.ERROR, {
          message: 'Failed to create session',
        } as eventsConstants.ErrorPayload);
        return;
      }

      client.emit(eventsConstants.SOCKET_EVENTS_OUT.SESSION_CREATED, {
        sessionId: session.id,
      } as eventsConstants.SessionCreatedPayload);

      const streamPromises = models.map((model) =>
        // ideally we would use redis or a message queue here but for now db is fine
        this.streamModelResponse(
          client,
          session.id,
          model.provider,
          model.modelName,
          prompt,
        ),
      );

      await Promise.allSettled(streamPromises);
    } catch (error) {
      this.logger.error('Error in comparison:', error);
      client.emit(eventsConstants.SOCKET_EVENTS_OUT.ERROR, {
        message: 'Failed to start comparison',
      } as eventsConstants.ErrorPayload);
    }
  }

  private async streamModelResponse(
    client: Socket,
    sessionId: string,
    providerName: string,
    modelName: string,
    prompt: string,
  ) {
    const provider = this.aiProvidersService.getProvider(
      providerName as AIProviderName,
    );

    if (!provider) {
      this.logger.error(`Provider not found: ${providerName}:${modelName}`);
      client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_ERROR, {
        sessionId,
        model: modelName,
        error: 'Provider not found',
      } as eventsConstants.ModelErrorPayload);
      return;
    }

    client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_STATUS, {
      sessionId,
      model: modelName,
      status: 'streaming',
    } as eventsConstants.ModelStatusPayload);

    let fullContent = '';
    let chunkCounter = 0;

    await provider.streamCompletion(
      prompt,
      (chunk: string) => {
        fullContent += chunk;
        client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_CHUNK, {
          sessionId,
          model: modelName,
          chunk,
        } as eventsConstants.ModelChunkPayload);

        chunkCounter++; // simple mechanism to reduce db writes
        if (chunkCounter % 10 === 0) {
          this.sessionsService
            .updateModelResponse(
              sessionId,
              modelName,
              'streaming',
              undefined,
              undefined,
              fullContent,
            )
            .catch((err) =>
              this.logger.error('Failed to update content:', err),
            );
        }
      },

      async (metrics) => {
        this.logger.log(`${modelName} completed for session ${sessionId}`);
        await this.sessionsService.updateModelResponse(
          sessionId,
          modelName,
          'complete',
          metrics,
          undefined,
          fullContent,
        );

        client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_COMPLETE, {
          sessionId,
          model: modelName,
          metrics,
        } as eventsConstants.ModelCompletePayload);
      },

      async (error: string) => {
        this.logger.error(`Model ${modelName} error:`, error);
        await this.sessionsService.updateModelResponse(
          sessionId,
          modelName,
          'error',
          undefined,
          error,
          fullContent,
        );

        client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_ERROR, {
          sessionId,
          model: modelName,
          error,
        } as eventsConstants.ModelErrorPayload);
      },
    );
  }
}
