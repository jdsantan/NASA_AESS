import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const file = process.env.ASTRIA_DB_FILE || fileURLToPath(new URL("../data/db.json", import.meta.url));

export function initDB() {
  mkdirSync(dirname(file), { recursive: true });
  if (!existsSync(file)) writeDB({ reports: [] });
}

export function readDB() {
  const content = JSON.parse(readFileSync(file, "utf-8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(content.reports)) throw new Error("Formato de base de datos inválido.");
  return content;
}

export function writeDB(data) {
  const temporary = file + ".tmp";
  writeFileSync(temporary, JSON.stringify(data, null, 2));
  renameSync(temporary, file);
}
