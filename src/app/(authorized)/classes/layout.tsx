import { requirePermission } from "@/lib/auth/guard";
import { HydrateClient, ssrApi } from "@/trpc/server";

export default async function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission({ permission: { classes: ["view"] } });

  // Prefetch terms and current classes
  await ssrApi.term.all.prefetch();
  await ssrApi.class.list.prefetch({ term: "current" });

  return <HydrateClient>{children}</HydrateClient>;
}
