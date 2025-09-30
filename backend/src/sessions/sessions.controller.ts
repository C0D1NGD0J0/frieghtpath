import {
  Controller,
  Get,
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { UserId } from '../auth/user-id.decorator';

@Controller('sessions')
@UseGuards(ClerkAuthGuard)
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  async getUserSessions(@UserId() userId: string) {
    return this.sessionsService.getUserSessions(userId);
  }

  @Get(':id')
  async getSession(@Param('id') id: string, @UserId() userId: string) {
    const session = await this.sessionsService.getSession(id);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }
    // todo: verify user has access to this session
    if (session.userId !== userId) {
      throw new UnauthorizedException('Not authorized to view this session');
    }

    return session;
  }
}
