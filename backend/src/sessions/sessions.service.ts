import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionDocument } from './model/session.model';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async createSession(
    prompt: string,
    models: { provider: string; modelName: string }[],
    userId: string,
  ): Promise<SessionDocument> {
    const responses = {};
    models.forEach((model) => {
      responses[model.modelName] = {
        content: '',
        status: 'streaming',
        metrics: {
          startTime: new Date(),
        },
      };
    });

    let session = new this.sessionModel({
      prompt,
      models,
      responses,
      status: 'active',
      userId,
    });

    session = await session.save();
    return session;
  }

  async updateModelResponse(
    sessionId: string,
    modelName: string,
    status: 'streaming' | 'complete' | 'error',
    metrics?: {
      duration?: number;
      tokensUsed?: number;
      estimatedCost?: number;
    },
    error?: string,
    content?: string,
  ): Promise<SessionDocument | null> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const update: any = {
      [`responses.${modelName}.status`]: status,
    };

    if (content) {
      update[`responses.${modelName}.content`] = content;
    }

    if (metrics) {
      update[`responses.${modelName}.metrics.endTime`] = new Date();
      update[`responses.${modelName}.metrics.duration`] = metrics.duration;
      update[`responses.${modelName}.metrics.tokensUsed`] = metrics.tokensUsed;
      update[`responses.${modelName}.metrics.estimatedCost`] =
        metrics.estimatedCost;
    }

    if (error) {
      update[`responses.${modelName}.error`] = error;
    }

    return this.sessionModel.findByIdAndUpdate(sessionId, update, {
      new: true,
    });
  }

  async appendModelContent(
    sessionId: string,
    modelName: string,
    content: string,
  ): Promise<void> {
    if (!content) return;

    if (!sessionId || !modelName) {
      throw new Error('sessionId and modelName are required');
    }

    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.responses[modelName]) {
      throw new Error(`Model ${modelName} not found in session responses`);
    }

    const existingContent = session.responses[modelName].content || '';
    content = existingContent + content;
    await this.sessionModel.findByIdAndUpdate(sessionId, {
      $set: {
        [`responses.${modelName}.content`]: content,
      },
    });
  }

  async getSession(sessionId: string): Promise<SessionDocument | null> {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    return this.sessionModel.findById(sessionId);
  }

  async getUserSessions(userId: string): Promise<SessionDocument[]> {
    if (!userId) {
      throw new Error('userId is required');
    }

    return this.sessionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
