import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ShiftStatus } from "@/models/shift";
import { CheckCircle2Icon, ClockFadingIcon, XCircleIcon } from "lucide-react";

type ShiftStatusBadgeProps = Omit<
  BadgeProps,
  "children" | "variant" | "color"
> & {
  status: ShiftStatus;
};

const statusColors: Record<ShiftStatus, BadgeProps["color"]> = {
  scheduled: "info",
  inprogress: "warning",
  cancelled: "error",
  finished: "success",
};

const statusIcons: Record<ShiftStatus, React.ReactNode> = {
  scheduled: null,
  inprogress: <ClockFadingIcon />,
  cancelled: <XCircleIcon />,
  finished: <CheckCircle2Icon />,
};

export function ShiftStatusBadge({
  status,
  className,
  ...props
}: ShiftStatusBadgeProps) {
  return (
    <Badge
      variant="colored"
      color={statusColors[status]}
      className={className}
      {...props}
    >
      {statusIcons[status]}
      {ShiftStatus.getName(status)}
    </Badge>
  );
}
