import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true })
  prompt: string;

  @Prop({
    type: [
      {
        provider: { type: String, required: true },
        modelName: { type: String, required: true },
      },
    ],
    required: true,
  })
  models: { provider: string; modelName: string }[];

  @Prop({ type: Object, required: true })
  responses: {
    [modelName: string]: {
      content: string;
      status: 'streaming' | 'complete' | 'error';
      error?: string;
      metrics: {
        startTime: Date;
        endTime?: Date;
        duration?: number;
        tokensUsed?: number;
        estimatedCost?: number;
      };
    };
  };

  @Prop({ default: 'active' })
  status: 'active' | 'completed' | 'error';

  @Prop({ required: true })
  userId: string;
}

export type SessionDocument = Session & Document;
export const SessionSchema = SchemaFactory.createForClass(Session);
