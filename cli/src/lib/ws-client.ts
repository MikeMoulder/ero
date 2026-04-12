import WebSocket from 'ws';
import { loadConfig } from './config-store';
import { logLine, success, accent, error } from './output';

interface WSEvent {
  type: string;
  payload: any;
}

export function connectTaskStream(
  userPublicKey: string,
  callbacks: {
    onLog?: (entry: { level: string; source: string; message: string }) => void;
    onTaskUpdate?: (task: any) => void;
    onStepUpdate?: (data: any) => void;
    onApprovalRequired?: (data: any) => void;
  }
): { close: () => void } {
  const cfg = loadConfig();
  const wsUrl = cfg.apiUrl.replace(/^http/, 'ws') + `/ws?userPublicKey=${encodeURIComponent(userPublicKey)}`;

  const ws = new WebSocket(wsUrl);

  ws.on('message', (raw) => {
    try {
      const event: WSEvent = JSON.parse(raw.toString());

      switch (event.type) {
        case 'log':
          if (callbacks.onLog) {
            callbacks.onLog(event.payload);
          } else {
            logLine(event.payload.level, event.payload.source, event.payload.message);
          }
          break;
        case 'task_update':
          callbacks.onTaskUpdate?.(event.payload);
          break;
        case 'step_update':
          callbacks.onStepUpdate?.(event.payload);
          break;
        case 'approval_required':
          callbacks.onApprovalRequired?.(event.payload);
          break;
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on('error', (err) => {
    console.error(error(`WebSocket error: ${err.message}`));
  });

  ws.on('close', () => {
    // silent close
  });

  return {
    close: () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    },
  };
}
