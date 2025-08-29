import { requirePermission } from "@/lib/auth/guard";

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    await requirePermission({ schedule: ['view'] });
    return <>{children}</>;
}