import { Router, type IRouter, type RequestHandler } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import leadsRouter from "./leads";
import customersRouter from "./customers";
import casesRouter from "./cases";
import documentsRouter from "./documents";
import paymentsRouter from "./payments";
import payuRouter from "./payu";
import referralsRouter from "./referrals";
import ticketsRouter from "./tickets";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import staffRouter from "./staff";
import { getRequestUser, isAdmin } from "../lib/auth";

const router: IRouter = Router();

const publicRoutes = new Set([
  "GET /healthz",
  "POST /auth/login",
  "POST /auth/login-mobile",
  "POST /auth/register",
  "POST /auth/staff/login",
  "POST /auth/otp/send",
  "POST /auth/otp/verify",
  "GET /cases/track",
  "POST /leads",
  "POST /referrals",
  "POST /payu/callback",
]);

function adminOnly(method: string, path: string): boolean {
  if (path === "/admin" || path.startsWith("/admin/")) return true;
  if (path === "/customers" || path.startsWith("/customers/")) return true;
  if (path === "/leads" || path.startsWith("/leads/")) return true;
  if (path === "/referrals" || path.startsWith("/referrals/")) return true;
  if (path === "/cases/stats" || ((method === "PATCH" || method === "DELETE") && /^\/cases\/\d+$/.test(path))) return true;
  if (path === "/documents/admin-all" || ((method === "PATCH" || method === "DELETE") && /^\/documents\/\d+$/.test(path))) return true;
  if (path === "/payments/stats" || ["POST", "PATCH", "DELETE"].includes(method) && (path === "/payments" || /^\/payments\/\d+$/.test(path))) return true;
  if (method === "PATCH" && /^\/tickets\/\d+$/.test(path)) return true;
  if (method === "POST" && path === "/notifications") return true;
  return false;
}

const apiAccessGuard: RequestHandler = (req, res, next) => {
  void (async () => {
    if (publicRoutes.has(`${req.method} ${req.path}`)) {
      if (req.path === "/cases/track" && (!req.query.caseNumber || !req.query.mobile)) {
        res.status(400).json({ error: "Provide both caseNumber and registered mobile number" });
        return;
      }
      next();
      return;
    }

    const user = await getRequestUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (adminOnly(req.method, req.path)) {
      if (!isAdmin(user.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }
    next();
  })().catch(next);
};

router.use(apiAccessGuard);
router.use(healthRouter);
router.use(authRouter);
router.use(staffRouter);
router.use(leadsRouter);
router.use(customersRouter);
router.use(casesRouter);
router.use(documentsRouter);
router.use(paymentsRouter);
router.use(payuRouter);
router.use(referralsRouter);
router.use(ticketsRouter);
router.use(notificationsRouter);
router.use(adminRouter);

export default router;
