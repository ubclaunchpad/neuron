import { AppNavbar } from "@/components/app-navbar";
import { SIDEBAR_COOKIE_NAME, SidebarProvider } from "@/components/ui/sidebar";
import { requireStatus } from "@/lib/auth/guard";
import { UserStatus } from "@/models/interfaces";
import { cookies } from "next/headers";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStatus(UserStatus.active);

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppNavbar />
      <div className="flex-1">{children}</div>
    </SidebarProvider>
  );
}
