import pg from "pg";
import { readFileSync } from "fs";

const password = process.env.MIGRATION_DB_PASSWORD;
if (!password) {
  console.error("Defina MIGRATION_DB_PASSWORD");
  process.exit(1);
}

const client = new pg.Client({
  host: "db.bvydxgjotxxkkszubvbx.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const sql = readFileSync("migrations/001_cardapio_ifood.sql", "utf-8");
  await client.query(sql);
  console.log("Migração aplicada com sucesso.");

  const { rows: cardapio } = await client.query("select count(*) from cardapio_itens");
  const { rows: ifood } = await client.query("select count(*) from ifood_itens");
  console.log("cardapio_itens:", cardapio[0].count, "| ifood_itens:", ifood[0].count);
} catch (err) {
  console.error("ERRO:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
