"use client";

import { Flag, LogOut, Settings, UserCircle2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { useAuth } from "@/providers/client-auth-provider";
import NiceModal from "@ebay/nice-modal-react";
import { useRouter } from "next/navigation";
import { SettingsDialog } from "./settings-dialog";

export function SettingsDropdown({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className={className}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start" side="top">
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <UserCircle2 />
              <span>{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => NiceModal.show(SettingsDialog)}>
              <Settings />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <Flag />
              <span>
                Report a Bug <i>(Coming soon)</i>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                authClient.signOut({
                  fetchOptions: {
                    onRequest: () => router.push("/auth/login"),
                  },
                })
              }
            >
              <LogOut />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
