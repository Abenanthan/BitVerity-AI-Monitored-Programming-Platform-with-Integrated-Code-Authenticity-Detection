import { useEffect, useRef } from 'react';

export const useBehaviorMonitor = () => {
  const events = useRef([]);

  useEffect(() => {
    // Tab switch detection
    const onVisibility = () => {
      if (document.hidden) {
        events.current.push({
          type: "tab_switch",
          time: Date.now(),
          direction: "away"
        });
      } else {
        events.current.push({
          type: "tab_switch",
          time: Date.now(),
          direction: "return"
        });
      }
    };

    // Window blur (other app opened)
    const onBlur = () => events.current.push({
      type: "window_blur", time: Date.now()
    });

    // Paste detection
    const onPaste = (e) => {
      events.current.push({
        type: "paste_event",
        time: Date.now(),
        charCount: e.clipboardData ? e.clipboardData.getData("text").length : 0
      });
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste);
    };
  }, []);

  return events.current;
};
