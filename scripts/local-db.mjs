import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
export function openLocalDatabase(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(
    'PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS _presence_migrations (name TEXT PRIMARY KEY, hash TEXT NOT NULL)',
  );
  for (const file of readdirSync(resolve('migrations'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync(resolve('migrations', file), 'utf8');
    const hash = createHash('sha256').update(sql).digest('hex');
    const applied = db.prepare('SELECT hash FROM _presence_migrations WHERE name = ?').get(file);
    if (applied) {
      if (applied.hash !== hash) throw new Error('An applied migration was changed: ' + file);
      continue;
    }
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _presence_migrations(name,hash) VALUES(?,?)').run(file, hash);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  const statement = (sql, values = []) => ({
    bind(...next) {
      return statement(sql, next);
    },
    async first() {
      return db.prepare(sql).get(...values) || null;
    },
    async all() {
      return { results: db.prepare(sql).all(...values) };
    },
    async run() {
      const result = db.prepare(sql).run(...values);
      return { meta: { changes: Number(result.changes) } };
    },
  });
  return { binding: { prepare: (sql) => statement(sql) }, raw: db, close: () => db.close() };
}
