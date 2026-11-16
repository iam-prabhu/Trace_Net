import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserRole } from '../types/user.types';

const roleHierarchy: Record<string, number> = {
  ADMIN: 3,
  INVESTIGATOR: 2,
  ANALYST: 2,
  VIEWER: 1,
};

export function requireRole(...roles: UserRole[]) {
  const allowed = roles.map(r => r.toUpperCase());

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userRole = (req.user.role || '').toUpperCase();
    const userLevel = roleHierarchy[userRole] || 0;

    // Direct match or hierarchy check (if ADMIN, allowed on all)
    const isDirectMatch = allowed.includes(userRole);
    const minRequiredLevel = Math.min(...allowed.map(r => roleHierarchy[r] || 1));

    if (!isDirectMatch && userLevel < minRequiredLevel) {
      res.status(403).json({ success: false, error: 'Insufficient permissions for this action' });
      return;
    }

    next();
  };
}
