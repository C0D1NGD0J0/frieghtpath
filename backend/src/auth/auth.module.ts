import { Global, Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './clerk.guard';

@Global()
@Module({
  providers: [ClerkService],
  exports: [ClerkService],
})
export class AuthModule {}
