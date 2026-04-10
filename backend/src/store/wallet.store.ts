import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const STELLAR_PUBLIC_KEY_RE = /^G[A-Z2-7]{55}$/;

export interface AgentWalletRow {
  user_public_key: string;
  agent_public_key: string;
  agent_secret_key_enc: string;
  activated: number;
  created_at: string;
  updated_at: string;
}

class WalletStore {
  private db!: Database.Database;

  initialize(): void {
    const dbPath = config.wallet.dbPath || path.resolve(__dirname, '../../../data/wallets.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_wallets (
        user_public_key TEXT PRIMARY KEY,
        agent_public_key TEXT NOT NULL UNIQUE,
        agent_secret_key_enc TEXT NOT NULL,
        activated INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    console.log('[WalletStore] SQLite initialized');
  }

  private validatePublicKey(key: string): void {
    if (!key || !STELLAR_PUBLIC_KEY_RE.test(key)) {
      throw new Error(`Invalid Stellar public key: ${key ? key.slice(0, 8) + '...' : '(empty)'}`);
    }
  }

  getWallet(userPublicKey: string): AgentWalletRow | undefined {
    this.validatePublicKey(userPublicKey);
    return this.db.prepare(
      'SELECT * FROM agent_wallets WHERE user_public_key = ?'
    ).get(userPublicKey) as AgentWalletRow | undefined;
  }

  createWallet(userPublicKey: string, agentPublicKey: string, encryptedSecret: string): AgentWalletRow {
    this.validatePublicKey(userPublicKey);
    this.validatePublicKey(agentPublicKey);

    this.db.prepare(
      `INSERT INTO agent_wallets (user_public_key, agent_public_key, agent_secret_key_enc)
       VALUES (?, ?, ?)`
    ).run(userPublicKey, agentPublicKey, encryptedSecret);

    return this.getWallet(userPublicKey)!;
  }

  markActivated(userPublicKey: string): void {
    this.validatePublicKey(userPublicKey);
    this.db.prepare(
      `UPDATE agent_wallets SET activated = 1, updated_at = datetime('now')
       WHERE user_public_key = ?`
    ).run(userPublicKey);
  }

  deleteWallet(userPublicKey: string): void {
    this.validatePublicKey(userPublicKey);
    this.db.prepare(
      'DELETE FROM agent_wallets WHERE user_public_key = ?'
    ).run(userPublicKey);
  }

  getAllWallets(): AgentWalletRow[] {
    return this.db.prepare('SELECT * FROM agent_wallets').all() as AgentWalletRow[];
  }

  close(): void {
    if (this.db) {
      try {
        this.db.pragma('wal_checkpoint(TRUNCATE)');
        this.db.close();
        console.log('[WalletStore] SQLite closed cleanly');
      } catch (err: any) {
        console.error('[WalletStore] Error closing database:', err.message);
      }
    }
  }
}

export const walletStore = new WalletStore();
