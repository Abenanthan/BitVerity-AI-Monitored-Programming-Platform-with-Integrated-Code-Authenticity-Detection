import { useEffect, useRef } from 'react';

// Mock Socket.io hook — only connects on contest pages
export function useSocket(contestId, onEvent) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!contestId) return;

    // In a real app: socketRef.current = io('wss://your-server.com', { query: { contestId } });
    // For the demo, we simulate events
    const mockEvents = [
      { type: 'leaderboard_update', data: { rank: 12 } },
      { type: 'contest_announcement', data: { message: 'Problem 2 has been updated' } },
    ];

    let idx = 0;
    const id = setInterval(() => {
      if (idx < mockEvents.length && onEvent) {
        onEvent(mockEvents[idx]);
        idx++;
      }
    }, 15000);

    return () => {
      clearInterval(id);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [contestId, onEvent]);

  return socketRef.current;
}
