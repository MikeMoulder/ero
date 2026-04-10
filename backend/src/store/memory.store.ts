import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { RegisteredAPI, PaymentRequest, Task, LogEntry } from '../types';
import { sorobanService } from '../services/soroban.service';
import { config } from '../config';

const MAX_LOGS = 2000;
const PAYMENT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CONSECUTIVE_SYNC_FAILURES = 10;

// === Row ↔ Object mappers ===

interface ApiRow {
  id: string; name: string; base_url: string; slug: string; price: number;
  receiver_address: string; owner: string; status: string;
  call_count: number; total_revenue: number; created_at: string;
}

interface PaymentRow {
  id: string; api_id: string; api_name: string; amount: number;
  destination_address: string; memo: string; status: string;
  tx_hash: string | null; caller_type: string;
  agent_id: string | null; task_id: string | null;
  user_public_key: string;
  created_at: string; verified_at: string | null;
}

interface TaskRow {
  id: string; prompt: string; user_public_key: string; status: string;
  steps: string; agents: string; total_spent: number;
  result: string | null; created_at: string; completed_at: string | null;
}

interface LogRow {
  id: number; timestamp: string; level: string; source: string;
  message: string; user_public_key: string; data: string | null;
}

function rowToApi(r: ApiRow): RegisteredAPI {
  return {
    id: r.id, name: r.name, baseUrl: r.base_url, slug: r.slug,
    price: r.price, receiverAddress: r.receiver_address, owner: r.owner,
    status: r.status as RegisteredAPI['status'],
    callCount: r.call_count, totalRevenue: r.total_revenue, createdAt: r.created_at,
  };
}

function rowToPayment(r: PaymentRow): PaymentRequest {
  return {
    id: r.id, apiId: r.api_id, apiName: r.api_name, amount: r.amount,
    destinationAddress: r.destination_address, memo: r.memo,
    status: r.status as PaymentRequest['status'],
    txHash: r.tx_hash, callerType: r.caller_type as PaymentRequest['callerType'],
    agentId: r.agent_id, taskId: r.task_id,
    userPublicKey: r.user_public_key,
    createdAt: r.created_at, verifiedAt: r.verified_at,
  };
}

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id, prompt: r.prompt, userPublicKey: r.user_public_key,
    status: r.status as Task['status'],
    steps: safeParse(r.steps, []),
    agents: safeParse(r.agents, []),
    totalSpent: r.total_spent,
    result: r.result != null ? safeParse(r.result, null) : null,
    createdAt: r.created_at, completedAt: r.completed_at,
  };
}

function rowToLog(r: LogRow): LogEntry {
  return {
    timestamp: r.timestamp, level: r.level as LogEntry['level'],
    source: r.source, message: r.message,
    ...(r.user_public_key ? { userPublicKey: r.user_public_key } : {}),
    ...(r.data != null ? { data: safeParse(r.data, undefined) } : {}),
  };
}

function safeParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json); } catch { return fallback; }
}

// camelCase → snake_case field mappings for dynamic UPDATE builders
const API_FIELD_MAP: Record<string, string> = {
  id: 'id', name: 'name', baseUrl: 'base_url', slug: 'slug', price: 'price',
  receiverAddress: 'receiver_address', owner: 'owner', status: 'status',
  callCount: 'call_count', totalRevenue: 'total_revenue', createdAt: 'created_at',
};

const PAYMENT_FIELD_MAP: Record<string, string> = {
  id: 'id', apiId: 'api_id', apiName: 'api_name', amount: 'amount',
  destinationAddress: 'destination_address', memo: 'memo', status: 'status',
  txHash: 'tx_hash', callerType: 'caller_type', agentId: 'agent_id',
  taskId: 'task_id', userPublicKey: 'user_public_key',
  createdAt: 'created_at', verifiedAt: 'verified_at',
};

const TASK_FIELD_MAP: Record<string, string> = {
  id: 'id', prompt: 'prompt', userPublicKey: 'user_public_key', status: 'status',
  steps: 'steps', agents: 'agents', totalSpent: 'total_spent',
  result: 'result', createdAt: 'created_at', completedAt: 'completed_at',
};

