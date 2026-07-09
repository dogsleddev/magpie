import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * TLS config for the operator scripts' direct Postgres connection.
 *
 * Secure by default: verifies the server certificate. The Supabase pooler
 * presents a publicly-trusted cert, so the system CA store is enough and no
 * file is needed. If your project hands out a private CA bundle instead
 * (Dashboard -> Project Settings -> Database -> SSL configuration), download it
 * to scripts/db/prod-ca-2021.crt and it is picked up automatically.
 *
 * SUPABASE_DB_SSL_INSECURE=1 is a deliberate, loud escape hatch that disables
 * verification (the old `rejectUnauthorized: false` behavior). Use it only as a
 * temporary unblock, never as the default.
 */
export function dbSsl() {
  if (process.env.SUPABASE_DB_SSL_INSECURE === '1') {
    console.warn('WARNING: TLS verification disabled (SUPABASE_DB_SSL_INSECURE=1).');
    return { rejectUnauthorized: false };
  }
  const caPath = fileURLToPath(new URL('./prod-ca-2021.crt', import.meta.url));
  if (existsSync(caPath)) {
    return { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
  }
  return { rejectUnauthorized: true };
}
