import { useEffect } from 'react';
import { useBehaviorMonitor } from '../hooks/useBehaviorMonitor';

// Invisible component that monitors behavior — exposes events via onUpdate callback
export default function BehaviorMonitor({ onUpdate }) {
  const { events, hasWarning, registerPaste } = useBehaviorMonitor();

  useEffect(() => {
    if (onUpdate) onUpdate({ events, hasWarning, registerPaste });
  }, [events, hasWarning]); // eslint-disable-line

  return null; // renders nothing
}
