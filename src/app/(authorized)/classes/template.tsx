import { requirePermission } from "@/lib/auth/guard";
import { HydrateClient, ssrApi } from "@/trpc/server";

export default async function ClassesTemplate({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: {
    term?: string;
  };
}) {
  await requirePermission({ permission: { classes: ["view"] } });
  const queryTerm = searchParams?.term ?? "current";

  // Prefetch terms
  await ssrApi.term.all.prefetch();
  await ssrApi.class.list.prefetch({ term: queryTerm });

  return <HydrateClient>{children}</HydrateClient>;
}
