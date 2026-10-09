import type { PermissionKey } from '../permissions';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  mustChangePassword: boolean;
  user: UserSummary;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface MeResponse extends UserSummary {
  mustChangePassword: boolean;
  roleKeys: string[];
  permissions: PermissionKey[];
}
