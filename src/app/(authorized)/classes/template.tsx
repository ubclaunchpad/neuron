import { requirePermission } from "@/lib/auth/guard";

export default async function ClassesTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ permission: { classes: ["view"] } });
  return children;
}
