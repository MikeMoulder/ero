import { type Client } from '@libsql/client';
import { getDbClient } from './db';

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
  private db!: Client;

  async initialize(): Promise<void> {
    this.db = getDbClient();

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS agent_wallets (
        user_public_key TEXT PRIMARY KEY,
        agent_public_key TEXT NOT NULL UNIQUE,
        agent_secret_key_enc TEXT NOT NULL,
        activated INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    console.log('[WalletStore] Database initialized');
  }

  private validatePublicKey(key: string): void {
    if (!key || !STELLAR_PUBLIC_KEY_RE.test(key)) {
      throw new Error(`Invalid Stellar public key: ${key ? key.slice(0, 8) + '...' : '(empty)'}`);
    }
  }

  async getWallet(userPublicKey: string): Promise<AgentWalletRow | undefined> {
    this.validatePublicKey(userPublicKey);
    const rs = await this.db.execute({
      sql: 'SELECT * FROM agent_wallets WHERE user_public_key = ?',
      args: [userPublicKey],
    });
    return rs.rows[0] as unknown as AgentWalletRow | undefined;
  }

  async createWallet(userPublicKey: string, agentPublicKey: string, encryptedSecret: string): Promise<AgentWalletRow> {
    this.validatePublicKey(userPublicKey);
    this.validatePublicKey(agentPublicKey);

    await this.db.execute({
      sql: `
        INSERT INTO agent_wallets (user_public_key, agent_public_key, agent_secret_key_enc)
        VALUES (?, ?, ?)
      `,
      args: [userPublicKey, agentPublicKey, encryptedSecret],
    });

    return (await this.getWallet(userPublicKey))!;
  }

  async markActivated(userPublicKey: string): Promise<void> {
    this.validatePublicKey(userPublicKey);
    await this.db.execute({
      sql: `
        UPDATE agent_wallets SET activated = 1, updated_at = datetime('now')
        WHERE user_public_key = ?
      `,
      args: [userPublicKey],
    });
  }

  async deleteWallet(userPublicKey: string): Promise<void> {
    this.validatePublicKey(userPublicKey);
    await this.db.execute({
      sql: 'DELETE FROM agent_wallets WHERE user_public_key = ?',
      args: [userPublicKey],
    });
  }

  async getAllWallets(): Promise<AgentWalletRow[]> {
    const rs = await this.db.execute('SELECT * FROM agent_wallets');
    return rs.rows as unknown as AgentWalletRow[];
  }

  close(): void {
    console.log('[WalletStore] Database close requested');
  }
}

export const walletStore = new WalletStore();