// JSON-serialized fields
const TASK_JSON_FIELDS = new Set(['steps', 'agents', 'result']);

// Strip prototype-polluting keys from update objects
function sanitize<T>(updates: Partial<T>): Partial<T> {
  const obj = updates as any;
  delete obj.__proto__;
  delete obj.constructor;
  delete obj.prototype;
  return obj;
}

function buildUpdate(
  table: string,
  fieldMap: Record<string, string>,
  id: string,
  updates: Record<string, any>,
  jsonFields?: Set<string>,
): { sql: string; params: any[] } | null {
  const cols: string[] = [];
  const params: any[] = [];
  for (const [camel, val] of Object.entries(updates)) {
    const col = fieldMap[camel];
    if (!col || col === 'id') continue;
    cols.push(`${col} = ?`);
    if (jsonFields?.has(camel)) {
      params.push(val != null ? JSON.stringify(val) : null);
    } else {
      params.push(val ?? null);
    }
  }
  if (cols.length === 0) return null;
  params.push(id);
  return { sql: `UPDATE ${table} SET ${cols.join(', ')} WHERE id = ?`, params };
}

class Store {
  private db!: Database.Database;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private expiryInterval: ReturnType<typeof setInterval> | null = null;
  private consecutiveSyncFailures = 0;

  // === Lifecycle ===

  initialize(): void {
    const dbPath = config.wallet.dbPath || path.resolve(__dirname, '../../../data/wallets.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS apis (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        receiver_address TEXT NOT NULL,
        owner TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        call_count INTEGER NOT NULL DEFAULT 0,
        total_revenue REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        api_id TEXT NOT NULL,
        api_name TEXT NOT NULL,
        amount REAL NOT NULL,
        destination_address TEXT NOT NULL,
        memo TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        tx_hash TEXT,
        caller_type TEXT NOT NULL DEFAULT 'manual',
        agent_id TEXT,
        task_id TEXT,
        user_public_key TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        verified_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        user_public_key TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        steps TEXT NOT NULL DEFAULT '[]',
        agents TEXT NOT NULL DEFAULT '[]',
        total_spent REAL NOT NULL DEFAULT 0,
        result TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL,
        source TEXT NOT NULL,
        message TEXT NOT NULL,
        user_public_key TEXT NOT NULL DEFAULT '',
        data TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    `);

    console.log('[Store] SQLite initialized');

    // Migration: add user_public_key to payments if missing (existing DBs)
    try {
      this.db.exec(`ALTER TABLE payments ADD COLUMN user_public_key TEXT NOT NULL DEFAULT ''`);
      console.log('[Store] Migrated payments table: added user_public_key');
    } catch {
      // Column already exists
    }

    // Migration: add user_public_key to logs if missing
    try {
      this.db.exec(`ALTER TABLE logs ADD COLUMN user_public_key TEXT NOT NULL DEFAULT ''`);
      console.log('[Store] Migrated logs table: added user_public_key');
    } catch {
      // Column already exists
    }

    // Add user-scoped indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_public_key);
      CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_public_key);
    `);
  }

  close(): void {
    if (this.db) {
      try {
        this.db.pragma('wal_checkpoint(TRUNCATE)');
        this.db.close();
        console.log('[Store] SQLite closed cleanly');
      } catch (err: any) {
        console.error('[Store] Error closing database:', err.message);
      }
    }
  }

  // === Soroban sync (unchanged logic, now backed by SQLite) ===

