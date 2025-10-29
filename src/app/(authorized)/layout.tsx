import { AppNavbar } from "@/components/app-navbar";
import { SIDEBAR_COOKIE_NAME, SidebarProvider } from "@/components/primitives/sidebar";
import { requireStatus } from "@/lib/auth/guard";
import { Status } from "@/models/interfaces";
import { cookies } from "next/headers";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireStatus(Status.active);

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "true"
  
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppNavbar/>
      <div className="flex-1 max-h-svh overflow-auto">
        {children}
      </div>
    </SidebarProvider>
  )
}