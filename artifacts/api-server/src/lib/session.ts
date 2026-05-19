import { Request, Response, NextFunction } from "express";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "ellen2025";

export interface AdminSession {
  username: string;
  role: string;
}

const sessions = new Map<string, AdminSession>();

export function createSession(username: string): string {
  const token = `${username}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessions.set(token, { username, role: "admin" });
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function getSession(token: string): AdminSession | undefined {
  return sessions.get(token);
}

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "") ?? req.cookies?.admin_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  (req as Request & { adminSession: AdminSession }).adminSession = session;
  next();
}
