/**
 * Sync .env.local → Cloudflare Worker secrets (runtime).
 *
 * Usage: npm run cf-sync-env
 *
 * For Git/Workers Builds CI, also set build-time vars in the dashboard
 * (Settings → Build → Variables and secrets). OAuth from `wrangler login`
 * cannot write Builds env (needs Workers CI Write API token).
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
const workerName = "nityavastra";

const BUILD_TIME_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error("Missing .env.local — copy .env.example and fill values first.");
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));
if (!env.CRON_SECRET) {
  env.CRON_SECRET = randomBytes(32).toString("hex");
  console.log("Generated CRON_SECRET — add this to .env.local:");
  console.log(`CRON_SECRET=${env.CRON_SECRET}`);
}

const missingBuild = BUILD_TIME_KEYS.filter((k) => !env[k]);
if (missingBuild.length) {
  console.error("Missing required build-time vars in .env.local:", missingBuild.join(", "));
  process.exit(1);
}

const tmp = resolve(root, `.env.cloudflare-sync.${process.pid}.tmp`);
writeFileSync(
  tmp,
  Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
  "utf8"
);

console.log(`Uploading ${Object.keys(env).length} secrets to Worker "${workerName}"...`);
const result = spawnSync(
  "npx",
  ["wrangler", "secret", "bulk", tmp, "--name", workerName],
  { cwd: root, stdio: "inherit", shell: true }
);

try {
  unlinkSync(tmp);
} catch {
  /* ignore */
}

if (result.status !== 0) {
  console.error(
    "\nSecret upload failed. Deploy the Worker once first (`npm run deploy`), then re-run this script."
  );
  process.exit(result.status ?? 1);
}

console.log(`
Runtime secrets synced for Worker "${workerName}".

If you use Git → Workers Builds, set these as *Build* variables in:
  Cloudflare Dashboard → Workers → nityavastra → Settings → Build → Variables and secrets

${BUILD_TIME_KEYS.map((k) => `  ${k}=(from .env.local)`).join("\n")}

Also set Build/deploy command to:
  npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy
`);
