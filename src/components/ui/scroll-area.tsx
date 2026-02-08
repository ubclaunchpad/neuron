"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    viewPortClassName?: string;
    orientation?: "vertical" | "horizontal";
    viewPortRef?: React.RefObject<HTMLDivElement>;
  }
>(
  (
    {
      className,
      children,
      viewPortClassName,
      viewPortRef,
      orientation = "vertical",
      ...props
    },
    ref,
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={cn(
          "size-full rounded-[inherit] [&>div]:block!",
          viewPortClassName,
        )}
        ref={viewPortRef}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation={orientation} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  ),
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-px",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-px",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

interface VirtualizedScrollAreaProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  estimateSize: (index: number) => number;
  getItemKey?: (index: number) => string | number;
  listHeight: number;
  className?: string;
  initialScroll?: {
    index: number;
    clickAfterScroll: boolean;
  };
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

const VirtualizedScrollArea = ({
  items,
  renderItem,
  overscan = 5,
  estimateSize,
  getItemKey,
  listHeight,
  initialScroll,
  className,
  ...props
}: VirtualizedScrollAreaProps<any>) => {
  const parentRef = React.useRef<HTMLDivElement>(null as any);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize,
    overscan,
    getItemKey: getItemKey || ((index) => index),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  React.useEffect(() => {
    if (initialScroll === null || initialScroll === undefined) {
      return;
    }
    if (initialScroll?.index > -1) {
      rowVirtualizer.scrollToIndex(initialScroll.index, {
        align: "start",
        behavior: "auto",
      });

      if (initialScroll?.clickAfterScroll) {
        //need to wait for the scroll to be completed
        setTimeout(() => {
          const targetElement = parentRef.current?.querySelector(
            `[data-virtual-index="${initialScroll.index}"]`,
          );
          const renderedElement = targetElement?.children[0];
          if (renderedElement instanceof HTMLElement) {
            renderedElement.click();
          }
        }, 100);
      }
    }
  }, [initialScroll?.index, rowVirtualizer]);

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
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
VirtualizedScrollArea.displayName = "VirtualizedScrollArea";

export { ScrollArea, ScrollBar, VirtualizedScrollArea };
