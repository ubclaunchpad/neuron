import { ClassesPageView } from "@/components/classes/list/classes-page-view";
import { requirePermission } from "@/lib/auth/guard";

export default async function ClassesPage() {
  await requirePermission({ permission: { classes: ["view"] } });
  return <ClassesPageView />;
}
