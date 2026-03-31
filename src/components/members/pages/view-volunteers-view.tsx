import { Avatar } from "@/components/primitives/avatar";
import { Button as PrimitivesButton } from "@/components/primitives/button";
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
import { Role, UserStatus } from "@/models/interfaces";
import type { ListUser, User } from "@/models/user";
import { useAuth } from "@/providers/client-auth-provider";
import NiceModal from "@ebay/nice-modal-react";
import { Ban, DownloadIcon, MoreHorizontalIcon, Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ListItem } from "../list";
import { StatusBadge } from "../status-badge";
import { UserProfileDialog } from "../user-profile-dialog";
import {
  ShellHeader,
  ShellSearchInput,
  useUsersViewShellContext,
  UsersList,
  UsersViewShell,
} from "./users-view-shell";
import { formatAvailabilityByDay } from "@/utils/availabilityUtils";
import { clientApi } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/types";

export function ViewVolunteersView({ className }: { className?: string }) {
  return (
    <UsersViewShell
      className={className}
      rolesToInclude={[Role.volunteer]}
      statusesToInclude={[UserStatus.active, UserStatus.inactive]}
    >
      <ShellHeader>
        <ShellSearchInput />
        <ExportAvailabilityButton />
      </ShellHeader>

      <UsersList>
        {(user) => <ViewVolunteerListItem key={user.id} user={user} />}
      </UsersList>
    </UsersViewShell>
  );
}

function ExportAvailabilityButton() {
  const { query } = useUsersViewShellContext();
  const [isExporting, setIsExporting] = useState(false);

  const exportQuery = clientApi.volunteer.exportAvailability.useQuery(
    { search: query },
    {
      enabled: false,
      refetchOnWindowFocus: false,
    },
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = await exportQuery.refetch();
      const volunteers = result.data ?? [];

      if (volunteers.length === 0) {
        toast.info("No volunteer data to export.");
        return;
      }

      const csv = buildVolunteerAvailabilityCsv(volunteers);
      const date = new Date().toISOString().split("T")[0];
      triggerCsvDownload(csv, `volunteers-availability-${date}.csv`);
      toast.success("Volunteer availability exported to CSV.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PrimitivesButton
      variant="outline"
      onClick={() => void handleExport()}
      pending={isExporting}
      startIcon={<DownloadIcon />}
    >
      Export as CSV
    </PrimitivesButton>
  );
}

type ExportVolunteer = RouterOutputs["volunteer"]["exportAvailability"][number];

const CSV_HEADERS = [
  "First Name",
  "Last Name",
  "Preferred Name",
  "Email",
  "Phone",
  "City",
  "Province",
  "Status",
  "Preferred Time Commitment (hrs)",
  "Availability",
] as const;

function buildVolunteerAvailabilityCsv(volunteers: ExportVolunteer[]): string {
  const rows = volunteers.map((volunteer) => [
    volunteer.name ?? "",
    volunteer.lastName ?? "",
    volunteer.preferredName ?? "",
    volunteer.email ?? "",
    volunteer.phoneNumber ?? "",
    volunteer.city ?? "",
    volunteer.province ?? "",
    volunteer.status ?? "",
    volunteer.preferredTimeCommitmentHours ?? "",
    formatAvailabilityByDay(volunteer.availability),
  ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
}

function escapeCsv(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Prevent CSV formula injection in spreadsheet applications
  if (/^[=+\-@]/.test(str)) {
    str = `\t${str}`;
  }
  if (/[",\n\t]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerCsvDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ViewVolunteerListItem({
  user: initialUser,
}: {
  user: ListUser;
}) {
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
