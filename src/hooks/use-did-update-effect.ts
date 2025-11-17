import { useEffect, useRef, type DependencyList, type EffectCallback } from "react";

/**
 * Runs an effect only when the dependencies update, but not on the initial render.
 *
 * This hook is useful for running side effects in response to state or prop changes,
 * but skipping the effect the first time a component renders. This is unlike `useEffect`,
 * which runs after both the initial mount and subsequent updates.
 *
 * This implementation works even with React 18's Strict Mode, where effects (and cleanups)
 * are sometimes double-invoked for development to help uncover unsafe side effects.
 * The internal ref logic ensures the effect callback is never called on the initial render,
 * regardless of how many times React mounts/unmounts the component in development or production.
 *
 * Inspired by:
 * https://stackoverflow.com/questions/53179075/with-useeffect-how-can-i-skip-applying-an-effect-upon-the-initial-render
 *
 * @param fn The effect callback to run after updates (never on initial mount)
 * @param inputs Dependency list like in useEffect
 */
export function useDidUpdateEffect(fn: EffectCallback, inputs: DependencyList) {
    const isMountingRef = useRef(false);
  
    useEffect(() => {
        isMountingRef.current = true;
    }, []);
  
    useEffect(() => {
        if (!isMountingRef.current) {
            return fn();
        } else {
            isMountingRef.current = false;
        }
    }, inputs);
}