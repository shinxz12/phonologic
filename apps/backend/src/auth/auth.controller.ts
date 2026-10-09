import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { CurrentUser, type AuthUser } from './current-user.decorator';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  UpdateProfileDto,
} from './auth.dto';
import type { AuthResult, MeResponse } from '@phonologic/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto): Promise<AuthResult> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthUser): Promise<{ success: boolean }> {
    await this.authService.logout(user.id);
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.authService.me(user.id);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<AuthResult> {
    return this.authService.changePassword(user.id, dto);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<MeResponse> {
    return this.authService.updateProfile(user.id, dto);
  }
}
