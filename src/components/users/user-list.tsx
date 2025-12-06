import { Avatar } from "@/components/primitives/avatar";

export type UserListItem = {
  id: string;
  fullName: string;
  email?: string | null;
  image?: string | null;
  subtitle?: string | null;
};

export function UserList({
  users,
  emptyLabel = "No users assigned",
}: {
  users: UserListItem[];
  emptyLabel?: string;
}) {
  if (!users.length) {
    return <span>{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div key={user.id} className="inline-flex items-start gap-2">
          <Avatar
            className="rounded-[0.25rem] self-stretch"
            src={user.image}
            fallbackText={user.fullName}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium leading-none mb-0.5">
              {user.fullName}
            </div>
            {user.email && (
              <div className="truncate text-xs text-muted-foreground">
                {user.email}
              </div>
            )}
            {user.subtitle && (
              <div className="truncate text-xs text-muted-foreground">
                {user.subtitle}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
