import { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ellen2025";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "ellen-finance-secret-2025";

export interface AdminSession {
  username: string;
  role: string;
}

function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

function verifyToken<T>(token: string): T | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const data = token.slice(0, dotIdx);
    const hmac = token.slice(dotIdx + 1);
    const expected = createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    const hBuf = Buffer.from(hmac, "base64url");
    const eBuf = Buffer.from(expected, "base64url");
    if (hBuf.length !== eBuf.length || !timingSafeEqual(hBuf, eBuf)) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export function createSession(username: string): string {
  return signToken({ username, role: "admin", iat: Date.now() });
}

export function destroySession(_token: string): void {
  // Tokens are stateless; nothing to destroy server-side
}

export function getSession(token: string): AdminSession | undefined {
  const payload = verifyToken<{ username: string; role: string }>(token);
  if (!payload) return undefined;
  return { username: payload.username, role: payload.role };
}

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "") ?? (req.cookies as Record<string, string>)?.admin_token ?? "";

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
