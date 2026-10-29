import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

export type Database = NodePgDatabase<Record<string, never>>;

const globalForDb = globalThis as typeof globalThis & {
  __cilrmngPool?: Pool;
  __cilrmngDb?: Database;
};

const SSL_MODES = new Set(["require", "verify-ca", "verify-full", "prefer", "no-verify"]);

/** Supabase hosts (direct connection and the Supavisor pooler). */
function isManagedHost(hostname: string): boolean {
  return (
    hostname.endsWith(".supabase.co") ||
    hostname.endsWith(".supabase.com") ||
    hostname.endsWith(".pooler.supabase.com") ||
    hostname.endsWith(".neon.tech") ||
    hostname.endsWith(".render.com") ||
    hostname.endsWith(".railway.app")
  );
}

function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.NETLIFY ||
      process.env.CF_PAGES ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV,
  );
}

/**
 * Supabase refuses unencrypted connections, but a bare `postgresql://` string
 * makes `pg` connect with no TLS at all. `pg` also lets the connection string
 * override an explicit `ssl` option, so we strip `sslmode` and decide here.
 */
export function buildPoolConfig(connectionString: string): PoolConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(
      "DATABASE_URL is not a valid URL. It should look like " +
        "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres",
    );
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`DATABASE_URL must start with postgresql:// (got "${url.protocol}//").`);
  }

  const sslMode = url.searchParams.get("sslmode");
  const useSsl =
    isManagedHost(url.hostname) ||
    (sslMode !== null && SSL_MODES.has(sslMode)) ||
    process.env.PGSSLMODE === "require";

  url.searchParams.delete("sslmode");

  const transactionPooler = url.port === "6543";
  const serverless = isServerless();
  const defaultMax = serverless ? 1 : transactionPooler ? 5 : 10;

  return {
    connectionString: url.toString(),
    ssl: useSsl ? { rejectUnauthorized: process.env.PGSSL_NO_VERIFY !== "1" } : undefined,
    max: Number(process.env.PGPOOL_MAX ?? defaultMax),
    idleTimeoutMillis: serverless ? 1_000 : 10_000,
    connectionTimeoutMillis: 15_000,
    application_name: "cilrmng-registry",
    keepAlive: true,
  };
}

/**
 * Created on first use, not at import time: `next build` imports every route,
 * and a top-level throw breaks the build when DATABASE_URL is absent.
 */
export function getPool(): Pool {
  if (globalForDb.__cilrmngPool) return globalForDb.__cilrmngPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and paste the connection " +
        "string from your Supabase dashboard (Connect → Transaction pooler). On Vercel, add " +
        "DATABASE_URL under Project → Settings → Environment Variables.",
    );
  }

  const pool = new Pool(buildPoolConfig(connectionString));
  pool.on("error", (error) => {
    console.error("[db] idle PostgreSQL client error:", error.message);
  });

  globalForDb.__cilrmngPool = pool;
  return pool;
}

function getDb(): Database {
  if (!globalForDb.__cilrmngDb) globalForDb.__cilrmngDb = drizzle(getPool());
  return globalForDb.__cilrmngDb;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    const instance = getDb();
    const value = Reflect.get(instance as object, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has(_target, property) {
    return property in getDb();
  },
});

export async function closePool(): Promise<void> {
  const pool = globalForDb.__cilrmngPool;
  globalForDb.__cilrmngPool = undefined;
  globalForDb.__cilrmngDb = undefined;
  if (pool) await pool.end();
}
