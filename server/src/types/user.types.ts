import type { UserRole } from './index';
export type { UserRole };

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
  user?: Partial<User>;
}
