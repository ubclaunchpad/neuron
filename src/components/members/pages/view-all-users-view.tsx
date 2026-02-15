import { Avatar } from "@/components/primitives/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useImageUrl } from "@/lib/build-image-url";
import { hasPermission } from "@/lib/auth/extensions/permissions";
import { Role, UserStatus } from "@/models/interfaces";
import type { ListUser, User } from "@/models/user";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";
import NiceModal from "@ebay/nice-modal-react";
import AddIcon from "@public/assets/icons/add.svg";
import { Ban, MoreHorizontalIcon, Power } from "lucide-react";
import { CreateUserDialog } from "../create-user-dialog";
import { InviteUserDialog } from "../invite-user-dialog";
import { ListItem } from "../list";
import { StatusBadge } from "../status-badge";
import { UserProfileDialog } from "../user-profile-dialog";
import {
  ShellHeader,
  ShellSearchInput,
  UsersList,
  UsersViewShell,
} from "./users-view-shell";

export function ViewUsersView({ className }: { className?: string }) {
  const { user } = useAuth();
  const canInviteUsers = hasPermission({
    user,
    permission: { users: ["invite"] },
  });

  return (
    <UsersViewShell
      className={className}
      statusesToInclude={[UserStatus.active, UserStatus.inactive]}
    >
      <ShellHeader>
        <ShellSearchInput />

        <div className="flex items-center gap-2">
          {canInviteUsers && (
            <Button variant="outline" onClick={() => NiceModal.show(InviteUserDialog)}>
              <AddIcon />
              <span>Invite User</span>
            </Button>
          )}
          <Button onClick={() => NiceModal.show(CreateUserDialog)}>
            <AddIcon />
            <span>Add User</span>
          </Button>
        </div>
      </ShellHeader>

      <UsersList>
        {(user) => <ViewUserListItem key={user.id} user={user} />}
      </UsersList>
    </UsersViewShell>
  );
}

export function ViewUserListItem({ user: initialUser }: { user: ListUser }) {
  const { user: ownUser } = useAuth();
  const apiUtils = clientApi.useUtils();
  const { data: user } = clientApi.user.byId.useQuery(
    { userId: initialUser.id },
    {
      staleTime: 0,
      initialData: initialUser as User,
      placeholderData: (prev) => prev,
    },
  );

  const avatarSrc = useImageUrl(user.image);

  const { mutate: activateMutation } = clientApi.user.activate.useMutation({
    onSuccess: async ({ userId }) => {
      await apiUtils.user.byId.invalidate({ userId });
    },
  });
  const { mutate: deactivateMutation } = clientApi.user.deactivate.useMutation({
    onSuccess: async ({ userId }) => {
      await apiUtils.user.byId.invalidate({ userId });
    },
  });

  return (
    <ListItem
      leadingContent={
        <Avatar
          src={avatarSrc}
          fallbackText={user.name}
          className="size-10.5"
        />
      }
      mainContent={
        <>
          <div className="flex gap-2 items-center">
            <span className="truncate">
              {user.name} {user.lastName}
            </span>
            <Badge variant="outline">{Role.getName(user.role)}</Badge>
          </div>
          <span className="block text-sm text-muted-foreground truncate">
            {user.email}
          </span>
        </>
      }
      endContent={
        <>
          <StatusBadge
            status={user.status}
            className="not-xs:hidden self-center"
          />

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Open menu" size="icon-sm">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60" align="end">
              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    void NiceModal.show(UserProfileDialog, {
                      userId: user.id,
                      initialUser: initialUser,
                    });
                  }}
                >
                  View Profile...
                </DropdownMenuItem>
                <DropdownMenuItem>Reset Password</DropdownMenuItem>
                {ownUser?.id !== user.id && (
                  <>
                    <DropdownMenuSeparator />
                    {user.status === "active" ? (
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => deactivateMutation({ userId: user.id })}
                      >
                        <Ban />
                        <span>Disable Neuron Access</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onSelect={() => activateMutation({ userId: user.id })}
                      >
                        <Power />
                        <span>Re-enable Neuron Access</span>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );
}
