"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonListGroup } from "@/components/ui/skeleton";
import { ShiftItemSkeleton } from "@/components/schedule/shift-item-skeleton";
import { AlertDialog } from "@/components/primitives/alert-dialog";
import { Button } from "@/components/primitives/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { TypographyRegBold, TypographySmall } from "@/components/ui/typography";
import { backgroundColors } from "@/components/ui/avatar";
import { clientApi } from "@/trpc/client";
import { createPrng } from "@/utils/prngUtils";
import { groupCoverageItemsByDay } from "@/components/coverage/list/utils";
import type { ListCoverageRequestBase } from "@/models/coverage";
import { CoverageStatus } from "@/models/api/coverage";
import { differenceInMinutes, format, isToday } from "date-fns";
import { ChevronRight, Plus, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/client-auth-provider";

function formatDuration(start: Date, end: Date) {
  const minutes = differenceInMinutes(end, start);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hr ${mins} min`;
}

function DashboardCoverageItem({
  item,
  onOpen,
}: {
  item: ListCoverageRequestBase;
  onOpen: (item: ListCoverageRequestBase) => void;
}) {
  const { user } = useAuth();
  const apiUtils = clientApi.useUtils();

  const { mutate: fillCoverageRequest, isPending: isFilling } =
    clientApi.coverage.fillCoverageRequest.useMutation({
      onSuccess: () => {
        void apiUtils.coverage.invalidate();
        void apiUtils.shift.list.invalidate();
      },
    });

  const { mutate: cancelCoverageRequest, isPending: isCancelling } =
    clientApi.coverage.cancelCoverageRequest.useMutation({
      onSuccess: () => {
        void apiUtils.coverage.invalidate();
        void apiUtils.shift.list.invalidate();
      },
    });

  const color = useMemo(() => {
    const prng = createPrng(item.shift.class.name);
    return prng.shuffle(backgroundColors)[0]!;
  }, [item.shift.class.name]);

  const { startAt, endAt } = item.shift;
  const isMyRequest = user?.id === item.requestingVolunteer.id;
  const isOpen = item.status === CoverageStatus.open;

  return (
    <Item
      size="sm"
      className="gap-8 relative shadow-xs has-[button[data-overlay]:hover]:bg-accent"
    >
      <Button
        data-overlay
        unstyled
        aria-label={`Open coverage request for ${item.shift.class.name}`}
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={() => onOpen(item)}
      />

      <ItemContent className="flex-row gap-4">
        <div
          style={{ "--avatar-bg": color } as React.CSSProperties}
          className={cn("w-1.5 self-stretch shrink-0 rounded", "bg-(--avatar-bg)")}
        />
        <ItemContent className="flex-0 min-w-max">
          <TypographyRegBold className="text-sm font-semibold">
            {format(startAt, "hh:mm a")}
          </TypographyRegBold>
          <TypographySmall className="text-muted-foreground">
            {formatDuration(startAt, endAt)}
          </TypographySmall>
        </ItemContent>
        <ItemContent className="flex-1!">
          <ItemTitle className="truncate block w-full max-w-full">
            {item.shift.class.name}
          </ItemTitle>
          <ItemDescription className="text-xs line-clamp-1">
            {item.shift.class.description}
          </ItemDescription>
        </ItemContent>
      </ItemContent>

      <ItemActions className="ml-auto gap-2 relative z-10">
        {isOpen && !isMyRequest && (
          <AlertDialog
            alertTitle="Take this shift?"
            alertDescription="You will be assigned to cover this shift. The requesting volunteer will be notified."
            alertActionContent="Yes, take shift"
            onAccept={() => fillCoverageRequest({ coverageRequestId: item.id })}
          >
            <Button
              variant="outline"
              pending={isFilling}
              startIcon={<Plus className="size-3.5" />}
            >
              Cover
            </Button>
          </AlertDialog>
        )}

        {isOpen && isMyRequest && (
          <AlertDialog
            alertTitle="Withdraw coverage request?"
            alertDescription="This will close your coverage request for this shift."
            alertActionAsOverride
            alertActionContent={
              <Button size="sm" variant="destructive" pending={isCancelling}>
                Yes, withdraw request
              </Button>
            }
            onAccept={() => cancelCoverageRequest({ coverageRequestId: item.id })}
          >
            <Button variant="destructive-outline" pending={isCancelling}>
              <XIcon />
              <span>Withdraw</span>
            </Button>
          </AlertDialog>
        )}
      </ItemActions>
    </Item>
  );
}

export function DashboardCoverageShifts() {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);

  const { data, isLoading } = clientApi.coverage.list.useInfiniteQuery(
    {
      status: "open",
      from: now,
      sortOrder: "asc",
      perPage: 8,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  const items = useMemo(
    () => (data?.pages.flatMap((page) => page.data) ?? []) as ListCoverageRequestBase[],
    [data],
  );

  const dayGroups = useMemo(() => groupCoverageItemsByDay(items), [items]);

  const handleOpen = (item: ListCoverageRequestBase) => {
    router.push(`/coverage?coverageId=${item.id}`);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <Link href="/coverage" className="inline-flex items-center gap-0.5">
          <CardTitle className="text-base font-semibold">Shifts in Need of Coverage</CardTitle>
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <SkeletonListGroup
            containerClassName="space-y-3"
            titleContainerClassName="pt-3 pb-2"
            titleClassName="h-6 w-31"
            itemContainerClassName="flex flex-col gap-3 px-5"
            itemRenderer={() => <ShiftItemSkeleton />}
          />
        ) : dayGroups.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            No shifts need coverage
          </div>
        ) : (
          <div className="space-y-3">
            {dayGroups.map((group) => (
              <div key={group.date.toISOString()}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(group.date, "MMM d")}
                  </span>
                  {isToday(group.date) && (
                    <span className="text-xs font-semibold text-primary">Today</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <DashboardCoverageItem key={item.id} item={item} onOpen={handleOpen} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}