import { useState, useEffect, useRef, useCallback } from 'react';

export function useBehaviorMonitor() {
  const [events, setEvents]         = useState([]);
  const [hasWarning, setHasWarning] = useState(false);
  const startTime                   = useRef(Date.now());

  const addEvent = useCallback((type, detail = '') => {
    const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
    const mins    = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs    = (elapsed % 60).toString().padStart(2, '0');
    const entry   = { type, detail, time: `${mins}:${secs}`, ts: Date.now() };
    setEvents(prev => [...prev, entry]);
    setHasWarning(true);
  }, []);

  useEffect(() => {
    const onBlur  = () => addEvent('blur',  'Window blur');
    const onFocus = () => {};
    const onVis   = () => {
      if (document.visibilityState === 'hidden') addEvent('tab', 'Tab switch');
    };

    window.addEventListener('blur',              onBlur);
    window.addEventListener('focus',             onFocus);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('blur',              onBlur);
      window.removeEventListener('focus',             onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [addEvent]);

  // Paste detection is added to editor wrapper via onPaste prop
  const registerPaste = useCallback(() => {
    addEvent('paste', 'Paste event detected');
  }, [addEvent]);

  return { events, hasWarning, registerPaste };
}
