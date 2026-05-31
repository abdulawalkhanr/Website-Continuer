import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple in-memory session (no external dep needed)
const sessions = new Map<string, Record<string, unknown>>();

app.use((req, _res, next) => {
  const sessionId = req.cookies?.["session_id"] || `sess_${Math.random().toString(36).slice(2)}`;
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {});
  }
  (req as unknown as { session: Record<string, unknown>; sessionId: string }).session = sessions.get(sessionId)!;
  (req as unknown as { session: Record<string, unknown>; sessionId: string }).sessionId = sessionId;
  const origJson = _res.json.bind(_res);
  _res.json = function (body) {
    _res.cookie("session_id", sessionId, { httpOnly: true, sameSite: "lax", maxAge: 86400000 * 30 });
    return origJson(body);
  };
  next();
});

app.use("/api", router);

export default app;
