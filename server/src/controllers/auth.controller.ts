import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    const tokens = await authService.login(email, password);
    if (!tokens) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // Set HTTP-only cookie
    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, tokens, 200, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) {
      sendError(res, 'Missing required registration fields', 400);
      return;
    }

    const user = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    sendSuccess(res, user, 201, 'User registered successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Registration failed', 400);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const userProfile = await authService.getMe(req.user.userId);
    if (!userProfile) {
      // Fallback to JWT payload
      sendSuccess(res, {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name,
      });
      return;
    }

    sendSuccess(res, userProfile);
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  sendSuccess(res, { loggedOut: true }, 200, 'Logged out successfully');
}
