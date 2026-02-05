"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { TabsTrigger } from "@radix-ui/react-tabs";
import { Bell, Clock, LockKeyhole, User, X } from "lucide-react";
import { Tabs, TabsContent, TabsList } from "../ui/tabs";
import { AvailabilitySettingsContent } from "./pages/availability-settings-content";
import { NotificationsSettingsContent } from "./pages/notifications-settings-content";
import { ProfileSettingsContent } from "./pages/profile/profile-settings-content";
import { SecuritySettingsContent } from "./pages/security-settings-content";

const settingsItems = [
  {
    id: "profile" as const,
    label: "Profile",
    description: "Edit how your profile appears across Neuron",
    icon: User,
    content: ProfileSettingsContent,
  },
  {
    id: "availability" as const,
    label: "Availability",
    description: "Configure times when you are available for class placement",
    icon: Clock,
    content: AvailabilitySettingsContent,
  },
  {
    id: "notifications" as const,
    label: "Notifications",
    icon: Bell,
    content: NotificationsSettingsContent,
  },
  {
    id: "security" as const,
    label: "Security",
    icon: LockKeyhole,
    content: SecuritySettingsContent,
  },
];

export const SettingsDialog = NiceModal.create(() => {
  const modal = useModal();
  const isMobile = useIsMobile();

  return (
    <Dialog open={modal.visible} onOpenChange={modal.hide}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-[min(calc(100vw-2rem),_42rem)] md:h-[60vh] h-[85vh] p-0 gap-0 border overflow-hidden"
      >
        <Tabs
          defaultValue="profile"
          className="md:grid md:grid-cols-[180px_1fr] overflow-auto"
        >
          <header className="md:hidden flex items-center justify-between h-13 px-3">
            <DialogTitle>Settings</DialogTitle>
            <Button
              onClick={() => modal.hide()}
              className={cn(
                "text-sidebar-foreground data-[state=active]:bg-sidebar-accent hover:bg-sidebar-accent",
              )}
              variant="ghost"
              size="icon"
            >
              <X />
            </Button>
          </header>
          <TabsList className="md:h-full not-md:h-max w-full not-md:gap-2 not-md:border-t not-md:border-b md:flex-col not-md:flex-wrap align-start justify-start md:border-r rounded-none md:py-0 p-1.5 items-start bg-sidebar">
            <div className="not-md:hidden px-0.5 py-2">
              <Button
                onClick={() => modal.hide()}
                className={cn(
                  "text-sidebar-foreground data-[state=active]:bg-sidebar-accent hover:bg-sidebar-accent",
                )}
                variant="ghost"
                size="icon"
              >
                <X />
              </Button>
            </div>
            {settingsItems.map((item) => (
              <Button
                key={item.id}
                asChild
                variant="ghost"
                size={isMobile ? "sm" : "default"}
              >
                <TabsTrigger
                  className={cn(
                    "md:w-full justify-start !ring-0 !shadow-none",
                    "text-sidebar-foreground data-[state=active]:bg-sidebar-accent hover:bg-sidebar-accent",
                  )}
                  value={item.id}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </TabsTrigger>
              </Button>
            ))}
          </TabsList>

          {settingsItems.map((item) => (
            <TabsContent
              className="px-4 flex flex-col gap-4 pb-4"
              key={item.id}
              value={item.id}
            >
              <DialogHeader className="text-left">
                <DialogTitle>{item.label}</DialogTitle>
                {item.description && (
                  <DialogDescription>{item.description}</DialogDescription>
                )}
              </DialogHeader>
              <item.content />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
