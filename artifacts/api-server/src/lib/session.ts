import { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}

// Token lifetime: 8 hours for admin sessions
const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export interface AdminSession {
  username: string;
  role: string;
}

function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = createHmac("sha256", SESSION_SECRET!).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

function verifyToken<T>(token: string): T | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const data = token.slice(0, dotIdx);
    const hmac = token.slice(dotIdx + 1);
    const expected = createHmac("sha256", SESSION_SECRET!).update(data).digest("base64url");
    const hBuf = Buffer.from(hmac, "base64url");
    const eBuf = Buffer.from(expected, "base64url");
    if (hBuf.length !== eBuf.length || !timingSafeEqual(hBuf, eBuf)) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Record<string, unknown>;
    // Enforce expiry
    if (typeof payload.iat === "number" && Date.now() - payload.iat > TOKEN_MAX_AGE_MS) return null;
    return payload as T;
  } catch {
    return null;
  }
}

export function createSession(username: string): string {
  return signToken({ username, role: "admin", iat: Date.now() });
}

export function destroySession(_token: string): void {
  // Tokens are stateless; short TTL enforces expiry
}

export function getSession(token: string): AdminSession | undefined {
  const payload = verifyToken<{ username: string; role: string }>(token);
  if (!payload) return undefined;
  return { username: payload.username, role: payload.role };
}

export function validateCredentials(username: string, password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  // Constant-time comparison to prevent timing attacks
  try {
    const a = Buffer.from(username + ":" + password);
    const b = Buffer.from(ADMIN_USERNAME + ":" + ADMIN_PASSWORD);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
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
