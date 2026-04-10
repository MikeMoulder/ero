import { type Client, type InValue } from '@libsql/client';
import { RegisteredAPI, PaymentRequest, Task, LogEntry } from '../types';
import { sorobanService } from '../services/soroban.service';
import { getDbClient } from './db';

const MAX_LOGS = 2000;
const PAYMENT_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CONSECUTIVE_SYNC_FAILURES = 10;

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

function safeParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json); } catch { return fallback; }
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rowToApi(r: ApiRow): RegisteredAPI {
  return {
    id: r.id, name: r.name, baseUrl: r.base_url, slug: r.slug,
    price: toNumber(r.price), receiverAddress: r.receiver_address, owner: r.owner,
    status: r.status as RegisteredAPI['status'],
    callCount: toNumber(r.call_count), totalRevenue: toNumber(r.total_revenue), createdAt: r.created_at,
  };
}

function rowToPayment(r: PaymentRow): PaymentRequest {
  return {
    id: r.id, apiId: r.api_id, apiName: r.api_name, amount: toNumber(r.amount),
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
    totalSpent: toNumber(r.total_spent),
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

const TASK_JSON_FIELDS = new Set(['steps', 'agents', 'result']);

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
): { sql: string; params: InValue[] } | null {
  const cols: string[] = [];
  const params: InValue[] = [];

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
  private db!: Client;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private expiryInterval: ReturnType<typeof setInterval> | null = null;
  private consecutiveSyncFailures = 0;

  async initialize(): Promise<void> {
    this.db = getDbClient();

    await this.db.executeMultiple(`
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
      CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_public_key);
      CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_public_key);
    `);

    try {
      await this.db.execute(`ALTER TABLE payments ADD COLUMN user_public_key TEXT NOT NULL DEFAULT ''`);
      console.log('[Store] Migrated payments table: added user_public_key');
    } catch {
      // Column already exists.
    }

    try {
      await this.db.execute(`ALTER TABLE logs ADD COLUMN user_public_key TEXT NOT NULL DEFAULT ''`);
      console.log('[Store] Migrated logs table: added user_public_key');
    } catch {
      // Column already exists.
    }

    console.log('[Store] Database initialized');
  }

  close(): void {
    console.log('[Store] Database close requested');
  }

  async syncFromContract(): Promise<void> {
    if (!sorobanService.isConfigured()) return;

    try {
      const onChainApis = await sorobanService.getAllApis();

      for (const onChain of onChainApis) {
        const existing = (await this.getApi(onChain.id)) || (await this.getApiBySlug(onChain.slug));
        if (existing) {
          onChain.callCount = existing.callCount;
          onChain.totalRevenue = existing.totalRevenue;
          if (existing.id !== onChain.id) {
            await this.removeApi(existing.id);
          }
        }

        await this.db.execute({
          sql: `
            INSERT OR REPLACE INTO apis (id, name, base_url, slug, price, receiver_address, owner, status, call_count, total_revenue, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            onChain.id, onChain.name, onChain.baseUrl, onChain.slug, onChain.price,
            onChain.receiverAddress, onChain.owner, onChain.status,
            onChain.callCount, onChain.totalRevenue, onChain.createdAt,
          ],
        });
      }

      if (onChainApis.length > 0) {
        const onChainIds = new Set(onChainApis.map((a) => a.id));
        const ownedApisResult = await this.db.execute(`SELECT id FROM apis WHERE owner != ''`);
        const ownedApis = ownedApisResult.rows as unknown as Array<{ id: string }>;

        for (const { id } of ownedApis) {
          if (!onChainIds.has(id)) {
            await this.removeApi(id);
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
    void this.syncFromContract();
    this.syncInterval = setInterval(() => {
      void this.syncFromContract();
    }, intervalMs);

    if (!this.expiryInterval) {
      this.expiryInterval = setInterval(() => {
        void this.expirePendingPayments();
      }, 60000);
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

  async addApi(api: RegisteredAPI): Promise<void> {
    await this.db.execute({
      sql: `
        INSERT OR REPLACE INTO apis (id, name, base_url, slug, price, receiver_address, owner, status, call_count, total_revenue, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        api.id, api.name, api.baseUrl, api.slug, api.price,
        api.receiverAddress, api.owner, api.status,
        api.callCount, api.totalRevenue, api.createdAt,
      ],
    });
  }

  async getApi(id: string): Promise<RegisteredAPI | undefined> {
    const rs = await this.db.execute({ sql: 'SELECT * FROM apis WHERE id = ?', args: [id] });
    const row = rs.rows[0] as unknown as ApiRow | undefined;
    return row ? rowToApi(row) : undefined;
  }

  async getApiBySlug(slug: string): Promise<RegisteredAPI | undefined> {
    const rs = await this.db.execute({ sql: 'SELECT * FROM apis WHERE slug = ?', args: [slug] });
    const row = rs.rows[0] as unknown as ApiRow | undefined;
    return row ? rowToApi(row) : undefined;
  }

  async getAllApis(): Promise<RegisteredAPI[]> {
    const rs = await this.db.execute('SELECT * FROM apis');
    return (rs.rows as unknown as ApiRow[]).map(rowToApi);
  }

  async getApisByOwner(owner: string): Promise<RegisteredAPI[]> {
    const rs = await this.db.execute({ sql: 'SELECT * FROM apis WHERE owner = ?', args: [owner] });
    return (rs.rows as unknown as ApiRow[]).map(rowToApi);
  }

  async removeApi(id: string): Promise<boolean> {
    const rs = await this.db.execute({ sql: 'DELETE FROM apis WHERE id = ?', args: [id] });
    return (rs.rowsAffected || 0) > 0;
  }

  async updateApi(id: string, updates: Partial<RegisteredAPI>): Promise<boolean> {
    const clean = sanitize(updates);
    const upd = buildUpdate('apis', API_FIELD_MAP, id, clean as Record<string, any>);
    if (!upd) return false;
    const rs = await this.db.execute({ sql: upd.sql, args: upd.params });
    return (rs.rowsAffected || 0) > 0;
  }

  async addPayment(payment: PaymentRequest): Promise<void> {
    await this.db.execute({
      sql: `
        INSERT INTO payments (id, api_id, api_name, amount, destination_address, memo, status, tx_hash, caller_type, agent_id, task_id, user_public_key, created_at, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        payment.id, payment.apiId, payment.apiName, payment.amount,
        payment.destinationAddress, payment.memo, payment.status,
        payment.txHash, payment.callerType, payment.agentId, payment.taskId,
        payment.userPublicKey,
        payment.createdAt, payment.verifiedAt,
      ],
    });
  }

  async getPayment(id: string): Promise<PaymentRequest | undefined> {
    const rs = await this.db.execute({ sql: 'SELECT * FROM payments WHERE id = ?', args: [id] });
    const row = rs.rows[0] as unknown as PaymentRow | undefined;
    return row ? rowToPayment(row) : undefined;
  }

  async getAllPayments(): Promise<PaymentRequest[]> {
    const rs = await this.db.execute('SELECT * FROM payments ORDER BY created_at DESC');
    return (rs.rows as unknown as PaymentRow[]).map(rowToPayment);
  }

  async getPaymentsByUser(userPublicKey: string): Promise<PaymentRequest[]> {
    const rs = await this.db.execute({
      sql: 'SELECT * FROM payments WHERE user_public_key = ? ORDER BY created_at DESC',
      args: [userPublicKey],
    });
    return (rs.rows as unknown as PaymentRow[]).map(rowToPayment);
  }

  async updatePayment(id: string, updates: Partial<PaymentRequest>): Promise<boolean> {
    const clean = sanitize(updates);
    const upd = buildUpdate('payments', PAYMENT_FIELD_MAP, id, clean as Record<string, any>);
    if (!upd) return false;
    const rs = await this.db.execute({ sql: upd.sql, args: upd.params });
    return (rs.rowsAffected || 0) > 0;
  }

  async addTask(task: Task): Promise<void> {
    await this.db.execute({
      sql: `
        INSERT INTO tasks (id, prompt, user_public_key, status, steps, agents, total_spent, result, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        task.id, task.prompt, task.userPublicKey, task.status,
        JSON.stringify(task.steps), JSON.stringify(task.agents),
        task.totalSpent, task.result != null ? JSON.stringify(task.result) : null,
        task.createdAt, task.completedAt,
      ],
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    const rs = await this.db.execute({ sql: 'SELECT * FROM tasks WHERE id = ?', args: [id] });
    const row = rs.rows[0] as unknown as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  async getAllTasks(): Promise<Task[]> {
    const rs = await this.db.execute('SELECT * FROM tasks ORDER BY created_at DESC');
    return (rs.rows as unknown as TaskRow[]).map(rowToTask);
  }

  async getTasksByUser(userPublicKey: string): Promise<Task[]> {
    const rs = await this.db.execute({
      sql: 'SELECT * FROM tasks WHERE user_public_key = ? ORDER BY created_at DESC',
      args: [userPublicKey],
    });
    return (rs.rows as unknown as TaskRow[]).map(rowToTask);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
    const clean = sanitize(updates);
    const upd = buildUpdate('tasks', TASK_FIELD_MAP, id, clean as Record<string, any>, TASK_JSON_FIELDS);
    if (!upd) return false;
    const rs = await this.db.execute({ sql: upd.sql, args: upd.params });
    return (rs.rowsAffected || 0) > 0;
  }

  async addLog(entry: LogEntry): Promise<void> {
    await this.db.execute({
      sql: `
        INSERT INTO logs (timestamp, level, source, message, user_public_key, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        entry.timestamp, entry.level, entry.source, entry.message,
        entry.userPublicKey || '',
        entry.data != null ? JSON.stringify(entry.data) : null,
      ],
    });

    const countResult = await this.db.execute('SELECT COUNT(*) as cnt FROM logs');
    const count = toNumber((countResult.rows[0] as any)?.cnt);
    if (count > MAX_LOGS) {
      await this.db.execute({
        sql: 'DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT ?)',
        args: [MAX_LOGS],
      });
    }
  }

  async getRecentLogs(count: number = 50): Promise<LogEntry[]> {
    const rs = await this.db.execute({
      sql: 'SELECT * FROM logs ORDER BY id DESC LIMIT ?',
      args: [count],
    });
    return (rs.rows as unknown as LogRow[]).map(rowToLog).reverse();
  }

  async getRecentLogsByUser(userPublicKey: string, count: number = 50): Promise<LogEntry[]> {
    const rs = await this.db.execute({
      sql: `
        SELECT * FROM logs
        WHERE user_public_key = ?
        ORDER BY id DESC
        LIMIT ?
      `,
      args: [userPublicKey, count],
    });
    return (rs.rows as unknown as LogRow[]).map(rowToLog).reverse();
  }

  private async expirePendingPayments(): Promise<void> {
    const cutoff = new Date(Date.now() - PAYMENT_EXPIRY_MS).toISOString();
    await this.db.execute({
      sql: "UPDATE payments SET status = 'expired' WHERE status = 'pending' AND created_at < ?",
      args: [cutoff],
    });
  }
}

export const store = new Store();
