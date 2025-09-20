import { requirePermission } from "@/lib/auth/guard";
import { api, HydrateClient } from "@/trpc/server";

export default async function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ permission: { classes: ["view"] } });
  
  // Prefetch terms
  await api.term.all.prefetch();
  return <HydrateClient>{children}</HydrateClient>;
}
