import * as React from 'react'

import { DevChildren } from './DevChildren'
import { createSlotsManager } from './SlotsManager'
import { createSlotsContext, getComponentName, hoistStatics, SLOT_MARK, splitChildrenTopLevel } from './utils'

type Slots = ReturnType<typeof createSlotsManager>
type Callback = (Slots: Slots) => React.ReactElement | null

const SlotsContext = createSlotsContext<Slots | undefined>(undefined)

const Template = ({ children }: { children: () => ReturnType<Callback> }) => {
  return children();
}

export const HostSlots = ({
  children,
  callback,
}: {
  children: React.ReactNode
  callback: Callback
}) => {
  const forceUpdate = React.useReducer(() => [], [])[1];
  const Slots = React.useMemo(
    () => createSlotsManager(forceUpdate),
    [forceUpdate]
  );

  // Keep track of the rest of the children
  const { slotChildren, rest } = splitChildrenTopLevel(children);
  Slots.setRest(rest);

  return (
    <>
      <SlotsContext.Provider value={Slots}>
        {process.env.NODE_ENV === 'production' ? (
          slotChildren
        ) : (
          <DevChildren name="HostSlots" forceUpdate={forceUpdate}>
            {slotChildren}
          </DevChildren>
        )}
      </SlotsContext.Provider>
      <Template>{() => callback(Slots)}</Template>
    </>
  )
}

export const createHost = (children: React.ReactNode, callback: Callback) => {
  return <HostSlots children={children} callback={callback} />
}

export const createSlot = <T extends React.ElementType>(Fallback?: T) => {
  const ForwardRef = (props: any, ref: any) => {
    const Slots = React.useContext(SlotsContext)
    if (!Slots) 
      return Fallback
        ? <Fallback ref={ref} {...props} /> 
        : <React.Fragment key={props.key} children={props.children} />;

    const element = <Slot ref={ref} {...props} />
    /* eslint-disable react-hooks/rules-of-hooks */
    React.useState(() => Slots.register(Slot, element))
    React.useEffect(() => Slots.update(Slot, element))
    React.useEffect(() => () => Slots.unmount(Slot), [Slots])
    /* eslint-enable react-hooks/rules-of-hooks */

    return null
  }
  ForwardRef.displayName = Fallback
    ? `Slot(${getComponentName(Fallback)})`
    : 'Slot';
  const Slot = React.forwardRef(ForwardRef) as unknown as T;
  (Slot as any)[SLOT_MARK] = true;

  return Fallback ? hoistStatics(Slot, Fallback) : Slot;
}