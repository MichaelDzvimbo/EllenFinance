import { Request, Response, NextFunction } from "express";
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "ellen-finance-secret-2025";

export interface UserSession {
  userId: number;
  email: string;
  fullName: string;
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

export function createUserSession(userId: number, email: string, fullName: string): string {
  return signToken({ userId, email, fullName, iat: Date.now() });
}

export function destroyUserSession(_token: string): void {
  // Tokens are stateless; nothing to destroy server-side
}

export function getUserSession(token: string): UserSession | undefined {
  const payload = verifyToken<{ userId: number; email: string; fullName: string }>(token);
  if (!payload || !payload.userId) return undefined;
  return { userId: payload.userId, email: payload.email, fullName: payload.fullName };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
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
