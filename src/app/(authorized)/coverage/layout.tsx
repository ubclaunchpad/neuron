import { requirePermission } from "@/lib/auth/guard";

export default async function CoverageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ permission: { coverage: ["view"] } });
  return <>{children}</>;
}
