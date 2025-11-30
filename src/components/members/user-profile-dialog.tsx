"use client";

import { Avatar } from "@/components/primitives/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getImageUrlFromKey } from "@/lib/build-image-url";
import { Role } from "@/models/interfaces";
import type { ListUser, User } from "@/models/user";
import { clientApi } from "@/trpc/client";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ReadonlyField } from "../ui/field";
import { StatusBadge } from "./status-badge";

type UserProfileDialogProps = {
  userId: string;
  initialUser: ListUser;
};

export const UserProfileDialog = NiceModal.create(
  ({ userId, initialUser }: UserProfileDialogProps) => {
    const modal = useModal();

    const { data: user } = clientApi.user.byId.useQuery(
      { userId },
      {
        initialData: initialUser as User,
        placeholderData: (prev) => prev,
      },
    );

    if (!user) return null;

    const joinedDate =
      user.createdAt &&
      new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => (open ? modal.show() : modal.hide())}
      >
        <DialogContent className="max-w-md flex flex-col">
          <DialogHeader className="items-center text-center">
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            <Avatar
              src={getImageUrlFromKey(user.image)}
              fallbackText={`${user.name} ${user.lastName}`}
              className="size-22"
            />

            <div className="space-y-1 text-center">
              <p className="text-base font-semibold">
                {user.name} {user.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <ReadonlyField label="Role">
              <Badge variant="outline">{Role.getName(user.role)}</Badge>
            </ReadonlyField>

            <ReadonlyField label="Status">
              <StatusBadge status={user.status} />
            </ReadonlyField>

            <ReadonlyField label="Email address">
              <span className="truncate">{user.email}</span>
            </ReadonlyField>

            <ReadonlyField label="Joined date">
              {joinedDate ?? "Not available"}
            </ReadonlyField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => modal.hide()}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
