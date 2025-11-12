import { checkPermissions, requirePermission } from "@/lib/auth/guard";
import { HydrateClient, ssrApi } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ClassesTemplate({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: {
    class?: string;
  };
}) {
  await requirePermission({ permission: { classes: ["view"] } });
  const queryClassId = searchParams?.class;

  // Check if the user has the update or create permission
  const updatePermission = await checkPermissions({ permission: { classes: ["update"] } });
  const createPermission = await checkPermissions({ permission: { classes: ["create"] } });
  if ((!updatePermission && queryClassId) || (!createPermission && !queryClassId)) {
    redirect("/classes");
  }

  // Prefetch the class
  if (queryClassId) {
    await ssrApi.class.byId.prefetch({ classId: queryClassId });
  }

  return <HydrateClient>{children}</HydrateClient>;
}
