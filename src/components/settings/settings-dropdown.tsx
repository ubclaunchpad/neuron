"use client";

import { Flag, LogOut, Settings, UserCircle2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { forceLogout } from "@/lib/auth/logout";
import { useAuth } from "@/providers/client-auth-provider";
import NiceModal from "@ebay/nice-modal-react";
import { useQueryState } from "nuqs";
import { ReportIssueDialog } from "../report-issue-dialog";
import { SettingsDialog, settingsTabParser } from "./settings-dialog";

export function SettingsDropdown({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const [, setSettingsTab] = useQueryState("settings", settingsTabParser);
  const handleLogout = async () => {
    await forceLogout();
  };

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
            <DropdownMenuItem onSelect={() => void setSettingsTab("profile")}>
              <Settings />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => NiceModal.show(ReportIssueDialog)}
            >
              <Flag />
              <span>Report Issue</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog />
    </>
  );
}
