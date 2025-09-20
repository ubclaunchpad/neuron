import { requirePermission } from "@/lib/auth/guard";

export default async function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ permission: { logs: ["view"] } });
  return <>{children}</>;
}
