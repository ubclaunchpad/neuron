import { useEffect, useState } from "react";

/**
 * Creates a debounced state value that updates after a specified delay
 * @template T
 * @param {T} initialValue - The initial value of the state
 * @param {number} delayMs - The delay in milliseconds before the debounced value updates
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, T]} A tuple containing [currentValue, setValue, debouncedValue]
 */
export function useDebouncedState(initialValue, delayMs) {
    const [value, setValue] = useState(initialValue);
    const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);
    
        return () => clearTimeout(timer);
    }, [value, delayMs]);
  
    return [value, setValue, debouncedValue];
}