import { requireStatus } from "@/lib/auth/guard";
import { UserStatus } from "@/models/interfaces";

export default async function InactiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStatus(UserStatus.inactive);
  return children;
}
