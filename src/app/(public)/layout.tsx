import { requireNotAuth } from "@/lib/auth/guard";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireNotAuth();
  return <>{children}</>;
}
