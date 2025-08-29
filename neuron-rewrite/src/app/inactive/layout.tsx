import { requireStatus } from "@/lib/auth/guard";
import { Status } from "@/models/interfaces";

export default async function InactiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    await requireStatus(Status.inactive);
    return children;
}