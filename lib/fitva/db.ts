/**
 * Server-only connection to the FITVA database (`fitva_db`, see database/DB_CONTRACT.md).
 * Everything goes through the `usp_*` stored functions — no inline table SQL in the app.
 *
 * Type parsers are set on this pool only (not globally, so Prisma/Better Auth are untouched):
 *  - date        → "YYYY-MM-DD" string (node-pg would shift it to local midnight)
 *  - bigint      → number (counts and sums are small)
 *  - timestamptz → ISO string
 */
import { Pool, types } from "pg";

const PG_INT8 = 20;
const PG_DATE = 1082;
const PG_TIMESTAMPTZ = 1184;

const parsers: Record<number, (value: string) => unknown> = {
  [PG_INT8]: (value) => Number(value),
  [PG_DATE]: (value) => value,
  [PG_TIMESTAMPTZ]: (value) => new Date(value).toISOString(),
};

const getTypeParser = ((oid: number, format?: "text" | "binary") =>
  parsers[oid] ?? types.getTypeParser(oid, format)) as typeof types.getTypeParser;

// Reuse one pool across dev hot reloads.
const globalForFitva = globalThis as unknown as { fitvaPool?: Pool };

function pool() {
  if (!globalForFitva.fitvaPool) {
    const connectionString = process.env.FITVA_DATABASE_URL;
    if (!connectionString) {
      throw new Error("FITVA_DATABASE_URL is not set (needed while AUTH_MODE=fitva).");
    }
    globalForFitva.fitvaPool = new Pool({ connectionString, max: 5, types: { getTypeParser } });
  }
  return globalForFitva.fitvaPool;
}

/** Calls a set-returning `usp_*` function: `select * from fn($1, $2, …)`. */
export async function callFn<Row>(name: `usp_${string}`, args: unknown[] = []): Promise<Row[]> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await pool().query(`select * from ${name}(${placeholders})`, args);
  return rows as Row[];
}

/** Calls a scalar `usp_*` function (e.g. `usp_client_save` → uuid) and returns its value. */
export async function callScalar<T>(name: `usp_${string}`, args: unknown[] = []): Promise<T> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await pool().query(`select ${name}(${placeholders}) as value`, args);
  return rows[0]?.value as T;
}
