import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RbacModule } from '../rbac/rbac.module';

@Global()
@Module({
  imports: [JwtModule.register({}), RbacModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, JwtAuthGuard],
  exports: [AuthService, PasswordService, TokenService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
