import { createHost, createSlot } from "@/lib/slots";
import clsx from "clsx";
import React, { useCallback } from "react";
import "./index.scss";

type PageLayoutProps = {
  children?: React.ReactNode;
  sidebarWidth?: number;
  mainMinWidth?: number;
  contentRef?: React.Ref<HTMLDivElement>; 
};

const SlotDefs = {
  Header: createSlot(),
  Sidebar: createSlot(),
};

type PageLayoutCompound = React.FC<PageLayoutProps> & {
  Header: typeof SlotDefs.Header;
  Sidebar: typeof SlotDefs.Sidebar;
};

const SidebarContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
} | null>(null);

export const useSidebar = () => {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <PageLayout>");
  return ctx;
};

export const PageLayout: PageLayoutCompound = ({
  children,
  sidebarWidth = 448,
  mainMinWidth = 412,
  contentRef,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleSidebar = useCallback(() => setIsOpen(!isOpen), [setIsOpen]);

  const vars: React.CSSProperties = {
    ["--sidebar-w" as any]: `${sidebarWidth}px`,
    ["--main-min" as any]: `${mainMinWidth}px`,
  };

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      {createHost(children, (Slots) => {
        const header = Slots.get(SlotDefs.Header);
        const sidebar = Slots.get(SlotDefs.Sidebar);
        const children = Slots.getRest();

        return (<>
          <div className={clsx("page-layout", { "is-open": isOpen && sidebar })} style={vars}>
            {/* Main area */}
            { header && <header className="page-layout-header">{header}</header>}
      
            <main ref={contentRef} className="page-layout-content">
              <div className="inner-content">{children}</div>
            </main>
      
            {/* Sidebar */}
            { sidebar && <aside className="page-layout-sidebar" aria-hidden={!isOpen} >
              <div className="sidebar-content">
                {sidebar}
              </div>
            </aside>}
          </div>
        </>)
      })}
    </SidebarContext.Provider>
  );
};

PageLayout.Header = SlotDefs.Header;
PageLayout.Sidebar = SlotDefs.Sidebar;
