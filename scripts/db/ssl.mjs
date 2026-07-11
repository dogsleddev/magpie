import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * TLS config for the operator scripts' direct Postgres connection.
 *
 * Secure by default: the DB password is never sent over unverified TLS. The
 * Supabase pooler (aws-*.pooler.supabase.com) presents a cert signed by a
 * PRIVATE Supabase CA, not a public root, so verification REQUIRES that CA
 * bundle. Download it from the dashboard (Project Settings -> Database -> SSL
 * configuration) to scripts/db/prod-ca-2021.crt and it is picked up here
 * automatically. Without it these scripts fail closed with a self-signed-cert
 * error (certErrorHint explains the fix), which is the safe default.
 *
 * SUPABASE_DB_SSL_INSECURE=1 is a deliberate, loud escape hatch that disables
 * verification for a one-off run. Never the default.
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

/**
 * If a connection error is a TLS/cert-verification failure, return an actionable
 * hint (the pooler's private CA is missing). Returns null for other errors so
 * callers only print it when relevant.
 */
export function certErrorHint(err) {
  const s = `${err?.code ?? ''} ${err?.message ?? ''}`.toLowerCase();
  if (!s.includes('cert') && !s.includes('self-signed') && !s.includes('self signed')) return null;
  return [
    'This is a TLS verification failure: the Supabase pooler uses a private CA.',
    'Fix: dashboard -> Project Settings -> Database -> SSL configuration -> download the CA',
    'to scripts/db/prod-ca-2021.crt, then re-run. One-off bypass: prefix SUPABASE_DB_SSL_INSECURE=1.',
  ].join('\n');
}
