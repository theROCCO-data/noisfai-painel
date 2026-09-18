import pg from "pg";
import fs from "fs";
const PASSWORD = process.env.MIGRATION_DB_PASSWORD;
if (!PASSWORD) { console.error("Defina MIGRATION_DB_PASSWORD."); process.exit(1); }
const SQL = fs.readFileSync(new URL("./migrations/025_chat_messages_remote_jid.sql", import.meta.url), "utf8");
const client = new pg.Client({ host: "db.bvydxgjotxxkkszubvbx.supabase.co", port: 5432, user: "postgres", password: PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(SQL);
  const col = await client.query("select column_name, data_type from information_schema.columns where table_name='chat_messages' and column_name='remote_jid'");
  console.log("OK coluna:", JSON.stringify(col.rows[0]));
} catch (e) { console.error("Erro:", e.message); process.exit(1); } finally { await client.end(); }
