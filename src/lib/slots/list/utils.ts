import type * as React from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SlotElement<T extends React.ElementType = any> = React.ReactElement<
  React.ComponentPropsWithRef<T>,
  T
> & {
  ref: React.ComponentPropsWithRef<T>['ref']
}

export const getSlots = <T extends React.ElementType>(
  slots: React.ReactElement[],
  slot: T
) => {
  return slots.filter((x) => x.type === slot) as SlotElement<T>[]
}

export const getSlot = <T extends React.ElementType>(
  slots: React.ReactElement[],
  slot: T
) => {
  return slots.find((x) => x.type === slot) as SlotElement<T> | undefined
}

export const getLastSlot = <T extends React.ElementType>(
  slots: React.ReactElement[],
  slot: T
) => {
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i]!.type === slot) {
      return slots[i] as SlotElement<T>
    }
  }
  return undefined
}

export const isSlot = <T extends React.ElementType>(
  slotElement: SlotElement,
  slot: T
): slotElement is SlotElement<T> => {
  return slotElement.type === slot
}

export const getSlotProps = <
  T extends SlotElement | undefined,
  Props = T extends undefined
    ? undefined
    : React.ComponentPropsWithRef<T extends SlotElement<infer P> ? P : never>
>(
  slotElement: T
): Props => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  if (!slotElement) return undefined as any

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { key, ref, props } = slotElement;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
  return { ...props, key, ref };
}