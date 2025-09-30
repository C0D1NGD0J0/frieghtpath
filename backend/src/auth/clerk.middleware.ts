import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClerkService } from './clerk.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ClerkMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ClerkMiddleware.name);

  constructor(private clerkService: ClerkService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const userId = await this.clerkService.verifyToken(token);
        req['userId'] = userId;
        req['clerkAuth'] = { userId, isAuthenticated: true };
      } catch (error) {
        req['clerkAuth'] = { isAuthenticated: false, userId: null };
      }
    } else {
      this.logger.error(`No Authorization header token found`);
      req['clerkAuth'] = { isAuthenticated: false, userId: null };
    }

    next();
  }
}
