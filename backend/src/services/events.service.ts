import WebSocket from 'ws';
import { WSEvent, LogEntry } from '../types';
import { store } from '../store/memory.store';

const HEARTBEAT_INTERVAL = 30000;

class EventsService {
  private userClients: Map<string, Set<WebSocket>> = new Map();
  private anonymousClients: Set<WebSocket> = new Set();
  private aliveMap: WeakMap<WebSocket, boolean> = new WeakMap();
  private wsUserMap: WeakMap<WebSocket, string> = new WeakMap();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  addClient(ws: WebSocket, userPublicKey?: string): void {
    if (userPublicKey) {
      this.wsUserMap.set(ws, userPublicKey);
      let set = this.userClients.get(userPublicKey);
      if (!set) {
        set = new Set();
        this.userClients.set(userPublicKey, set);
      }
      set.add(ws);
    } else {
      this.anonymousClients.add(ws);
    }

    this.aliveMap.set(ws, true);

    ws.on('pong', () => {
      this.aliveMap.set(ws, true);
    });

    ws.on('close', () => {
      this.removeClient(ws);
    });

    ws.on('error', () => {
      this.removeClient(ws);
      try { ws.terminate(); } catch {}
    });

    // Start heartbeat on first client
    if (!this.heartbeatTimer) {
      this.startHeartbeat();
    }
  }

  private removeClient(ws: WebSocket): void {
    const userId = this.wsUserMap.get(ws);
    if (userId) {
      const set = this.userClients.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) this.userClients.delete(userId);
      }
    } else {
      this.anonymousClients.delete(ws);
    }
  }

  /** Send to a specific user's WebSocket connections only */
  sendToUser(userPublicKey: string, event: WSEvent): void {
    const data = JSON.stringify(event);
    const set = this.userClients.get(userPublicKey);
    if (!set) return;
    for (const client of set) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /** Broadcast to ALL connected clients (use for system-wide events like logs) */
  broadcast(event: WSEvent): void {
    const data = JSON.stringify(event);
    for (const [, set] of this.userClients) {
      for (const client of set) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    }
    for (const client of this.anonymousClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /** Broadcast only to anonymous clients (no userPublicKey bound) */
  private broadcastAnonymous(event: WSEvent): void {
    const data = JSON.stringify(event);
    for (const client of this.anonymousClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  log(level: LogEntry['level'], source: string, message: string, data?: any, userPublicKey?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      ...(userPublicKey ? { userPublicKey } : {}),
      data,
    };
    store.addLog(entry);

    // Authenticated clients only receive logs scoped to their own public key.
    if (userPublicKey) {
      this.sendToUser(userPublicKey, { type: 'log', payload: entry });
      return;
    }

    // System/global logs are limited to anonymous clients.
    this.broadcastAnonymous({ type: 'log', payload: entry });
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private get allClients(): WebSocket[] {
    const all: WebSocket[] = [];
    for (const [, set] of this.userClients) {
      for (const client of set) all.push(client);
    }
    for (const client of this.anonymousClients) all.push(client);
    return all;
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const client of this.allClients) {
        if (!this.aliveMap.get(client)) {
          this.removeClient(client);
          try { client.terminate(); } catch {}
          continue;
        }
        this.aliveMap.set(client, false);
        try { client.ping(); } catch {}
      }

      // Stop heartbeat if no clients
      if (this.userClients.size === 0 && this.anonymousClients.size === 0) {
        this.stopHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);
  }
}

export const events = new EventsService();
