import { useEffect, useRef, useCallback } from 'react';
import { WSEvent } from '../types';

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;

export function useWebSocket(onEvent: (event: WSEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const retriesRef = useRef(0);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const wsBase = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    const ws = new WebSocket(`${wsBase}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WSEvent;
        onEventRef.current(parsed);
      } catch {}
    };

    ws.onclose = () => {
      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, retriesRef.current),
        MAX_RECONNECT_DELAY
      );
      retriesRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
