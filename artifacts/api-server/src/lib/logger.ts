import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
export const sensitiveLogPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.pan",
  "req.body.objectPath",
  "res.headers['set-cookie']",
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: sensitiveLogPaths,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
