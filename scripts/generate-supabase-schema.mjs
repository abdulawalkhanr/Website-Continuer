import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(path.join(tmpdir(), "cir-schema-"));
try {
  const generated = spawnSync("pnpm", ["--filter", "@workspace/db", "exec", "drizzle-kit", "generate",
    "--dialect", "postgresql", "--schema", "./src/schema/index.ts", "--out", temp, "--name", "complete"], {
    cwd: root, stdio: "inherit",
  });
  if (generated.error) throw generated.error;
  if (generated.status !== 0) throw new Error("Drizzle schema generation failed.");
  const file = (await readdir(temp)).find(name => name.endsWith(".sql"));
  if (!file) throw new Error("Drizzle did not generate a SQL file.");
  const raw = await readFile(path.join(temp, file), "utf8");
  const snapshot = JSON.parse(await readFile(path.join(temp, "meta/0000_snapshot.json"), "utf8"));
  const statements = [];
  for (const statement of raw.split("--> statement-breakpoint").map(text => text.trim()).filter(Boolean)) {
    const enumMatch = statement.match(/^CREATE TYPE "public"\."(\w+)" AS ENUM/);
    const tableMatch = statement.match(/^CREATE TABLE "(\w+)" /);
    const fkMatch = statement.match(/^ALTER TABLE "(\w+)" ADD CONSTRAINT "(\w+)"/);
    if (enumMatch) {
      statements.push(`DO $cir$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = '${enumMatch[1]}') THEN\n    ${statement}\n  END IF;\nEND;\n$cir$;`);
    } else if (tableMatch) {
      if (tableMatch[1] !== "users") statements.push(statement.replace(/^CREATE TABLE "/, 'CREATE TABLE IF NOT EXISTS "public"."'));
    } else if (fkMatch) {
      if (fkMatch[1] === "users") throw new Error("Refusing to modify users.");
      statements.push(`DO $cir$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.${fkMatch[1]}'::regclass AND conname = '${fkMatch[2]}') THEN\n    ${statement.replace(/^ALTER TABLE "/, 'ALTER TABLE "public"."')}\n  END IF;\nEND;\n$cir$;`);
    } else if (/^CREATE (UNIQUE )?INDEX /.test(statement)) {
      statements.push(statement.replace(/^(CREATE (?:UNIQUE )?INDEX) /, "$1 IF NOT EXISTS "));
    } else {
      throw new Error(`Unrecognized DDL; review before publishing: ${statement.slice(0, 60)}`);
    }
  }
  const columns = Object.values(snapshot.tables).flatMap(table =>
    Object.keys(table.columns).map(column => `('${table.name}', '${column}')`));
  const labels = Object.values(snapshot.enums).flatMap(item =>
    item.values.map(value => `('${item.name}', '${value}')`));
  const sql = `-- CIR Consultation Service: safe, create-only Supabase setup.
-- Generated from EVERY exported lib/db/src/schema definition.
-- Existing public.users and its data, password hashes, constraints and sequence
-- are NOT created, altered, updated or reset by this script.
-- Existing incompatible tables/enums are NOT silently rewritten.
-- Run in Supabase > SQL Editor using the postgres role. Safe to run again.
-- Keep the Supabase Data API disabled unless you separately configure RLS.
-- Primary keys / UNIQUE constraints create their indexes automatically.
-- Drizzle $onUpdate is application-side behavior, not a database trigger.

BEGIN;
SET LOCAL search_path = public, pg_catalog;
DO $cir$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Existing public.users is required. This script deliberately does not create or modify users.';
  END IF;
END;
$cir$;

${statements.join("\n\n")}

COMMIT;

-- Read-only compatibility checks, including the untouched users table.
-- Every row should show OK. Report any MISSING result rather than resetting data.
WITH required(table_name, column_name) AS (VALUES
${columns.join(",\n")}
)
SELECT r.table_name,
  CASE WHEN count(*) FILTER (WHERE c.column_name IS NULL) = 0 THEN 'OK'
    ELSE 'MISSING COLUMNS: ' || string_agg(r.column_name, ', ') FILTER (WHERE c.column_name IS NULL) END AS compatibility
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = r.column_name
GROUP BY r.table_name ORDER BY r.table_name;

WITH required(enum_name, enum_label) AS (VALUES
${labels.join(",\n")}
)
SELECT r.enum_name,
  CASE WHEN count(*) FILTER (WHERE e.enumlabel IS NULL) = 0 THEN 'OK'
    ELSE 'MISSING VALUES: ' || string_agg(r.enum_label, ', ') FILTER (WHERE e.enumlabel IS NULL) END AS compatibility
FROM required r
LEFT JOIN pg_type t ON t.typname = r.enum_name AND t.typnamespace = 'public'::regnamespace
LEFT JOIN pg_enum e ON e.enumtypid = t.oid AND e.enumlabel = r.enum_label
GROUP BY r.enum_name ORDER BY r.enum_name;
`;
  await mkdir(path.join(root, "deployment"), { recursive: true });
  await writeFile(path.join(root, "deployment/supabase-missing-schema.sql"), sql);
  console.log(`Safe SQL generated: ${Object.keys(snapshot.tables).length - 1} non-users tables, ${Object.keys(snapshot.enums).length} enums.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
