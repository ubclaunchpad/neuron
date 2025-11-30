import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Status } from "@/models/interfaces";
import type { ListUser } from "@/models/user";
import { clientApi } from "@/trpc/client";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { ListItem } from "../list";
import { StatusBadge } from "../status-badge";
import { ShellHeader, ShellSearchInput, UsersList, UsersViewShell } from "./users-view-shell";

export function VerifyUsersView({ className } : { className?: string }) {
  const [showRejected, setShowRejected] = useState(false);

  return (
    <UsersViewShell 
      className={className}
      statusesToInclude={[Status.unverified, ...(showRejected ? [Status.rejected] : [])]}
    >
      <ShellHeader>
        <ShellSearchInput/>

        <div className="flex items-center gap-3">
            <Checkbox id="show-rejected" checked={showRejected} onCheckedChange={(checked) => setShowRejected(!!checked)} />
            <Label htmlFor="show-rejected">Show Rejected</Label>
          </div>
      </ShellHeader>

      <UsersList>
        {(user) => <VerifyUserListItem key={user.id} user={user} />}
      </UsersList>
    </UsersViewShell>
  );
}

export function VerifyUserListItem({ user }: { user: ListUser }) {
  const apiUtils = clientApi.useUtils();

  const { mutate: verifyMutation } = clientApi.user.activate.useMutation({
    onSuccess: async ({ userId }) => {
      await apiUtils.user.byId.invalidate({ userId });
      await apiUtils.user.list.invalidate();
      await apiUtils.user.verificationCount.invalidate();
    },
  });
  const { mutate: rejectMutation } = clientApi.user.reject.useMutation({
    onSuccess: async ({ userId }) => {
      await apiUtils.user.byId.invalidate({ userId });
      await apiUtils.user.list.invalidate();
      await apiUtils.user.verificationCount.invalidate();
    },
  });

  return (
    <ListItem
      mainContent={
        <>
          <div className="flex gap-2 items-center">
            <span className="truncate">
              {user.name} {user.lastName}
            </span>
            <StatusBadge
              status={user.status}
              className="not-xs:hidden self-center"
            />
          </div>
          <span className="block text-sm text-muted-foreground truncate">
            {user.email}
          </span>
        </>
      }
      endContent={
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => verifyMutation({ userId: user.id })}>
            <Check/>
            <span>Verify</span>
          </Button>
          <Button variant="destructive-outline" size="sm" onClick={() => rejectMutation({ userId: user.id })}>
            <X/>
            <span>Deny</span>
          </Button>
        </div>
      }
    />
  );
}
