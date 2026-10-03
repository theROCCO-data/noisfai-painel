import pg from "pg";
import fs from "fs";
const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) { console.error("Defina MIGRATION_DB_PASSWORD."); process.exit(1); }
const SQL = fs.readFileSync(new URL("./migrations/031_alertas_reserva.sql", import.meta.url), "utf8");
// host direto (db.<ref>.supabase.co) sem DNS desde 24/09: usa o pooler (session mode)
const client = new pg.Client({ host: "aws-1-us-west-2.pooler.supabase.com", port: 5432, user: "postgres.bvydxgjotxxkkszubvbx", password: PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(SQL);
  const t = await client.query("select table_name from information_schema.tables where table_name='alertas_reserva'");
  console.log("OK tabela alertas_reserva:", t.rows.length > 0);
} catch (e) { console.error("Erro:", e.message); process.exit(1); } finally { await client.end(); }
