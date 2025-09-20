import { requirePermission } from "@/lib/auth/guard";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ permission: { profile: ["view"] } });
  return <>{children}</>;
}
