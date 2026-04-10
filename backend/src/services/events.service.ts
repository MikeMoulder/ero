import WebSocket from 'ws';
import { WSEvent, LogEntry } from '../types';
import { store } from '../store/memory.store';

const HEARTBEAT_INTERVAL = 30000;

class EventsService {
  private clients: Set<WebSocket> = new Set();
  private aliveMap: WeakMap<WebSocket, boolean> = new WeakMap();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    this.aliveMap.set(ws, true);

    ws.on('pong', () => {
      this.aliveMap.set(ws, true);
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', () => {
      this.clients.delete(ws);
      try { ws.terminate(); } catch {}
    });

    // Start heartbeat on first client
    if (!this.heartbeatTimer) {
      this.startHeartbeat();
    }
  }

  broadcast(event: WSEvent): void {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  log(level: LogEntry['level'], source: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data,
    };
    store.addLog(entry);
    this.broadcast({ type: 'log', payload: entry });
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const client of this.clients) {
        if (!this.aliveMap.get(client)) {
          this.clients.delete(client);
          try { client.terminate(); } catch {}
          continue;
        }
        this.aliveMap.set(client, false);
        try { client.ping(); } catch {}
      }

      // Stop heartbeat if no clients
      if (this.clients.size === 0) {
        this.stopHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);
  }
}

export const events = new EventsService();
