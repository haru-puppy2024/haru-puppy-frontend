import { EventSourcePolyfill as EventSource } from 'event-source-polyfill';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import { useCookies } from 'react-cookie';
import { INotification } from '@/app/_types/noti/Noti';
import { eventSourceEnabledState, notificationsState } from '@/app/_states/notiState';

const EVENT_SOURCE_ENABLED_KEY = 'eventSourceEnabled';

const createEventSource = (accessToken: string) => {
  return new EventSource(
    'https://port-0-haru-puppy-backend-1cupyg2klv9dkg9z.sel5.cloudtype.app/api/subscribe',
    {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      heartbeatTimeout: 45000,
    },
  );
};

export const useEventSource = () => {
  const queryClient = useQueryClient();
  const [isEnabled, setIsEnabled] = useRecoilState(eventSourceEnabledState);
  const setNotifications = useSetRecoilState(notificationsState);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [cookies] = useCookies(['access_token']);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(EVENT_SOURCE_ENABLED_KEY);
      setIsEnabled(storedValue === 'true');
    }
  }, [setIsEnabled]);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const createAndConnectEventSource = useCallback(() => {
    if (!cookies.access_token) {
      return;
    }

    closeEventSource();

    const eventSource = createEventSource(cookies.access_token);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('EventSource connection opened successfully');
    };

    (eventSource as any).addEventListener('sse', (event: MessageEvent) => {
      //   console.log('Raw SSE event:', event);
      console.log('Raw message data:', event.data);
      if (event.data) {
        try {
          const jsonStr = event.data.replace(/^data:/, '').trim();
          const data: INotification = JSON.parse(jsonStr);
          setNotifications((prev) => [...prev, data]);

          console.log('Parsed SSE data:', data);
          queryClient.invalidateQueries('getAllNotifications');

          setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== data.id));
          }, 5000);
        } catch (error) {
          console.warn('Failed to parse SSE data:', event.data);
        }
      }
    });

    eventSource.onerror = (error) => {
      console.error('EventSource 45000ms 내에 연결 없어서 에러 후 연결 재시도', error);
    };
  }, [cookies.access_token, closeEventSource, setNotifications]);

  useEffect(() => {
    if (isEnabled && cookies.access_token) {
      createAndConnectEventSource();
    } else if (!isEnabled) {
      //   console.log('isEnabled is false, calling closeEventSource');
      closeEventSource();
    } else {
      //   console.log('Conditions not met for createAndConnectEventSource');
    }
  }, [isEnabled, cookies.access_token, createAndConnectEventSource, closeEventSource]);

  const toggleEventSource = useCallback(() => {
    setIsEnabled((prev) => {
      const newState = !prev;
      localStorage.setItem(EVENT_SOURCE_ENABLED_KEY, newState.toString());
      console.log('EventSource toggled:', newState);

      if (newState) {
        setTimeout(() => createAndConnectEventSource(), 0);
      } else {
        closeEventSource();
      }

      return newState;
    });
  }, [createAndConnectEventSource, closeEventSource, setIsEnabled]);

  return { isEnabled, toggleEventSource };
};
