import pg from "pg";
const password = process.env.MIGRATION_DB_PASSWORD;
if (!password) { console.error("Defina MIGRATION_DB_PASSWORD"); process.exit(1); }
const client = new pg.Client({
  host: "db.bvydxgjotxxkkszubvbx.supabase.co", port: 5432, database: "postgres", user: "postgres", password,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const { rows: coltype } = await client.query(`
  select column_name, data_type, udt_name from information_schema.columns
  where table_name='reservas' and column_name='status'
`);
console.log("coluna:", coltype);
const { rows: constraints } = await client.query(`
  select conname, pg_get_constraintdef(oid) as def from pg_constraint
  where conrelid = 'public.reservas'::regclass and contype = 'c'
`);
console.log("check constraints:", constraints);
const { rows: distinctStatus } = await client.query(`select distinct status from public.reservas`);
console.log("valores distintos hoje:", distinctStatus);
await client.end();
