import type { JSXElementConstructor } from 'react';
import * as React from 'react';

export const SLOT_MARK = Symbol.for('create-slots.slot')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSlotType = (type: string | JSXElementConstructor<any>): boolean => !!(type && (type as unknown as Record<symbol, unknown>)[SLOT_MARK])

export function splitChildrenTopLevel(children: React.ReactNode) {
  const rest: React.ReactNode[] = [];
  const slotChildren: React.ReactElement[] = [];  

  for (const child of React.Children.toArray(children)) {
    if (React.isValidElement(child) && isSlotType(child.type)) {
      slotChildren.push(child);
    } else {
      rest.push(child);
    }
  }
  
  return { rest, slotChildren };
}

export const useIsomorphicEffect =
  // istanbul ignore next
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

export const createSlotsContext = <T>(defaultValue: T) => {
  const context = React.createContext(defaultValue)
  context.displayName = 'SlotsContext'
  return context
}

export const getComponentName = (Component: React.ElementType) => {
  if (typeof Component === 'string') return Component
  // istanbul ignore next
  return Component.displayName ?? Component.name ?? 'Component'
}

const REACT_STATICS = ['$$typeof', 'render', 'displayName', 'defaultProps']

export const hoistStatics = <T extends React.ElementType>(
  target: T,
  source: T
) => {
  if (typeof source === 'string') return target

  const statics = Object.getOwnPropertyNames(source).reduce((obj, key) => {
    if (!REACT_STATICS.includes(key)) {
      obj[key] = (source as unknown as Record<string, unknown>)[key]
    }
    return obj
  }, {} as Record<string, unknown>)

  return Object.assign(target, statics)
}