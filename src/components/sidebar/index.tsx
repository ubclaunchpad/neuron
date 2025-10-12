"use client";

import { createHost, createSlot } from "@/lib/slots";
import CloseIcon from "@public/assets/icons/close.svg";
import clsx from "clsx";
import { useCallback } from "react";
import { useSidebar } from "../PageLayout";
import { Button } from "../primitives/button";
import "./index.scss";

export const SidebarSection = ({ 
  children
} : {
  children: React.ReactNode;
}) => {
  return <div className="sidebar-section">
    {children}
  </div>;
};

export const SidebarField = ({ 
  label,
  inline = true,
  children
} : {
  label?: React.ReactNode;
  inline?: boolean;
  children: React.ReactNode;
}) => {
  return <div className={clsx("sidebar-field", inline && "inline")}>
    {label && <span className="sidebar-field__label">{label}</span>}
    <span className="sidebar-field__content">{children}</span>
  </div>;
};

type SidebarContainerProps = {
  children?: React.ReactNode;
};

const SlotDefs = {
  Header: createSlot(),
  Body: createSlot(),
  Footer: createSlot(),
};

type SidebarContainerCompound = React.FC<SidebarContainerProps> & {
  Header: typeof SlotDefs.Header;
  Body: typeof SlotDefs.Body;
  Footer: typeof SlotDefs.Footer;
};

export const SidebarContainer: SidebarContainerCompound = ({
  children
}: SidebarContainerProps) => {
  const { setIsOpen } = useSidebar();
  const closeSidebar = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <div className="sidebar-container">
      {createHost(children, (Slots) => {
        const header = Slots.get(SlotDefs.Header);
        const footer = Slots.get(SlotDefs.Footer);
        const body = Slots.get(SlotDefs.Body);

        return (<>
          <div className="sidebar-container__header">
            <div className="sidebar-container__header-title">
              {header}
            </div>

            <Button 
              className="sidebar-container__header-close small ghost icon-only"
              onPress={closeSidebar}
            >
              <CloseIcon />
            </Button>
          </div>

          <div className="sidebar-container__body">
            {body}
          </div>

          <div className="sidebar-container__footer">
            {footer}
          </div>
        </>)
      })}
    </div>
  );
};

SidebarContainer.Header = SlotDefs.Header;
SidebarContainer.Footer = SlotDefs.Footer;
SidebarContainer.Body = SlotDefs.Body;
