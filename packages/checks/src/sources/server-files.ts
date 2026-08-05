import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { SqlFile } from "./migrations";

/**
 * Server-side TypeScript that must derive calendar days through the `datetime`
 * API (explicit company/location timezone), never the process clock. Client
 * components are exempt — the browser's timezone IS the right one there.
 */
const SERVER_ROOTS = [
  "apps/mes/app/services",
  "packages/jobs/src",
  "packages/database/supabase/functions"
];

/** ERP module server files are matched by suffix inside apps/erp/app/modules. */
const ERP_MODULES_ROOT = "apps/erp/app/modules";
const ERP_SERVER_SUFFIXES = [".service.ts", ".server.ts"];

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path, out);
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      out.push(path);
    }
  }
}

/** Every server-side TS file, as repo-relative { file, contents }. */
export function loadServerFiles(root: string): SqlFile[] {
  const paths: string[] = [];

  for (const rel of SERVER_ROOTS) {
    walk(join(root, rel), paths);
  }

  const erpPaths: string[] = [];
  walk(join(root, ERP_MODULES_ROOT), erpPaths);
  for (const path of erpPaths) {
    if (ERP_SERVER_SUFFIXES.some((suffix) => path.endsWith(suffix))) {
      paths.push(path);
    }
  }

  return paths
    .map((path) => relative(root, path))
    .sort()
    .map((file) => ({
      file,
      contents: readFileSync(join(root, file), "utf8")
    }));
}
