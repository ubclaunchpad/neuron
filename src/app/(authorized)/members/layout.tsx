import { requirePermission } from "@/lib/auth/guard";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ 
    permission: { 
      users: ["view-volunteer", "invite", "activate", "deactivate"] 
    } 
  });
  return <>{children}</>;
}
