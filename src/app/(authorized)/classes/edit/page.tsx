import { ClassEditView } from "@/components/classes/edit/class-edit-view";
import { checkPermissions, requirePermission } from "@/lib/auth/guard";
import { redirect } from "next/navigation";

export default async function ClassesEditPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  await requirePermission({ permission: { classes: ["view"] } });

  const queryClassId = (await searchParams).class;
  const permission = queryClassId ? "update" : "create";
  const allowed = await checkPermissions({
    permission: { classes: [permission] },
  });

  if (!allowed) redirect("/classes");

  return <ClassEditView />;
}
