// One-off SQL runner against the Supabase Postgres (IPv4 session pooler).
// No secrets in this file: DB password comes from SUPABASE_DB_PASSWORD.
// Dry-run by default (prints the SQL, connects to nothing). Pass --write to
// actually execute it, matching the --write convention of the other scripts.
// Usage: SUPABASE_DB_PASSWORD=... node scripts/db/apply-sql.mjs <file.sql> --write
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { dbSsl, certErrorHint } from './ssl.mjs';

const args = process.argv.slice(2);
const write = args.includes('--write');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('usage: node scripts/db/apply-sql.mjs <file.sql> [--write]');
  process.exit(1);
}

const sql = readFileSync(file, 'utf8');
const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-2.pooler.supabase.com';

if (!write) {
  console.log(`DRY RUN. Would apply ${file} to ${host}.`);
  console.log('Nothing was executed. Re-run with --write to apply. SQL:\n');
  console.log(sql);
  process.exit(0);
}

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('Set SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const client = new pg.Client({
  host,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  user: process.env.SUPABASE_DB_USER || 'postgres.tbmdwivhekzfkeidbwia',
  password,
  database: 'postgres',
  ssl: dbSsl(),
});

try {
  await client.connect();
  await client.query(sql);
  const { rows } = await client.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename",
  );
  console.log('Applied:', file);
  console.log('public tables:', rows.map((r) => r.tablename).join(', '));
} catch (e) {
  console.error('FAILED:', e.message);
  const hint = certErrorHint(e);
  if (hint) console.error(hint);
  process.exitCode = 1;
} finally {
  await client.end();
}
