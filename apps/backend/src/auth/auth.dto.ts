import { createZodDto } from '../common/zod-dto';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
} from '@phonologic/shared-types';

export class LoginDto extends createZodDto(loginSchema) {}
export class RegisterDto extends createZodDto(registerSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
