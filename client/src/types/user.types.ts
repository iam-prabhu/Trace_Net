import type { UserRole } from './index';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn?: string;
  user?: User;
}
