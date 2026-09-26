"use client";

import { useState } from "react";
import { clientApi } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

function NotificationsSettingsSkeleton() {
  return (
    <Card aria-busy="true" aria-label="Loading notification settings">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full max-w-sm" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsSettingsContent() {
  const utils = clientApi.useUtils();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const { data: preferences, isLoading } =
    clientApi.notification.preferences.useQuery();

  const setPreference = clientApi.notification.setPreference.useMutation({
    onMutate: ({ type, channel }) => setPendingKey(`${type}:${channel}`),
    onSettled: () => {
      setPendingKey(null);
      void utils.notification.preferences.invalidate();
    },
  });

  if (isLoading) {
    return <NotificationsSettingsSkeleton />;
  }

  // Group by type, only show email channel preferences
  const emailPrefs = (preferences ?? []).filter(
    (pref) => pref.channel === "email",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Manage the emails you get about activity in Neuron. You&apos;ll always
          receive in-app notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="divide-y">
          {emailPrefs.map((pref) => {
            const key = `${pref.type}:${pref.channel}`;
            return (
              <div
                key={pref.type}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{pref.label}</p>
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
                  disabled={pendingKey === key}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
