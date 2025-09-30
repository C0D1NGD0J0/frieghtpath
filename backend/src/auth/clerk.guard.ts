import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from './public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isAuthenticated = !!request.userId;
    const isPublic =
      this.reflector.get(Public, context.getHandler()) ||
      this.reflector.get(Public, context.getClass());

    if (isPublic) return isPublic;
    if (!isAuthenticated) {
      throw new UnauthorizedException('Authentication required');
    }
    return isAuthenticated;
  }
}
