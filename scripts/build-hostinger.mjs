import { spawnSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, NODE_ENV: "production", BASE_PATH: "/", PORT: process.env.PORT || "3000" };
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run("pnpm", ["run", "typecheck"]);
run("pnpm", ["--filter", "@workspace/cir-website", "run", "build"]);
run(process.execPath, ["artifacts/api-server/build.mjs"]);
const output = path.join(root, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, "artifacts/api-server/dist"), output, { recursive: true });
await cp(path.join(root, "artifacts/cir-website/dist/public"), path.join(output, "public"), { recursive: true });
console.log("Hostinger build ready: dist/index.mjs serves both /api and the React website.");
