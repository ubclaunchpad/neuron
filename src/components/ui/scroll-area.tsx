"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  viewPortClassName?: string;
  orientation?: "vertical" | "horizontal";
  viewPortRef?: React.Ref<HTMLDivElement>;
};

function ScrollArea({
  className,
  children,
  viewPortClassName,
  viewPortRef,
  orientation = "vertical",
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        ref={viewPortRef}
        className={cn(
          "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 [&>div]:block!",
          viewPortClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation={orientation} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

interface VirtualizedScrollAreaProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  estimateSize: (index: number) => number;
  getItemKey?: (index: number) => string | number;
  listHeight: number;
  className?: string;
  initialScroll?: { index: number; clickAfterScroll: boolean };
}

export interface VirtualizedScrollAreaRef {
  scrollToIndex: (
    index: number,
    options?: {
      align?: "start" | "center" | "end";
      behavior?: "auto" | "smooth";
    },
  ) => void;
}

function VirtualizedScrollArea<T>({
  items,
  renderItem,
  overscan = 5,
  estimateSize,
  getItemKey,
  listHeight,
  initialScroll,
  ...props
}: VirtualizedScrollAreaProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
    getItemKey: getItemKey ?? ((index) => index),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  React.useEffect(() => {
    if (!initialScroll || initialScroll.index < 0) return;

    rowVirtualizer.scrollToIndex(initialScroll.index, {
      align: "start",
      behavior: "auto",
    });

    if (initialScroll.clickAfterScroll) {
      const timeout = window.setTimeout(() => {
        const targetElement = parentRef.current?.querySelector(
          `[data-virtual-index="${initialScroll.index}"]`,
        );
        const renderedElement = targetElement?.children[0];
        if (renderedElement instanceof HTMLElement) renderedElement.click();
      }, 100);
      return () => window.clearTimeout(timeout);
    }
  }, [initialScroll, rowVirtualizer]);

  return (
    <ScrollArea
      style={{ height: `${listHeight}px` }}
      viewPortRef={parentRef}
      {...props}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-virtual-index={virtualItem.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index]!, virtualItem.index)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "z-30 flex touch-none p-px transition-colors select-none data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar, VirtualizedScrollArea };
