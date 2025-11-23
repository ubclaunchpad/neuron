import * as React from 'react'

import { DevChildren } from '../DevChildren'
import {
    createSlotsContext,
    getComponentName,
    hoistStatics,
    useIsomorphicEffect,
} from '../utils'
import { ScanContext, ScanProvider } from './ScanContext'
import { createSlotsManager } from './SlotsManager'
import type { SlotElement } from './utils'

export * from './utils'

type Slots = ReturnType<typeof createSlotsManager>
type Callback = (slots: SlotElement[]) => React.ReactElement | null

const SlotsContext = createSlotsContext<Slots | undefined>(undefined)

const Template = ({ children }: { children: () => ReturnType<Callback> }) => {
  return children()
}

const createIdGenerator = (prefix: string) => {
  let id = 0
  return () => `${prefix}_${id++}`
}

const genSlotId = createIdGenerator('s')

export const HostSlots = ({
  children,
  callback,
}: {
  children: React.ReactNode
  callback: Callback
}) => {
  const forceUpdate = React.useReducer(() => [], [])[1]
  const Slots = React.useMemo(
    () => createSlotsManager(forceUpdate),
    [forceUpdate]
  )

  return (
    <>
      <SlotsContext.Provider value={Slots}>
        <ScanProvider>
          {process.env.NODE_ENV === 'production' ? (
            children
          ) : (
            <DevChildren name="HostSlots" forceUpdate={forceUpdate}>
              {children}
            </DevChildren>
          )}
        </ScanProvider>
      </SlotsContext.Provider>
      <Template>{() => callback(Slots.get())}</Template>
    </>
  )
}

export const createHost = (children: React.ReactNode, callback: Callback) => {
  return <HostSlots callback={callback}>
    {children}
  </HostSlots>
}

export const createSlot = <T extends React.ElementType>(Fallback?: T) => {
  const genId = createIdGenerator(genSlotId())

  // eslint-disable-next-line react/display-name
  const Slot = React.forwardRef(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ $slot_key$: key, ...props }: any, ref: any) => {
      const Slots = React.useContext(SlotsContext)
      // istanbul ignore next
      if (!Slots) return null
      /* eslint-disable react-hooks/rules-of-hooks */
      const Scan = React.useContext(ScanContext)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const element = <SlotWithKey key={key} ref={ref} {...props} />
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Slots.register(key, element)
      React.useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unsafe-argument
        Slots.has(key) && Slots.update(key, element)
      })
      useIsomorphicEffect(() => {
        Slots.clear()
        Scan.rescan()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return () => Slots.unmount(key)
      }, [Slots])
      /* eslint-enable react-hooks/rules-of-hooks */

      return null
    }
  ) as unknown as T

  // provide stable key in StrictMode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ForwardRef = (props: any, ref: any) => {
    const Slots = React.useContext(SlotsContext)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (!Slots) return Fallback ? <Fallback ref={ref} {...props} /> : null

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [key] = React.useState(genId)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return <Slot ref={ref} $slot_key$={key} {...props} />
  }
  ForwardRef.displayName = Fallback
    ? `Slot(${getComponentName(Fallback)})`
    : 'Slot'
  const SlotWithKey = React.forwardRef(ForwardRef) as unknown as T

  return Fallback ? hoistStatics(SlotWithKey, Fallback) : SlotWithKey
}