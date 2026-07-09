// One-off SQL runner against the Supabase Postgres (IPv4 session pooler).
// No secrets in this file: DB password comes from SUPABASE_DB_PASSWORD.
// Usage: SUPABASE_DB_PASSWORD=... node scripts/db/apply-sql.mjs <file.sql>
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { dbSsl } from './ssl.mjs';

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('Set SUPABASE_DB_PASSWORD');
  process.exit(1);
}
const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/db/apply-sql.mjs <file.sql>');
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST || 'aws-1-us-east-2.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  user: process.env.SUPABASE_DB_USER || 'postgres.tbmdwivhekzfkeidbwia',
  password,
  database: 'postgres',
  ssl: dbSsl(),
});

const sql = readFileSync(file, 'utf8');
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
  process.exitCode = 1;
} finally {
  await client.end();
}
