import type { Request, Response, NextFunction } from "express";
import { getUserIdFromSession, getUserById } from "../services/redis";
import type { PublicUser } from "../types";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
      userId?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies the Bearer token and attaches user info to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Get user ID from session
    const userId = await getUserIdFromSession(token);
    if (!userId) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    // Get user details
    const user = await getUserById(userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Attach user info to request
    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userId = await getUserIdFromSession(token);
      
      if (userId) {
        const user = await getUserById(userId);
        if (user) {
          req.userId = user.id;
          req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
}
