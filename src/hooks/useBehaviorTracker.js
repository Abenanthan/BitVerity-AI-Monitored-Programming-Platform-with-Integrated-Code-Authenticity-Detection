import { useRef, useCallback, useEffect } from 'react';

// Heuristic thresholds
const LARGE_PASTE_CHARS   = 80;   // paste > 80 chars = "large paste" (likely whole function)
const BURST_THRESHOLD_MS  = 150;  // keystrokes within 150ms of each other = burst (AI generation)
const BURST_MIN_KEYS      = 6;    // minimum keys in a burst to flag

export function useBehaviorTracker() {
  const log        = useRef([]);     // raw event log
  const keyTimes   = useRef([]);     // timestamps of recent keystrokes for burst detection
  const sessionStart = useRef(Date.now());

  const push = useCallback((type, data = {}) => {
    log.current.push({ type, t: Date.now() - sessionStart.current, abs: Date.now(), ...data });
  }, []);

  useEffect(() => {
    // ── Keystroke tracking ───────────────────────────────────────
    const onKey = (e) => {
      const now = Date.now();
      keyTimes.current.push(now);

      // Keep only last 20 timestamps
      if (keyTimes.current.length > 20) keyTimes.current.shift();

      // Detect burst typing (>= BURST_MIN_KEYS keystrokes within BURST_THRESHOLD_MS each)
      if (keyTimes.current.length >= BURST_MIN_KEYS) {
        const recent = keyTimes.current.slice(-BURST_MIN_KEYS);
        const maxGap = Math.max(...recent.slice(1).map((t, i) => t - recent[i]));
        if (maxGap < BURST_THRESHOLD_MS) {
          // Only flag this burst once per second to avoid flooding
          const lastBurst = log.current.filter(ev => ev.type === 'burst_typing').slice(-1)[0];
          if (!lastBurst || now - lastBurst.abs > 1000) {
            push('burst_typing', { keys: BURST_MIN_KEYS, maxGapMs: maxGap });
          }
        }
      }

      push('keypress', {
        isChar: e.key.length === 1,
        key: e.key.length === 1 ? 'char' : e.key,
        ctrl: e.ctrlKey || e.metaKey,
      });
    };

    // ── Paste tracking ───────────────────────────────────────────
    const onPaste = (e) => {
      const text = (e.clipboardData || window.clipboardData || {}).getData('text') || '';
      const chars = text.length;
      const lines = text.split('\n').length;
      const isLarge = chars >= LARGE_PASTE_CHARS;

      push('paste', {
        chars,
        lines,
        isLarge,
        // Classify paste type
        pasteType: chars === 0 ? 'empty'
          : chars < 20  ? 'small'
          : chars < LARGE_PASTE_CHARS ? 'medium'
          : lines > 3   ? 'full_code_block'   // multi-line large = entire solution paste
          :               'large_inline',
      });
    };

    // ── Copy tracking ────────────────────────────────────────────
    const onCopy = () => push('copy', {});

    // ── Tab / window visibility ──────────────────────────────────
    const onVisibility = () => {
      push(document.hidden ? 'tab_hidden' : 'tab_visible', {});
    };

    const onBlur  = () => push('window_blur',  {});
    const onFocus = () => push('window_focus', {});

    // ── Right-click (context menu) ───────────────────────────────
    const onContextMenu = () => push('context_menu', {});

    // ── Mouse selection (selecting large chunks before pasting) ──
    let selectionTimer = null;
    const onMouseUp = () => {
      clearTimeout(selectionTimer);
      selectionTimer = setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString().length > 50) {
          push('large_selection', { chars: sel.toString().length });
        }
      }, 100);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown',     onKey);
    window.addEventListener('paste',       onPaste);
    window.addEventListener('copy',        onCopy);
    window.addEventListener('blur',        onBlur);
    window.addEventListener('focus',       onFocus);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mouseup',     onMouseUp);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown',     onKey);
      window.removeEventListener('paste',       onPaste);
      window.removeEventListener('copy',        onCopy);
      window.removeEventListener('blur',        onBlur);
      window.removeEventListener('focus',       onFocus);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mouseup',     onMouseUp);
      clearTimeout(selectionTimer);
    };
  }, [push]);

  // ── Analytics ────────────────────────────────────────────────────
  const getLog = useCallback(() => [...log.current], []);

  const clearLog = useCallback(() => {
    log.current       = [];
    keyTimes.current  = [];
    sessionStart.current = Date.now();
  }, []);

  /**
   * Returns a structured AI suspicion analysis based on the behavior log.
   * Score 0–100: higher = more suspicious.
   */
  const getAnalysis = useCallback(() => {
    const events = log.current;
    if (events.length === 0) return { score: 0, flags: [], summary: 'No activity recorded.' };

    const pastes        = events.filter(e => e.type === 'paste');
    const largePastes   = pastes.filter(e => e.isLarge);
    const fullCodePastes = pastes.filter(e => e.pasteType === 'full_code_block');
    const bursts        = events.filter(e => e.type === 'burst_typing');
    const tabSwitches   = events.filter(e => e.type === 'tab_hidden').length;
    const windowBlurs   = events.filter(e => e.type === 'window_blur').length;
    const keypresses    = events.filter(e => e.type === 'keypress').length;
    const copies        = events.filter(e => e.type === 'copy').length;

    const flags = [];
    let score = 0;

    // Full solution paste → very suspicious
    if (fullCodePastes.length > 0) {
      score += 45;
      flags.push({ type: 'full_code_paste', severity: 'high', message: `Entire code block pasted (${fullCodePastes[0].chars} chars, ${fullCodePastes[0].lines} lines)` });
    }

    // Large paste without full code
    if (largePastes.length > 0 && fullCodePastes.length === 0) {
      score += 20;
      flags.push({ type: 'large_paste', severity: 'medium', message: `${largePastes.length} large paste(s) detected` });
    }

    // Burst typing (AI-generated text typed fast)
    if (bursts.length >= 3) {
      score += 15;
      flags.push({ type: 'burst_typing', severity: 'medium', message: `Rapid burst typing detected ${bursts.length} times` });
    }

    // Very few keypresses relative to code length → mostly pasted
    if (keypresses < 10 && fullCodePastes.length > 0) {
      score += 15;
      flags.push({ type: 'minimal_typing', severity: 'high', message: 'Solution submitted with almost no manual keystrokes' });
    }

    // Tab switches during contest
    if (tabSwitches >= 3) {
      score += 10;
      flags.push({ type: 'tab_switching', severity: 'low', message: `Switched away from tab ${tabSwitches} times` });
    } else if (tabSwitches > 0) {
      score += 4;
    }

    // Window blurs (switching to external app, e.g. ChatGPT)
    if (windowBlurs >= 2) {
      score += 8;
      flags.push({ type: 'window_switching', severity: 'low', message: `Left the browser window ${windowBlurs} times` });
    }

    // Copy events (copying from somewhere)
    if (copies >= 2) {
      score += 5;
      flags.push({ type: 'multiple_copies', severity: 'low', message: `${copies} copy event(s) recorded` });
    }

    score = Math.min(100, score);

    const summary =
      score >= 70 ? 'High likelihood of AI/external assistance.' :
      score >= 40 ? 'Moderate suspicious activity detected.' :
      score >= 15 ? 'Minor flags detected, likely human.' :
                    'Appears to be written organically.';

    return {
      score,
      flags,
      summary,
      stats: { pastes: pastes.length, largePastes: largePastes.length, fullCodePastes: fullCodePastes.length, bursts: bursts.length, keypresses, tabSwitches, windowBlurs, copies },
    };
  }, []);

  return { getLog, clearLog, getAnalysis };
}
