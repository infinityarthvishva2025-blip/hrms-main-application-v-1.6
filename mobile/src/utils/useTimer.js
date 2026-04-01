/**
 * useTimer.js
 * ─────────────────────────────────────────────────────────
 * Custom hook for managing a shift timer.
 *
 * Provides:
 *  • Countdown (remaining seconds until shift end)
 *  • Elapsed  (seconds since check-in)
 *
 * Handles interval creation, cleanup, and stale closure
 * avoidance via refs. Fires onComplete only once.
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * @param {Date|null} startTime  - when the shift started (check-in time)
 * @param {Date|null} endTime    - when the timer should reach zero (shift end)
 * @param {function(number)} onTick     - callback receiving remaining seconds
 * @param {function} onComplete  - called when countdown reaches zero
 */
export const useTimer = (startTime, endTime, onTick, onComplete) => {
  const timerRef = useRef(null);
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false); // Ensures onComplete fires only once
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Keep callbacks fresh without re-creating the interval
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer(); // always clear previous
    completedRef.current = false; // reset completion flag for new timer

    if (!endTime) return;

    const update = () => {
      const now = Date.now();

      // Countdown: remaining seconds
      const remaining = Math.max(0, Math.floor((endTime.getTime() - now) / 1000));
      onTickRef.current?.(remaining);

      // Elapsed: seconds since check-in
      if (startTime) {
        const elapsed = Math.max(0, Math.floor((now - startTime.getTime()) / 1000));
        setElapsedSeconds(elapsed);
      }

      if (remaining <= 0 && !completedRef.current) {
        // Shift time is over — fire onComplete only once
        completedRef.current = true;
        onCompleteRef.current?.();
        // Don't stop the timer — keep tracking elapsed time
      }
    };

    // Immediate first tick
    update();
    // Then every second
    timerRef.current = setInterval(update, 1000);
  }, [startTime, endTime, stopTimer]);

  // Auto-start when endTime changes
  useEffect(() => {
    if (endTime) {
      startTimer();
    } else {
      stopTimer();
      setElapsedSeconds(0);
    }
    return stopTimer;
  }, [endTime, startTimer, stopTimer]);

  return { stopTimer, elapsedSeconds };
};