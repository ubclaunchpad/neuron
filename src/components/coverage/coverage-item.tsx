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
import { cn } from "@/lib/utils";
import { CoverageStatus } from "@/models/api/coverage";
import { Role } from "@/models/interfaces";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";
import { createPrng } from "@/utils/prngUtils";
import { backgroundColors } from "@/components/ui/avatar";
import { differenceInMinutes, format } from "date-fns";
import { useMemo, useState } from "react";
import type { CoverageRequest } from "@/models/coverage";
import type { Volunteer } from "@/models/volunteer";

function formatDuration(start: Date, end: Date) {
  const minutes = differenceInMinutes(end, start);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours} hr ${mins} min`;
}

import { Check, Send } from "lucide-react";

// ... existing imports

export function CoverageItem({
  item,
  onSelect,
}: {
  item: CoverageRequest;
  onSelect?: (item: CoverageRequest) => void;
}) {
  const { user } = useAuth();
  const { startAt, endAt } = item.shift;
  
  // Use createPrng properly - it expects a seed string
  const color = useMemo(() => {
    const prng = createPrng(item.shift.class.name);
    return prng.shuffle(backgroundColors)[0] ?? "#111315";
  }, [item.shift.class.name]);

  // Mock mutations for demo purposes since backend endpoints don't support mock IDs
  const [isFilling, setIsFilling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleFill = () => {
    setIsFilling(true);
    setTimeout(() => {
        setIsFilling(false);
        alert("Success: Shift covered! (Mock action)");
    }, 1000);
  };

  const handleCancel = () => {
    setIsCancelling(true);
    setTimeout(() => {
        setIsCancelling(false);
        alert("Success: Request withdrawn! (Mock action)");
    }, 1000);
  };

  const handleNotify = () => {
    setIsNotifying(true);
    setTimeout(() => {
        setIsNotifying(false);
        alert("Success: Instructor notified! (Mock action)");
    }, 1000);
  };

  const handleApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
        setIsApproving(false);
        alert("Success: Request approved! (Mock action)");
    }, 1000);
  };

  const isMyRequest = user?.id === item.requestingVolunteer.id;
  const isAdmin = user?.role === Role.admin;
  const isOpen = item.status === CoverageStatus.open;
  const isResolved = item.status === CoverageStatus.resolved;

  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-4 rounded-lg bg-card p-4 shadow-xs border transition-all hover:shadow-sm",
      )}
      onClick={() => onSelect?.(item)}
    >
        {/* Vertical Color Bar */}
        <div
          style={{ backgroundColor: color }}
          className="absolute left-5 top-5 bottom-5 w-1.5 rounded-full z-10"
        />

        <div 
            className="grid gap-4 pl-8 items-start w-full"
            style={{ gridTemplateColumns: "95px 1.4fr 1.6fr 280px" }}
        >
            {/* Column 1: Time */}
            <div className="flex flex-col gap-0.5">
                <TypographyRegBold className="text-sm font-semibold">
                    {format(startAt, "hh:mm a")}
                </TypographyRegBold>
                <TypographySmall className="text-muted-foreground">
                    {formatDuration(startAt, endAt)}
                </TypographySmall>
            </div>

            {/* Column 2: Class Info & Metadata */}
            <div className="flex flex-col gap-1.5 overflow-hidden">
                <div className="font-medium text-base leading-tight truncate">
                    {item.shift.class.name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                    <span className="font-medium text-foreground">Instructor:</span> INSTRUCTOR_FIRST_NAME INSTRUCTOR_LAST_NAME
                </div>
                <div className="text-sm text-muted-foreground truncate">
                    {/* <span className="font-medium text-foreground">Volunteer(s):</span> {item.volunteers.map((v: Volunteer) => `${v.name} ${v.lastName}`).join(", ")} */}
                    <span className="font-medium text-foreground">Volunteer(s):</span> ALL VOLUNTEERS HERE
                </div>
            </div>

             {/* Column 3: Request Info */}
             <div className="flex flex-col gap-1.5 overflow-hidden">
                <div className="text-sm truncate">
                    <span className="text-muted-foreground">Requested by: </span>
                    <span className="font-bold text-foreground">{item.requestingVolunteer.name} {item.requestingVolunteer.lastName}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                   Requested on: REQUESTED ON
                </div>
                
                 {/* Reason (Visible to Admin or My Request) */}
                {(isAdmin || isMyRequest) && (
                   <div className="mt-1 text-xs text-muted-foreground italic truncate">
                       Reason: {item.details}
                   </div>
                )}
             </div>

             {/* Actions (Far Right) */}
             {/* <div className="flex flex-col gap-2 items-end w-full">
                 {isOpen && !isMyRequest && !isAdmin && (
                     <Button
                        size="default" // h-10
                        variant="default" // "Take Shift" usually primary action for volunteers
                        pending={isFilling}
                        onClick={handleFill}
                     >
                         Take Shift
                     </Button>
                 )}

                 {isOpen && isMyRequest && !isAdmin && (
                     <Button
                        size="default" // h-10
                        variant="destructive"
                        pending={isCancelling}
                        onClick={handleCancel}
                     >
                         Withdraw
                     </Button>
                 )}

                 {isAdmin && isOpen && (
                     <div className="flex items-center gap-2">
                         <Button
                            size="default"
                            variant="outline"
                            pending={isNotifying}
                            onClick={handleNotify}
                            className="gap-2 px-4"
                         > 
                             <Send className="size-4" />
                             Notify Instructor
                         </Button>
                         <Button
                            size="default"
                            variant="default"
                            pending={isApproving}
                            onClick={handleApprove}
                            className="gap-2 px-4 text-white border-transparent hover:brightness-110"
                            style={{ backgroundColor: "#0284c7" }} // Explicit Tailwind sky-600/blue-600 logic
                         >
                             <Check className="size-4" />
                             Approve
                         </Button>
                     </div>
                 )}
                 
                 {!isOpen && (
                      <div className="h-10 px-4 flex items-center justify-center rounded-md bg-muted text-muted-foreground text-sm font-medium border border-transparent whitespace-nowrap">
                          {item.status === CoverageStatus.resolved ? "Fulfilled" : "Expired/Withdrawn"}
                      </div>
                 )}
             </div> */}
        </div>
    </div>
  );
}
