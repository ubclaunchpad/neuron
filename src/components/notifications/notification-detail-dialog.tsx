"use client";

import { ExternalLink } from "lucide-react";
import type { ListNotification } from "@/models/notification";
import { Button } from "@/components/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { timeAgo } from "./utils";

interface NotificationDetailDialogProps {
  notification: ListNotification;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (url: string) => void;
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onNavigate,
}: NotificationDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {timeAgo(new Date(notification.createdAt))}
          </p>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {notification.body}
        </p>
        {notification.linkUrl && (
          <Button
            variant="outline"
            size="sm"
            startIcon={<ExternalLink />}
            onClick={() => onNavigate(notification.linkUrl!)}
          >
            Go to page
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
