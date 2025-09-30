import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkClient, createClerkClient, verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkService {
  private clerkClient: ClerkClient;

  constructor(private configService: ConfigService) {
    this.clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY || '',
    });
  }

  async verifyToken(token: string): Promise<string> {
    try {
      const verified = await verifyToken(token, {
        authorizedParties: [process.env.CORS_ORIGIN || ''],
        secretKey: process.env.CLERK_SECRET_KEY || '',
      });
      return verified.sub;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getUser(userId: string) {
    return this.clerkClient.users.getUser(userId);
  }

  getClient() {
    return this.clerkClient;
  }
}
