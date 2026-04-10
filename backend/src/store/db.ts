import fs from 'fs';
import path from 'path';
import { createClient, type Client } from '@libsql/client';
import { config } from '../config';

let client: Client | null = null;

function resolveLocalDbUrl(): string {
  const dbPath = config.wallet.dbPath || path.resolve(__dirname, '../../../data/wallets.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const normalized = dbPath.replace(/\\/g, '/');
  return normalized.startsWith('file:') ? normalized : `file:${normalized}`;
}

export function getDbClient(): Client {
  if (client) return client;

  if (config.turso.url) {
    client = createClient({
      url: config.turso.url,
      authToken: config.turso.authToken || undefined,
    });
    console.log('[DB] Using Turso/libSQL remote database');
    return client;
  }

  const localUrl = resolveLocalDbUrl();
  client = createClient({ url: localUrl });
  console.log(`[DB] Using local SQLite file at ${localUrl}`);
  return client;
}
