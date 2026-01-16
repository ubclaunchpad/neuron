import { cn } from "@/lib/utils";
import { UserStatus } from "@/models/interfaces";
import { Badge } from "../ui/badge";

export function StatusBadge({
  status,
  className,
}: {
  status: UserStatus;
  className?: string;
}) {
  let variant;
  switch (status) {
    case UserStatus.active:
    case UserStatus.unverified:
      variant = "secondary";
      break;
    case UserStatus.inactive:
    case UserStatus.rejected:
      variant = "destructive";
  }

  return (
    <Badge variant={variant as any} className={cn(className)}>
      {UserStatus.getName(status)}
    </Badge>
  );
}
