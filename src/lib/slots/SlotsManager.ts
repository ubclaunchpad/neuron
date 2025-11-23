import type * as React from 'react';

type Slot = React.ElementType

export const createSlotsManager = (onChange: (slot: Slot) => void) => {
  const elementMap = new Map<Slot, React.ReactElement>();
  let rest: React.ReactNode[] = [];

  return {
    register(slot: Slot, element: React.ReactElement) {
      elementMap.set(slot, element)
    },
    update(slot: Slot, element: React.ReactElement) {
      elementMap.set(slot, element)
      onChange(slot)
    },
    unmount(slot: Slot) {
      elementMap.delete(slot)
      onChange(slot)
    },
    get<T extends Slot>(slot: T) {
      return elementMap.get(slot) as
        | React.ReactElement<React.ComponentProps<T>, T>
        | undefined;
    },
    getProps<T extends Slot>(slot: T) {
      const element = elementMap.get(slot)
      if (!element) 
        return undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const { ref, props } = element as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
      return (ref ? { ...props, ref } : props) as React.ComponentProps<T>;
    },
    getRest() {
      return rest;
    },
    setRest(elements: React.ReactNode[]) {
      rest = elements;
    }
  }
}