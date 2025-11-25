import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, delay: number): [T, boolean, (value: T) => void] {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If they're already the same, no need to debounce.
    if (debounced === value) return;

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebounced(value);
      timeoutRef.current = null;
    }, delay);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, debounced]);

  const set = useCallback(
    (nextValue?: T) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Snap the debounced value to whatever we want *now*
      setDebounced(nextValue !== undefined ? nextValue : value);
    },
    [value],
  );

  const isDebouncing = debounced !== value;

  return [debounced, isDebouncing, set];
}