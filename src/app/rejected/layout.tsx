import { requireStatus } from "@/lib/auth/guard";
import { UserStatus } from "@/models/interfaces";

export default async function RejectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStatus(UserStatus.rejected);
  return children;
}
