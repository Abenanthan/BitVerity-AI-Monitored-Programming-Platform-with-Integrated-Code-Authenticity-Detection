import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(onEvent) {
  const socketRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('codeverify_token');
    if (!token) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);

      // Decode JWT to extract userId to join personal room
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          socket.emit('join:user', { userId: payload.sub });
        }
      } catch (e) {
        console.error('Failed to parse JWT for socket', e);
      }
    });

    // Listen for the real backend event names
    socket.on('submission:verdict', (data) => {
      if (onEventRef.current) onEventRef.current({ type: 'submission_verdict', data });
    });

    socket.on('submission:detection', (data) => {
      if (onEventRef.current) onEventRef.current({ type: 'detection_update', data });
    });

    socket.on('contest:leaderboard:update', (data) => {
      if (onEventRef.current) onEventRef.current({ type: 'leaderboard_update', data });
    });

    socket.on('disconnect', () => console.log('Socket disconnected'));

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinContest = useCallback((contestId) => {
    if (socketRef.current && contestId) {
      socketRef.current.emit('join:contest', { contestId });
    }
  }, []);

  return { socket: socketRef.current, joinContest };
}
