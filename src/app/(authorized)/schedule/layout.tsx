import { requirePermission } from "@/lib/auth/guard";

export default async function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ permission: { shifts: ["view"] } });
  return <>{children}</>;
}
