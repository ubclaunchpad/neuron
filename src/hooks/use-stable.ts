import { useEffect, useRef, useState } from "react";

/**
 * Keep a value stable and only update when it meaningfully changes.
 */
export const useStable = <T>(
  value: T,
  isEqual: (a: T, b: T) => boolean = defaultEquals,
) => {
  const ref = useRef(value);
  const [stable, setStable] = useState(value);
  useEffect(() => {
    if (!isEqual(ref.current, value)) {
      ref.current = value;
      setStable(value);
    }
  }, [value, isEqual]);
  return stable;
};

/**
 * Default equality function that uses strict equality.
 */
export const defaultEquals = <T>(a: T, b: T) => a === b;
