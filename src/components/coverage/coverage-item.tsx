"use client";

import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { TypographyRegBold, TypographySmall } from "@/components/ui/typography";
import { WithPermission } from "@/components/utils/with-permission";
import { cn } from "@/lib/utils";
import { CoverageStatus } from "@/models/api/coverage";
import { useAuth } from "@/providers/client-auth-provider";
import { createPrng } from "@/utils/prngUtils";
import { backgroundColors } from "@/components/ui/avatar";
import { differenceInMinutes, format } from "date-fns";
import { useMemo } from "react";
import type { CoverageListItem } from "./coverage-page-context";
import { FillCoverageButton } from "./fill-coverage-button";
import { WithdrawCoverageButton } from "./withdraw-coverage-button";

function formatDuration(start: Date, end: Date) {
  const minutes = differenceInMinutes(end, start);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hr ${mins} min`;
}

export function CoverageItem({
  item,
  onSelect,
}: {
  item: CoverageListItem;
  onSelect?: (item: CoverageListItem) => void;
}) {
  const { user } = useAuth();
  const { startAt, endAt } = item.shift;

  const color = useMemo(() => {
    const prng = createPrng(item.shift.class.name);
    return prng.shuffle(backgroundColors)[0] ?? "#111315";
  }, [item.shift.class.name]);

  const isMyRequest = user?.id === item.requestingVolunteer.id;
  const isOpen = item.status === CoverageStatus.open;

  return (
    <Item
      size="sm"
      className="gap-8 relative shadow-xs has-[button[data-overlay]:hover]:bg-accent"
    >
      {/* Button that covers the entire card */}
      <Button
        data-overlay
        unstyled
        aria-label={`Open coverage request for ${item.shift.class.name}`}
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={() => onSelect?.(item)}
      />

      <ItemContent className="flex-row gap-4">
        <div
          style={{ "--avatar-bg": color } as React.CSSProperties}
          className={cn(
            "w-1.5 self-stretch translate-0 shrink-0 rounded bg-primary",
            "bg-(--avatar-bg)",
          )}
        />
        <ItemContent className="flex-0 min-w-max">
          <TypographyRegBold className="text-sm font-semibold">
            {format(startAt, "hh:mm a")}
          </TypographyRegBold>
          <TypographySmall className="text-muted-foreground">
            {formatDuration(startAt, endAt)}
          </TypographySmall>
        </ItemContent>
        <ItemContent className="!flex-1">
          <ItemTitle className="truncate block w-full max-w-full">
            {item.shift.class.name}
          </ItemTitle>
          <ItemDescription className="text-xs line-clamp-1">
            Instructor:{" "}
            {item.shift.instructors.length > 0
              ? item.shift.instructors
                  .map((i) => `${i.name} ${i.lastName}`)
                  .join(", ")
              : "None assigned"}
          </ItemDescription>
          <ItemDescription className="text-xs line-clamp-1">
            Volunteer(s):{" "}
            {item.shift.volunteers.length > 0
              ? item.shift.volunteers
                  .map((v) => `${v.name} ${v.lastName}`)
                  .join(", ")
              : "None assigned"}
          </ItemDescription>
        </ItemContent>
        <ItemContent className="!flex-1">
          <ItemTitle className="truncate block w-full max-w-full text-sm">
            Requested by:{" "}
            <span className="font-bold">
              {item.requestingVolunteer.name}{" "}
              {item.requestingVolunteer.lastName}
            </span>
          </ItemTitle>
          {isMyRequest && "details" in item && (
            <ItemDescription className="text-xs line-clamp-1 italic">
              Reason: {item.details}
            </ItemDescription>
          )}
        </ItemContent>
      </ItemContent>

      <ItemActions className="ml-auto gap-2 relative z-10">
        {isOpen && !isMyRequest && (
          <WithPermission permissions={{ permission: { coverage: ["fill"] } }}>
            <FillCoverageButton item={item} />
          </WithPermission>
        )}

        {isOpen && isMyRequest && (
          <WithPermission
            permissions={{ permission: { coverage: ["request"] } }}
          >
            <WithdrawCoverageButton item={item} />
          </WithPermission>
        )}

        {!isOpen && (
          <Badge
            variant="colored"
            color={
              item.status === CoverageStatus.resolved ? "success" : "default"
            }
          >
            {item.status === CoverageStatus.resolved
              ? "Fulfilled"
              : "Withdrawn"}
          </Badge>
        )}
      </ItemActions>
    </Item>
  );
}
