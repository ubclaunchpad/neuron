"use client";

import { Avatar } from "@/components/primitives/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ReadonlyField,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useImageUrl } from "@/lib/build-image-url";
import { Role } from "@/models/interfaces";
import type { ListUser, User } from "@/models/user";
import { clientApi } from "@/trpc/client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { CalendarDays, Clock, Moon, Sun, Sunrise, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { StatusBadge } from "./status-badge";

type UserProfileDialogProps = {
  userId: string;
  initialUser: ListUser;
};

type UserWithScheduling = User & {
  preferredTimeCommitment?: string;
  availability?: string[];
};

type AvailabilityBlock = {
  day: string;
  dayShort: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const TIME_PERIODS = ["Morning", "Afternoon", "Evening"] as const;

function buildAvailabilityGrid(slots: string[]): AvailabilityBlock[] {
  const normalized = slots.map((s) => s.toLowerCase());

  return DAYS.map((day) => {
    const isWeekend = day === "Saturday" || day === "Sunday";
    const dayLower = day.toLowerCase();

    // Gather all strings that match this day or weekend
    const dayStrings = normalized.filter(
      (s) => s.includes(dayLower) || (isWeekend && s.includes("weekend")),
    );

    // If an entry specifies the day without any time period, we assume all-day availability.
    const hasAllDay = dayStrings.some(
      (s) =>
        !s.includes("morning") &&
        !s.includes("afternoon") &&
        !s.includes("evening"),
    );

    return {
      day,
      dayShort: DAY_SHORT[day]!,
      morning: hasAllDay || dayStrings.some((s) => s.includes("morning")),
      afternoon: hasAllDay || dayStrings.some((s) => s.includes("afternoon")),
      evening: hasAllDay || dayStrings.some((s) => s.includes("evening")),
    };
  });
}

// Parse a commitment string like "10-15 hours per week" into { min, max }.
function parseCommitmentHours(commitment: string): {
  min: number;
  max: number;
} {
  const match = commitment.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return { min: Number(match[1]), max: Number(match[2]) };
  const single = commitment.match(/(\d+)/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return { min: 10, max: 15 };
}

function HeatmapCell({
  available,
  day,
  period,
}: {
  available: boolean;
  day: string;
  period: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`h-8 w-full rounded-[6px] border transition-all duration-200 cursor-default ${
            available
              ? "border-emerald-500/30 bg-emerald-500/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-emerald-400 hover:border-emerald-400/40"
              : "border-transparent bg-muted/40 hover:bg-muted/60"
          }`}
        />
      </TooltipTrigger>
      {available ? (
        <TooltipContent side="top">
          <p className="text-xs font-medium">
            {day} · {period}
          </p>
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

function AvailabilityHeatmap({ grid }: { grid: AvailabilityBlock[] }) {
  const totalSlots = grid.reduce(
    (sum, d) =>
      sum + (d.morning ? 1 : 0) + (d.afternoon ? 1 : 0) + (d.evening ? 1 : 0),
    0,
  );
  const totalPossible = grid.length * 3;
  const pct = Math.round((totalSlots / totalPossible) * 100);

  return (
    <div className="space-y-2.5">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
            <CalendarDays className="size-3 text-emerald-600" />
          </div>
          <span className="text-[13px] font-medium">Weekly Availability</span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-medium tabular-nums gap-1.5 px-2 py-0.5">
          <span className="inline-block h-2 w-2 rounded-[3px] bg-emerald-500/80" />
          {totalSlots}/{totalPossible} ({pct}%)
        </Badge>
      </div>

      {/* Heatmap grid */}
      <div className="rounded-xl border bg-card/60 p-3 pb-2.5">
        {/* Column headers */}
        <div className="mb-1.5 grid grid-cols-[3rem_repeat(3,1fr)] gap-1.5">
          <div />
          {TIME_PERIODS.map((period) => (
            <div
              key={period}
              className="text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 flex items-center justify-center"
            >
              {period === "Morning" ? <Sunrise className="size-3" /> : period === "Afternoon" ? <Sun className="size-3" /> : <Moon className="size-3" />}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {grid.map((block) => {
            return (
              <div
                key={block.day}
                className="grid grid-cols-[3rem_repeat(3,1fr)] items-center gap-1.5"
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  {block.dayShort}
                </span>
                <HeatmapCell
                  available={block.morning}
                  day={block.day}
                  period="Morning"
                />
                <HeatmapCell
                  available={block.afternoon}
                  day={block.day}
                  period="Afternoon"
                />
                <HeatmapCell
                  available={block.evening}
                  day={block.day}
                  period="Evening"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { day: string; available: boolean } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]!;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
      <p className="text-[11px] font-medium text-muted-foreground">{item.payload.day}</p>
      <p className="text-sm font-semibold tabular-nums">
        {item.value}h <span className="text-xs font-normal text-muted-foreground">capacity</span>
      </p>
    </div>
  );
}

// Uses dummy values for now. Not sure what the actual shifts are like
function CommitmentChart({
  hours,
  availabilityGrid,
}: {
  hours: { min: number; max: number };
  availabilityGrid: AvailabilityBlock[];
}) {
  const data = useMemo(() => {
    return availabilityGrid.map((block) => {
      const capacity =
        (block.morning ? 4 : 0) +
        (block.afternoon ? 4 : 0) +
        (block.evening ? 2 : 0);
      return {
        day: block.dayShort,
        capacity,
        available: capacity > 0,
      };
    });
  }, [availabilityGrid]);

  const totalCapacity = data.reduce((s, d) => s + d.capacity, 0);
  const peakDay = data.reduce((best, d) => (d.capacity > best.capacity ? d : best), data[0]!);
  
  const avgTarget = (hours.min + hours.max) / 2;
  const dailyAvgTarget = Number((avgTarget / 7).toFixed(1));

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
            <TrendingUp className="size-3 text-violet-600" />
          </div>
          <span className="text-[13px] font-medium">Availability Capacity</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Badge variant="outline" className="text-[10px] font-medium tabular-nums px-2 py-0.5 border-dashed border-violet-500/50 text-violet-600 bg-violet-500/5">
            Target: {avgTarget}h
          </Badge>
          <Badge variant="secondary" className="text-[10px] font-medium tabular-nums px-2 py-0.5">
            {totalCapacity}h / week
          </Badge>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card/60 p-3 pt-4">
        <ResponsiveContainer width="100%" height={130}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 2, left: -24, bottom: 0 }}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(262, 83%, 62%)" stopOpacity={0.95} />
                <stop offset="100%" stopColor="hsl(262, 83%, 50%)" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.4}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              dy={4}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              domain={[0, "auto"]}
              width={30}
              tickFormatter={(v: number) => `${v}h`}
            />
            <ReferenceLine 
              y={dailyAvgTarget} 
              stroke="hsl(262, 83%, 62%)" 
              strokeDasharray="4 4" 
              opacity={0.5} 
            />
            <RechartsTooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.15, radius: 4 }}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="capacity" radius={[5, 5, 0, 0]} maxBarSize={26}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.available
                      ? "url(#barGradient)"
                      : "hsl(var(--muted))"
                  }
                  opacity={entry.available ? 1 : 0.25}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary stat row */}
        <div className="mt-2 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
          <span>Peak Capacity: <span className="font-medium text-foreground">{peakDay.day} ({peakDay.capacity}h)</span></span>
          <span className="flex items-center gap-1.5 opacity-80">
            Daily Target: <span className="font-medium text-foreground">{dailyAvgTarget}h</span>
            <span className="inline-block h-[0px] w-4 border-t border-violet-500/80 border-dashed" />
          </span>
        </div>
      </div>
    </div>
  );
}

export const UserProfileDialog = NiceModal.create(
  ({ userId, initialUser }: UserProfileDialogProps) => {
    const modal = useModal();

    const { data: user } = clientApi.user.byId.useQuery(
      { userId },
      {
        initialData: initialUser as User,
        placeholderData: (prev) => prev,
      },
    );

    const avatarSrc = useImageUrl(user?.image);

    if (!user) return null;

    const profile = user as UserWithScheduling;

    const joinedDate =
      user.createdAt &&
      new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    // TODO: Replace with actual data from the API once implemented. This is dummy data for now.
    const commitmentDisplay =
      profile.preferredTimeCommitment ||
      "10-15 hours per week (Dummy Data)";
    const availabilitySlots = profile.availability?.length
      ? profile.availability
      : [
          "Monday Mornings",
          "Monday Afternoons",
          "Tuesday Afternoons",
          "Wednesday Mornings",
          "Wednesday Afternoons",
          "Thursday Evenings",
          "Friday Mornings",
          "Saturday",
          "Sunday",
        ];

    const commitmentHours = parseCommitmentHours(commitmentDisplay);
    const availabilityGrid = buildAvailabilityGrid(availabilitySlots);

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => (open ? modal.show() : modal.hide())}
      >
        <DialogContent className="max-w-md flex flex-col">
          <DialogHeader className="items-center text-center">
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>

          {/* Identity header */}
          <div className="flex flex-col items-center gap-3">
            <Avatar
              src={avatarSrc}
              fallbackText={`${user.name} ${user.lastName}`}
              className="size-22"
            />
            <div className="space-y-1 text-center">
              <p className="text-base font-semibold">
                {user.name} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Tabbed content */}
          <Tabs defaultValue="overview">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="general" className="flex-1">
                General info
              </TabsTrigger>
              <TabsTrigger value="scheduling" className="flex-1">
                Scheduling
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <ReadonlyField label="Role">
                <Badge variant="outline">{Role.getName(user.role)}</Badge>
              </ReadonlyField>
              <ReadonlyField label="Status">
                <StatusBadge status={user.status} />
              </ReadonlyField>
              <ReadonlyField label="Email address">
                <span className="truncate">{user.email}</span>
              </ReadonlyField>
              <ReadonlyField label="Joined date">
                {joinedDate ?? "Not available"}
              </ReadonlyField>
            </TabsContent>

            <TabsContent value="general" className="mt-4 space-y-4">
              {user.preferredName && (
                <ReadonlyField label="Preferred name">
                  {user.preferredName}
                </ReadonlyField>
              )}
              {user.pronouns && (
                <ReadonlyField label="Pronouns">
                  {user.pronouns}
                </ReadonlyField>
              )}
              {user.phoneNumber && (
                <ReadonlyField label="Phone number">
                  {user.phoneNumber}
                </ReadonlyField>
              )}
              {(user.city || user.province) && (
                <ReadonlyField label="Location">
                  {[user.city, user.province].filter(Boolean).join(", ")}
                </ReadonlyField>
              )}
              {user.bio && (
                <ReadonlyField label="Bio">
                  <span className="text-sm leading-relaxed whitespace-pre-wrap">
                    {user.bio}
                  </span>
                </ReadonlyField>
              )}
              {!user.preferredName &&
                !user.pronouns &&
                !user.phoneNumber &&
                !user.city &&
                !user.province &&
                !user.bio && (
                  <p className="text-sm text-muted-foreground">
                    No general info on file.
                  </p>
                )}
            </TabsContent>

            <TabsContent value="scheduling" className="mt-4 space-y-4">
              {/* Time commitment summary card */}
              <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-br from-violet-500/[0.06] via-transparent to-emerald-500/[0.06] px-3.5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/10">
                  <Zap className="size-3.5 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Time Commitment
                  </p>
                  <p className="text-[13px] font-semibold leading-snug">{commitmentDisplay}</p>
                </div>
                <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
                  <Clock className="size-3 text-muted-foreground" />
                  <span className="text-[11px] font-semibold tabular-nums text-foreground">
                    {commitmentHours.min}–{commitmentHours.max}h
                  </span>
                </div>
              </div>

              <AvailabilityHeatmap grid={availabilityGrid} />

              <CommitmentChart
                hours={commitmentHours}
                availabilityGrid={availabilityGrid}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => modal.hide()}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);