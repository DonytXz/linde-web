import { URL } from "node:url";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
const base = process.env.PAGES_BASE_PATH || "/linde-web/";
if (!base.startsWith("/") || !base.endsWith("/"))
  throw new Error("PAGES_BASE_PATH must start and end with /");
const result = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build", "--base", base],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_ROUTER_MODE: "hash", VITE_API_MODE: "live" },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
await writeFile("dist/.nojekyll", "");
if (process.env.PAGES_SITE_URL) {
  const site = new URL(process.env.PAGES_SITE_URL);
  if (site.protocol !== "https:")
    throw new Error("PAGES_SITE_URL must be HTTPS");
  const file = await readFile("dist/index.html", "utf8");
  await writeFile(
    "dist/index.html",
    file.replace(
      `content="${base}brand/social-es.png"`,
      `content="${new URL("brand/social-es.png", site.href.endsWith("/") ? site : site.href + "/").href}"`,
    ),
  );
}
