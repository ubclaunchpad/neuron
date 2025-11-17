"use client";

import * as React from "react";

import { Button } from "@/components/primitives/button";
import { TypographyPageTitle } from "@/components/primitives/typography";
import { cn } from "@/lib/utils";
import CaretLeftIcon from "@public/assets/icons/caret-left.svg";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "./primitives/sidebar";

type PageLayoutContextValue = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  registerAside: () => () => void;
  hasAside: boolean;
  asideWidth: string;
  mainMinWidth: string;
  isPageScrolled: boolean;
  setIsPageScrolled: (isScrolled: boolean) => void;
};

const PageLayoutContext = React.createContext<PageLayoutContextValue | null>(
  null,
);

function usePageAside() {
  const ctx = React.useContext(PageLayoutContext);
  if (!ctx) throw new Error("usePageAside must be used within PageLayout");
  return ctx;
}

function PageLayout({
  className,
  style,
  children,
  asideWidth = "448px",
  mainMinWidth = "412px",
  defaultOpen = false,
  ...props
}: React.ComponentProps<"div"> & {
  asideWidth?: string;
  mainMinWidth?: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isPageScrolled, setIsPageScrolled] = React.useState(false);
  const [asideCount, setAsideCount] = React.useState(0);

  const registerAside = React.useCallback(() => {
    setAsideCount((c) => c + 1);
    return () => setAsideCount((c) => Math.max(0, c - 1));
  }, []);

  const hasAside = asideCount > 0;
  const toggle = React.useCallback(() => setIsOpen((v) => !v), []);

  const state = isOpen && hasAside ? "open" : "closed";

  const ctx = React.useMemo<PageLayoutContextValue>(
    () => ({
      isOpen,
      setOpen: setIsOpen,
      toggle,
      registerAside,
      hasAside,
      asideWidth: asideWidth,
      mainMinWidth,
      setIsPageScrolled,
      isPageScrolled
    }),
    [toggle, isOpen, registerAside, hasAside, asideWidth, mainMinWidth, setIsPageScrolled, isPageScrolled],
  );

  return (
    <PageLayoutContext.Provider value={ctx}>
      <div
        data-slot="page-layout"
        data-state={state}
        style={
          {
            "--aside-w": asideWidth,
            "--main-min": mainMinWidth,
            "--main-offset": hasAside && isOpen ? "var(--aside-w)" : "0px",
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "bg-background relative flex min-h-svh max-h-svh overflow-auto flex-col",
          "transition-[margin-right] duration-200",
          "mr-(--main-offset) min-w-(--main-min)",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </PageLayoutContext.Provider>
  );
}

function PageLayoutHeader({
  className,
  children,
  border = "always",
  ...props
}: React.ComponentProps<"header"> & { border?: "always" | "never" | "scroll" }) {
  const { isPageScrolled } = usePageAside();
  const hideBorder = border === "never" || (border === "scroll" && !isPageScrolled);

  return (
    <header
      data-slot="page-header"
      className={cn(
        "bg-background sticky top-0 z-40 border-b transition-[border-color] shadow-bottom", 
        !isPageScrolled && "shadow-none",
        hideBorder && "border-transparent", 
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
}

function PageLayoutHeaderContent({
  className,
  showBackButton,
  children,
  ...props
}: React.ComponentProps<"div"> & { 
  showBackButton?: boolean;
}) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "mx-auto w-full",
        "flex flex-wrap justify-auto items-center gap-2 pt-5 pb-7 px-9 md:px-6 sm:px-4",
        className
      )}
      {...props}
    >
      <SidebarTrigger className="md:hidden self-justify-start"></SidebarTrigger>

      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 self-justify-start"
          aria-label="Go back"
          onClick={() => router.back()}
        >
          <CaretLeftIcon />
        </Button>
      )}

      {children}
    </div>
  );
}

function PageLayoutHeaderTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <TypographyPageTitle
      data-slot="page-header-title"
      className={cn("truncate self-justify-start", className)}
      {...props}
    />
  );
}

function PageLayoutContent({
  className,
  ...props
}: React.ComponentProps<"main">) {
  const { setIsPageScrolled } = usePageAside();
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = mainRef.current;
    if (!element) return;

    const handleScroll = () => {
      setIsPageScrolled(element.scrollTop > 0);
    };

    element.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => element.removeEventListener("scroll", handleScroll);
  }, [setIsPageScrolled]);

  return (
    <main
      ref={mainRef}
      data-slot="page-main"
      className={cn(
        "h-full min-h-0 overflow-y-auto",
        "[scrollbar-gutter:stable_both-edges] [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain] [touch-action:pan-y] [scroll-behavior:smooth]",
        "transition-[padding-right] duration-200",
        className,
      )}
      {...props}
    />
  );
}

function PageLayoutAside({
  className,
  style,
  side = "right",
  ariaLabel = "Page aside",
  children,
  ...props
}: React.ComponentProps<"aside"> & {
  side?: "right" | "left";
  ariaLabel?: string;
}) {
  const { isOpen, registerAside } = usePageAside();

  React.useEffect(() => registerAside(), [registerAside]);

  const closedTransform =
    side === "right" ? "translate-x-full" : "-translate-x-full";

  return (
    <aside
      role="complementary"
      aria-hidden={!isOpen}
      aria-label={ariaLabel}
      data-slot="page-aside"
      data-state={isOpen ? "open" : "closed"}
      style={{ width: "min(var(--aside-w), 100dvw)", ...style }}
      className={cn(
        "fixed top-0 z-40 h-dvh border bg-background shadow-lg",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        closedTransform,
        "data-[state=open]:translate-x-0 transition-transform duration-200 will-change-transform",
        className,
      )}
      {...props}
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </aside>
  );
}

function PageAsideTrigger({
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggle } = usePageAside();

  return (
    <Button
      data-slot="page-aside-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(e) => {
        onClick?.(e);
        toggle();
      }}
      {...props}
    >
      {children ?? <span className="sr-only">Toggle Page Aside</span>}
    </Button>
  );
}

export {
  PageAsideTrigger, PageLayout, PageLayoutAside, PageLayoutContent, PageLayoutHeader, PageLayoutHeaderContent,
  PageLayoutHeaderTitle, usePageAside
};

