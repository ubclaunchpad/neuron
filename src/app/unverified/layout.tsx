import { requireStatus } from "@/lib/auth/guard";
import { Status } from "@/models/interfaces";

export default async function UnverifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStatus(Status.unverified);
  return children;
}
