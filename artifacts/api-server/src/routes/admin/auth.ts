import { Router, type IRouter } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import { validateCredentials, createSession, destroySession, getSession, requireAdmin } from "../../lib/session";
import { logAudit } from "../../lib/audit";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  if (!validateCredentials(username, password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = createSession(username);
  await logAudit("LOGIN", "admin", null, `Admin ${username} logged in`);

  res.json({ token, username, role: "admin" });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "") ?? req.cookies?.admin_token;
  if (token) destroySession(token);
  res.json({ ok: true, message: "Logged out" });
});

router.get("/admin/me", requireAdmin, async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "") ?? req.cookies?.admin_token ?? "";
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ token, username: session.username, role: session.role });
});

export default router;
