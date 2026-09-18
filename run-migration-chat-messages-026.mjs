import pg from "pg";
import fs from "fs";
const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) { console.error("Defina MIGRATION_DB_PASSWORD."); process.exit(1); }
const SQL = fs.readFileSync(new URL("./migrations/026_chat_messages_media_document.sql", import.meta.url), "utf8");
const client = new pg.Client({ host: "db.bvydxgjotxxkkszubvbx.supabase.co", port: 5432, user: "postgres", password: PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(SQL);
  const c = await client.query("select pg_get_constraintdef(oid) def from pg_constraint where conname='chat_messages_media_type_check'");
  console.log("OK:", c.rows[0]?.def);
} catch (e) { console.error("Erro:", e.message); process.exit(1); } finally { await client.end(); }
