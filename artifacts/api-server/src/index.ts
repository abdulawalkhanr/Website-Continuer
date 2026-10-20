import app from "./app";
import { logger } from "./lib/logger";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
  if (!existsSync(path.join(publicDir, "index.html"))) {
    throw new Error("Built website files are missing. Run the root build script before starting the production server.");
  }
  app.use(express.static(publicDir, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith("sw.js")) res.setHeader("Cache-Control", "no-cache");
    },
  }));
  app.get("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
