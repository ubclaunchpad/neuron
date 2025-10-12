import { requireStatus } from "@/lib/auth/guard";
import { Status } from "@/models/interfaces";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStatus(Status.active);
  // return <NavbarLayout>{children}</NavbarLayout>;
  return children;
}
