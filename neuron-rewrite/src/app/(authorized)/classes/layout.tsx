import { requirePermission } from "@/lib/auth/guard";

export default async function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    await requirePermission({ classes: ['view'] });
    return <>{children}</>;
}