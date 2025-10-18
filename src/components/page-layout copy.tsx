"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/primitives/button";
import { createHost, createSlot } from "@/lib/slots";
import { cn } from "@/lib/utils";
import CaretLeftIcon from "@public/assets/icons/caret-left.svg";
import { SidebarTrigger } from "./primitives/sidebar";
import { TypographyPageTitle } from "./primitives/typography";

type PageTitleProps = {
  children?: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  className?: string;
};

const TitleSlots = {
  LeftContent: createSlot(),
  RightContent: createSlot(),
};

type PageTitleCompound = React.FC<PageTitleProps> & {
  LeftContent: typeof TitleSlots.LeftContent;
  RightContent: typeof TitleSlots.RightContent;
};

export const PageTitle: PageTitleCompound = ({
  children,
  title,
  showBackButton = false,
  className,
}) => {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 pt-5 pb-7 px-9 md:px-6 sm:px-4",
        "bg-background text-foreground",
        className
      )}
    >
      {createHost(children, (Slots) => {
        const leftContent = Slots.get(TitleSlots.LeftContent);
        const rightContent = Slots.get(TitleSlots.RightContent);

        return (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <SidebarTrigger className="size-8 -mx-1" />

              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mx-1"
                  onClick={() => router.back()}
                  aria-label="Go back"
                >
                  <CaretLeftIcon className="size-4" />
                </Button>
              )}

              <TypographyPageTitle>
                {title}
              </TypographyPageTitle>

              {leftContent}
            </div>

            <div className="flex items-start gap-2 shrink-0">{rightContent}</div>
          </>
        );
      })}
    </div>
  );
};

PageTitle.LeftContent = TitleSlots.LeftContent;
PageTitle.RightContent = TitleSlots.RightContent;

type PageLayoutProps = {
  children?: React.ReactNode;
  sidebarWidth?: string;
  mainMinWidth?: string;
  contentRef?: React.Ref<HTMLDivElement>;
  className?: string;
};

const LayoutSlots = {
  Header: createSlot(),
  Sidebar: createSlot(),
};

type PageLayoutCompound = React.FC<PageLayoutProps> & {
  Header: typeof LayoutSlots.Header;
  Sidebar: typeof LayoutSlots.Sidebar;
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
  sidebarWidth = "448px",
  mainMinWidth = "412px",
  contentRef,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleSidebar = React.useCallback(() => {
    console.log(isOpen)
    setIsOpen((v) => !v);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      {createHost(children, (Slots) => {
        const header = Slots.get(LayoutSlots.Header);
        const sidebar = Slots.get(LayoutSlots.Sidebar);
        const restChildren = Slots.getRest();

        // CSS custom properties (scoped to the layout root)
        const styleVars = {
          ["--sidebar-w" as any]: sidebarWidth,
          ["--main-min" as any]: mainMinWidth,
          ["--main-offset" as any]: sidebar ? (isOpen ? `var(--sidebar-w)` : "0px") : "0px",
        } as React.CSSProperties;

        const state = isOpen && sidebar ? "open" : "closed";

        return (
          <div
            data-state={state}
            style={styleVars}
            className={cn(
              "relative flex min-h-dvh flex-col bg-background",
              "transition-[margin-right] duration-200",
              "mr-[var(--main-offset)]",
              className
            )}
          >
            {/* Header */}
            {header && (
              <header className="bg-background border-b">
                <div className="mx-auto w-full">{header}</div>
              </header>
            )}

            {/* Main content area */}
            <main
              ref={contentRef}
              className={cn(
                "h-full min-h-0 overflow-y-auto",
                "[scrollbar-gutter:stable_both-edges] [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain] [touch-action:pan-y] [scroll-behavior:smooth]",
                "transition-[padding-right] duration-200"
              )}
            >
              <div className="min-w-[var(--main-min)]">{restChildren}</div>
            </main>

            {/* Sidebar */}
            {sidebar && (
              <aside
                role="complementary"
                aria-hidden={!isOpen}
                aria-label="Page sidebar"
                data-state={state}
                style={{ width: `min(var(--sidebar-w), 100dvw)` }}
                className={cn(
                  "fixed right-0 top-0 z-40 h-dvh border-l bg-background shadow-lg",
                  "translate-x-full data-[state=open]:translate-x-0 transition-transform duration-200 will-change-transform"
                )}
              >
                <div className="flex h-full flex-col">
                  <div className="min-h-0 flex-1 overflow-auto">{sidebar}</div>
                </div>
              </aside>
            )}
          </div>
        );
      })}
    </SidebarContext.Provider>
  );
};

PageLayout.Header = LayoutSlots.Header;
PageLayout.Sidebar = LayoutSlots.Sidebar;
