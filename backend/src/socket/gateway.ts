import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionsService } from '../sessions/sessions.service';
import { AiProvidersService } from '../ai-providers/ai-providers.service';
import { ClerkService } from '../auth/clerk.service';
import { Logger } from '@nestjs/common';
import { AIModelName, AIProviderName } from 'src/ai-providers/interface';
import * as eventsConstants from './events.constants';

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
        sessionId: session._id,
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
        model: {
          provider: providerName as AIProviderName,
          modelName: modelName as AIModelName,
        },
        error: 'Provider not found',
      } as eventsConstants.ModelErrorPayload);
      return;
    }

    client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_STATUS, {
      sessionId,
      model: {
        provider: providerName as AIProviderName,
        modelName: modelName as AIModelName,
      },
      status: 'streaming',
    } as eventsConstants.ModelStatusPayload);

    let fullContent = '';
    await provider.streamCompletion(
      prompt,
      (chunk: string) => {
        fullContent += chunk;
        client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_CHUNK, {
          sessionId,
          model: {
            provider: providerName as AIProviderName,
            modelName: modelName as AIModelName,
          },
          chunk,
        } as eventsConstants.ModelChunkPayload);

        this.sessionsService
          .appendModelContent(sessionId, modelName, fullContent)
          .catch((err) => this.logger.error('Failed to update content:', err));
      },

      async (metrics) => {
        this.logger.log(`${modelName} completed for session ${sessionId}`);

        await this.sessionsService.updateModelResponse(
          sessionId,
          modelName,
          'complete',
          metrics,
        );

        client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_COMPLETE, {
          sessionId,
          model: {
            provider: providerName as AIProviderName,
            modelName: modelName as AIModelName,
          },
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
        );

        client.emit(eventsConstants.SOCKET_EVENTS_OUT.MODEL_ERROR, {
          sessionId,
          model: {
            provider: providerName as AIProviderName,
            modelName: modelName as AIModelName,
          },
          error,
        } as eventsConstants.ModelErrorPayload);
      },
    );
  }
}
