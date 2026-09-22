import pg from "pg";
import fs from "fs";
const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) { console.error("Defina MIGRATION_DB_PASSWORD."); process.exit(1); }
const SQL = fs.readFileSync(new URL("./migrations/028_lead_capture_e_interesse_jh.sql", import.meta.url), "utf8");
const client = new pg.Client({ host: "db.bvydxgjotxxkkszubvbx.supabase.co", port: 5432, user: "postgres", password: PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(SQL);
  const fn = await client.query("select proname from pg_proc where proname='upsert_cliente'");
  const tab = await client.query("select table_name from information_schema.tables where table_name='jantar_harmonizado_interesse'");
  console.log("OK fn upsert_cliente:", fn.rows.length > 0, "| tabela interesse:", tab.rows.length > 0);
} catch (e) { console.error("Erro:", e.message); process.exit(1); } finally { await client.end(); }
