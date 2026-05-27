import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS: restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : undefined;

app.use(
  cors({
    origin: allowedOrigins
      ? (origin, cb) => {
          // Allow requests with no origin (server-to-server, curl, etc.) in dev
          if (!origin) return cb(null, true);
          if (allowedOrigins.some((o) => origin === o || origin.endsWith(o))) {
            return cb(null, true);
          }
          cb(new Error(`CORS: origin ${origin} not allowed`));
        }
      : true, // In dev (no ALLOWED_ORIGINS set), allow all origins
    credentials: true,
  }),
);

// Simple in-memory rate limiter for auth endpoints
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 20; // max attempts per window

function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  const now = Date.now();
  const entry = authAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many attempts — please try again in 15 minutes" });
    return;
  }
  next();
}

// Parse JSON bodies; cap at 10 MB for document uploads (base64 etc.)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting to auth endpoints BEFORE the router so the middleware
// actually runs. Express matches middleware in registration order — mounting
// the rate limiter after app.use("/api", router) would be a no-op.
app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/register", authRateLimiter);
app.use("/api/admin/login", authRateLimiter);

app.use("/api", router);

// 404 — no route matched
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler — catches any unhandled errors thrown in route handlers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode
    ?? 500;

  // Never leak internal error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : (err instanceof Error ? err.message : String(err));

  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(status).json({ error: message });
});

export default app;
