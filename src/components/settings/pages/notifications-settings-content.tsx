"use client";

import { clientApi } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/primitives/button";
import { Spinner } from "@/components/ui/spinner";
import { Bell } from "lucide-react";
import type { NotificationChannel } from "@/server/notifications/types";

const channelLabels: Record<NotificationChannel, string> = {
  email: "Email",
  in_app: "In-App",
  push: "Push",
};

const typeLabels: Record<string, string> = {
  "shift.cancelled": "Shift Cancelled",
  "coverage.requested": "Coverage Requested",
  "coverage.available": "Coverage Opportunity",
};

export function NotificationsSettingsContent() {
  const utils = clientApi.useUtils();

  const { data: preferences, isLoading } =
    clientApi.notification.preferences.useQuery();

  const setPreference = clientApi.notification.setPreference.useMutation({
    onSuccess: () => {
      void utils.notification.preferences.invalidate();
    },
  });

  const clearPreference = clientApi.notification.clearPreference.useMutation({
    onSuccess: () => {
      void utils.notification.preferences.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  // Group preferences by type
  const grouped = new Map<
    string,
    { type: string; channel: NotificationChannel; enabled: boolean; isOverride: boolean }[]
  >();
  for (const pref of preferences ?? []) {
    const existing = grouped.get(pref.type) ?? [];
    existing.push(pref);
    grouped.set(pref.type, existing);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="size-5" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose which notifications you receive and how they are delivered.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([type, channels]) => (
            <div key={type} className="space-y-3">
              <h4 className="text-sm font-medium">
                {typeLabels[type] ?? type}
              </h4>
              <div className="space-y-2">
                {channels.map((pref) => (
                  <div
                    key={`${pref.type}-${pref.channel}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`${pref.type}-${pref.channel}`}
                        className="text-sm"
                      >
                        {channelLabels[pref.channel] ?? pref.channel}
                      </Label>
                      {pref.isOverride && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          onClick={() =>
                            clearPreference.mutate({
                              type: pref.type,
                              channel: pref.channel,
                            })
                          }
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                    <Switch
                      id={`${pref.type}-${pref.channel}`}
                      checked={pref.enabled}
                      onCheckedChange={(checked) =>
                        setPreference.mutate({
                          type: pref.type,
                          channel: pref.channel,
                          enabled: checked,
                        })
                      }
                      disabled={
                        setPreference.isPending || clearPreference.isPending
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
