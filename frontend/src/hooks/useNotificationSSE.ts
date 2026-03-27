import { useEffect, useRef, useCallback } from 'react';
import { SSE_SUBSCRIBE_URL } from '../api/notification';

export interface SseNotificationEvent {
  notificationId: number;
  category: string;
  content: string;
  unreadCount: number;
}

interface UseNotificationSSEOptions {
  enabled: boolean;
  onNotification: (event: SseNotificationEvent) => void;
}

const RECONNECT_DELAY = 3000;

const useNotificationSSE = ({ enabled, onNotification }: UseNotificationSSEOptions) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onNotificationRef = useRef(onNotification);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);

  onNotificationRef.current = onNotification;
  enabledRef.current = enabled;

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();

    if (!enabledRef.current) return;

    const es = new EventSource(SSE_SUBSCRIBE_URL, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener('connect', () => {
      console.debug('[SSE] 연결 성공');
    });

    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const data: SseNotificationEvent = JSON.parse(e.data);
        onNotificationRef.current(data);
      } catch {
        // 파싱 실패 무시
      }
    });

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      // 재연결
      reconnectTimerRef.current = setTimeout(() => {
        if (enabledRef.current) connect();
      }, RECONNECT_DELAY);
    };
  }, [cleanup]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    connect();

    return cleanup;
  }, [enabled, connect, cleanup]);
};

export default useNotificationSSE;
