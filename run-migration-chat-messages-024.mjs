import pg from "pg";
import fs from "fs";
const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) { console.error("Defina MIGRATION_DB_PASSWORD."); process.exit(1); }
const SQL = fs.readFileSync(new URL("./migrations/024_chat_messages_unique_plain.sql", import.meta.url), "utf8");
const client = new pg.Client({ host: "db.bvydxgjotxxkkszubvbx.supabase.co", port: 5432, user: "postgres", password: PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(SQL);
  const idx = await client.query("select indexdef from pg_indexes where indexname='uq_chat_messages_message_id'");
  console.log("OK:", idx.rows[0]?.indexdef);
} catch (e) { console.error("Erro:", e.message); process.exit(1); } finally { await client.end(); }
