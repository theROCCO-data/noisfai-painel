import pg from "pg";
import fs from "fs";
const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) { console.error("Defina MIGRATION_DB_PASSWORD."); process.exit(1); }
const SQL = fs.readFileSync(new URL("./migrations/029_upsert_cliente_telefone_normalizado.sql", import.meta.url), "utf8");
const client = new pg.Client({ // host direto (db.<ref>.supabase.co) sem DNS desde 24/09: usa o pooler (session mode)
  host: "aws-1-us-west-2.pooler.supabase.com", port: 5432, user: "postgres.bvydxgjotxxkkszubvbx", password: PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(SQL);
  const fn = await client.query("select pg_get_functiondef('public.upsert_cliente(text,text,text,text)'::regprocedure) d");
  console.log("OK upsert_cliente com chave normalizada:", /right\(regexp_replace/.test(fn.rows[0].d));
} catch (e) { console.error("Erro:", e.message); process.exit(1); } finally { await client.end(); }
