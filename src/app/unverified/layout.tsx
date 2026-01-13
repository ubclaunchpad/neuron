import { requireStatus } from "@/lib/auth/guard";
import { UserStatus } from "@/models/interfaces";

export default async function UnverifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStatus(UserStatus.unverified);
  return children;
}
