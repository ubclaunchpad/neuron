import { cn } from "@/lib/utils";
import { Status } from "@/models/interfaces";
import { Badge } from "../ui/badge";

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  let variant;
  switch (status) {
    case Status.active:
    case Status.unverified:
      variant =  "secondary";
      break;
    case Status.inactive:
    case Status.rejected:
      variant = "destructive";
  }

  return (
    <Badge
      variant={variant as any}
      className={cn(className)}
    >
      {Status.getName(status)}
    </Badge>
  );
}
