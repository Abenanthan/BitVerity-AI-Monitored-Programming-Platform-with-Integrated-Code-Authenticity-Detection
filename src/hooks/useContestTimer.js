import { useState, useEffect } from 'react';

export function useContestTimer(endsAt) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const hours   = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formatted = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');

  const isLow    = timeLeft <= 300;  // < 5 min
  const isWarning = timeLeft <= 600; // < 10 min
  const isPulse  = timeLeft <= 60;   // < 1 min

  return { timeLeft, formatted, isLow, isWarning, isPulse, hours, minutes, seconds };
}