  async syncFromContract(): Promise<void> {
    if (!sorobanService.isConfigured()) return;

    try {
      const onChainApis = await sorobanService.getAllApis();

      for (const onChain of onChainApis) {
        const existing = this.getApi(onChain.id) || this.getApiBySlug(onChain.slug);
        if (existing) {
          // Preserve local stats
          onChain.callCount = existing.callCount;
          onChain.totalRevenue = existing.totalRevenue;
          // Remove old entry if ID changed (matched by slug)
          if (existing.id !== onChain.id) {
            this.removeApi(existing.id);
          }
        }
        // Upsert
        this.db.prepare(`
          INSERT OR REPLACE INTO apis (id, name, base_url, slug, price, receiver_address, owner, status, call_count, total_revenue, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          onChain.id, onChain.name, onChain.baseUrl, onChain.slug, onChain.price,
          onChain.receiverAddress, onChain.owner, onChain.status,
          onChain.callCount, onChain.totalRevenue, onChain.createdAt,
        );
      }

      // Remove on-chain-originated APIs that no longer exist
      if (onChainApis.length > 0) {
        const onChainIds = new Set(onChainApis.map(a => a.id));
        const ownedApis = this.db.prepare(
          `SELECT id FROM apis WHERE owner != ''`
        ).all() as { id: string }[];
        for (const { id } of ownedApis) {
          if (!onChainIds.has(id)) {
            this.removeApi(id);
          }
        }
      }

      this.consecutiveSyncFailures = 0;
      console.log(`[Store] Synced ${onChainApis.length} APIs from Soroban contract`);
    } catch (err: any) {
      this.consecutiveSyncFailures++;
      if (this.consecutiveSyncFailures <= 3 || this.consecutiveSyncFailures % 10 === 0) {
        console.warn(`[Store] Contract sync failed (${this.consecutiveSyncFailures}x):`, err.message);
      }
      if (this.consecutiveSyncFailures >= MAX_CONSECUTIVE_SYNC_FAILURES && this.syncInterval) {
        console.error(`[Store] Stopping auto-sync after ${MAX_CONSECUTIVE_SYNC_FAILURES} consecutive failures`);
        this.stopAutoSync();
      }
    }
  }

  startAutoSync(intervalMs = 30000): void {
    if (this.syncInterval) return;
    this.syncFromContract();
    this.syncInterval = setInterval(() => this.syncFromContract(), intervalMs);

    if (!this.expiryInterval) {
      this.expiryInterval = setInterval(() => this.expirePendingPayments(), 60000);
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
  }

  // === APIs ===

  addApi(api: RegisteredAPI): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO apis (id, name, base_url, slug, price, receiver_address, owner, status, call_count, total_revenue, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      api.id, api.name, api.baseUrl, api.slug, api.price,
      api.receiverAddress, api.owner, api.status,
      api.callCount, api.totalRevenue, api.createdAt,
    );
  }

  getApi(id: string): RegisteredAPI | undefined {
    const row = this.db.prepare('SELECT * FROM apis WHERE id = ?').get(id) as ApiRow | undefined;
    return row ? rowToApi(row) : undefined;
  }

  getApiBySlug(slug: string): RegisteredAPI | undefined {
    const row = this.db.prepare('SELECT * FROM apis WHERE slug = ?').get(slug) as ApiRow | undefined;
    return row ? rowToApi(row) : undefined;
  }

  getAllApis(): RegisteredAPI[] {
    const rows = this.db.prepare('SELECT * FROM apis').all() as ApiRow[];
    return rows.map(rowToApi);
  }

  getApisByOwner(owner: string): RegisteredAPI[] {
    const rows = this.db.prepare('SELECT * FROM apis WHERE owner = ?').all(owner) as ApiRow[];
    return rows.map(rowToApi);
  }

  removeApi(id: string): boolean {
    const result = this.db.prepare('DELETE FROM apis WHERE id = ?').run(id);
    return result.changes > 0;
  }

  updateApi(id: string, updates: Partial<RegisteredAPI>): boolean {
    const clean = sanitize(updates);
    const upd = buildUpdate('apis', API_FIELD_MAP, id, clean as Record<string, any>);
    if (!upd) return false;
    const result = this.db.prepare(upd.sql).run(...upd.params);
    return result.changes > 0;
  }

  // === Payments ===

  addPayment(payment: PaymentRequest): void {
    this.db.prepare(`
      INSERT INTO payments (id, api_id, api_name, amount, destination_address, memo, status, tx_hash, caller_type, agent_id, task_id, user_public_key, created_at, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payment.id, payment.apiId, payment.apiName, payment.amount,
      payment.destinationAddress, payment.memo, payment.status,
      payment.txHash, payment.callerType, payment.agentId, payment.taskId,
      payment.userPublicKey,
      payment.createdAt, payment.verifiedAt,
    );
  }

  getPayment(id: string): PaymentRequest | undefined {
    const row = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as PaymentRow | undefined;
    return row ? rowToPayment(row) : undefined;
  }

  getAllPayments(): PaymentRequest[] {
    const rows = this.db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all() as PaymentRow[];
    return rows.map(rowToPayment);
  }

  getPaymentsByUser(userPublicKey: string): PaymentRequest[] {
    const rows = this.db.prepare('SELECT * FROM payments WHERE user_public_key = ? ORDER BY created_at DESC').all(userPublicKey) as PaymentRow[];
    return rows.map(rowToPayment);
  }

  updatePayment(id: string, updates: Partial<PaymentRequest>): boolean {
    const clean = sanitize(updates);
    const upd = buildUpdate('payments', PAYMENT_FIELD_MAP, id, clean as Record<string, any>);
    if (!upd) return false;
    const result = this.db.prepare(upd.sql).run(...upd.params);
    return result.changes > 0;
  }

  // === Tasks ===

  addTask(task: Task): void {
    this.db.prepare(`
      INSERT INTO tasks (id, prompt, user_public_key, status, steps, agents, total_spent, result, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id, task.prompt, task.userPublicKey, task.status,
      JSON.stringify(task.steps), JSON.stringify(task.agents),
      task.totalSpent, task.result != null ? JSON.stringify(task.result) : null,
      task.createdAt, task.completedAt,
    );
  }

  getTask(id: string): Task | undefined {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  getAllTasks(): Task[] {
    const rows = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as TaskRow[];
    return rows.map(rowToTask);
  }

  getTasksByUser(userPublicKey: string): Task[] {
    const rows = this.db.prepare('SELECT * FROM tasks WHERE user_public_key = ? ORDER BY created_at DESC').all(userPublicKey) as TaskRow[];
    return rows.map(rowToTask);
  }

  updateTask(id: string, updates: Partial<Task>): boolean {
    const clean = sanitize(updates);
    const upd = buildUpdate('tasks', TASK_FIELD_MAP, id, clean as Record<string, any>, TASK_JSON_FIELDS);
    if (!upd) return false;
    const result = this.db.prepare(upd.sql).run(...upd.params);
    return result.changes > 0;
  }

  // === Logs ===

  addLog(entry: LogEntry): void {
    this.db.prepare(`
      INSERT INTO logs (timestamp, level, source, message, user_public_key, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      entry.timestamp, entry.level, entry.source, entry.message,
      entry.userPublicKey || '',
      entry.data != null ? JSON.stringify(entry.data) : null,
    );

    // Prune old logs
    const count = (this.db.prepare('SELECT COUNT(*) as cnt FROM logs').get() as { cnt: number }).cnt;
    if (count > MAX_LOGS) {
      this.db.prepare(`
        DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT ?)
      `).run(MAX_LOGS);
    }
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    const rows = this.db.prepare(
      'SELECT * FROM logs ORDER BY id DESC LIMIT ?'
    ).all(count) as LogRow[];
    return rows.map(rowToLog).reverse();
  }

  getRecentLogsByUser(userPublicKey: string, count: number = 50): LogEntry[] {
    const rows = this.db.prepare(
      `SELECT * FROM logs
       WHERE user_public_key = ?
       ORDER BY id DESC
       LIMIT ?`
    ).all(userPublicKey, count) as LogRow[];
    return rows.map(rowToLog).reverse();
  }

  // === Helpers ===

  private expirePendingPayments(): void {
    const cutoff = new Date(Date.now() - PAYMENT_EXPIRY_MS).toISOString();
    this.db.prepare(
      `UPDATE payments SET status = 'expired' WHERE status = 'pending' AND created_at < ?`
    ).run(cutoff);
  }
}

export const store = new Store();
