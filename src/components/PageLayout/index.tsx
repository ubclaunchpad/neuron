import { createHost, createSlot } from "@/lib/slots";
import clsx from "clsx";
import * as React from "react";
import "./index.scss";

type PageLayoutProps = {
  children?: React.ReactNode;
  sidebarOpen?: boolean;
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

export const PageLayout: PageLayoutCompound = ({
  children,
  sidebarOpen: open = false,
  sidebarWidth = 384,
  mainMinWidth = 360,
  contentRef,
}) => {
  const vars: React.CSSProperties = {
    ["--sidebar-w" as any]: `${sidebarWidth}px`,
    ["--main-min" as any]: `${mainMinWidth}px`,
  };

  return (
    <div className={clsx("page-layout", { "is-open": open })} style={vars}>
      {createHost(children, (Slots) => {
        const header = Slots.get(SlotDefs.Header);
        const sidebar = Slots.get(SlotDefs.Sidebar);
        const children = Slots.getRest();

        return (<>
          {/* Main area */}
          { header && <header className="page-layout-header">{header}</header>}
    
          <main ref={contentRef} className="page-layout-content">
            <div className="inner-content">{children}</div>
          </main>
    
          {/* Sidebar */}
          { sidebar && <aside className="page-layout-sidebar" aria-hidden={!open} >
            <div className="sidebar-content">
              {sidebar}
            </div>
          </aside>}
        </>)
      })}
    </div>
  );
};

PageLayout.Header = SlotDefs.Header;
PageLayout.Sidebar = SlotDefs.Sidebar;