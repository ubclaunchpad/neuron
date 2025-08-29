import { requirePermission } from "@/lib/auth/guard";
import type { Permissions } from "@/lib/auth/permissions";

export default async function WithPermission({
  permissions,
  children,
}: {
  permissions: Permissions
  children: React.ReactNode;
}) {
    await requirePermission(permissions);
    return <>{children}</>;
}