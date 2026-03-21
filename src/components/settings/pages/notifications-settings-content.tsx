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
import { Button } from "@/components/primitives/button";
import { Spinner } from "@/components/ui/spinner";
import { Bell } from "lucide-react";

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

  // Group by type, only show email channel preferences
  const emailPrefs = (preferences ?? []).filter(
    (pref) => pref.channel === "email",
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="size-5" />
          <CardTitle>Email notifications</CardTitle>
        </div>
        <CardDescription>
          Manage the emails you get about activity in Neuron. You&apos;ll always
          receive in-app notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {emailPrefs.map((pref) => (
            <div
              key={pref.type}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{pref.label}</p>
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
                <p className="text-sm text-muted-foreground">
                  {pref.description}
                </p>
              </div>
              <Switch
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
      </CardContent>
    </Card>
  );
}
