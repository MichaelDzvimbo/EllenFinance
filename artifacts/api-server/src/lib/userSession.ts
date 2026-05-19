import { Request, Response, NextFunction } from "express";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export interface UserSession {
  userId: number;
  email: string;
  fullName: string;
}

const userSessions = new Map<string, UserSession>();

export function createUserSession(userId: number, email: string, fullName: string): string {
  const token = `usr-${userId}-${Date.now()}-${randomBytes(8).toString("hex")}`;
  userSessions.set(token, { userId, email, fullName });
  return token;
}

export function destroyUserSession(token: string): void {
  userSessions.delete(token);
}

export function getUserSession(token: string): UserSession | undefined {
  return userSessions.get(token);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const hashBuffer = Buffer.from(hash, "hex");
    const verify = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, verify);
  } catch {
    return false;
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "") ?? "";
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const session = getUserSession(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session — please log in again" });
    return;
  }
  (req as Request & { userSession: UserSession }).userSession = session;
  next();
}
