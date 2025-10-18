"use client";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { WithPermission } from "@/components/utils/with-permission";
import type { ListClass } from "@/models/class";
import { consolidateSchedules } from "@/utils/scheduleUtils";
import EditIcon from "@public/assets/icons/edit.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import Link from "next/link";
import type { MouseEventHandler } from "react";
import { TypographyReg, TypographyRegBold, TypographySmall } from "../primitives/typography";

export function ClassCard({
  classData,
  onClick,
}: {
  classData: ListClass;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const schedules = consolidateSchedules(classData.schedules);
  const classInitials = classData.name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();


  return (
    <Card size="sm">
      <Button
        unstyled
        className="h-auto w-full cursor-pointer p-0 text-left"
        onClick={onClick}
      >
        {/* Edit button (prevents bubbling to main press area) */}
        <WithPermission permissions={{ permission: { classes: ["update"] } }}>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-4 z-10"
          >
            <Link
              href={{
                pathname: "/classes/edit",
                query: { class: classData.id },
              }}
            >
              <EditIcon className="size-4" />
            </Link>
          </Button>
        </WithPermission>

        <CardContent>
          <Avatar className="aspect-square h-auto w-full rounded-md">
            <AvatarImage
              src={classData.image ?? undefined}
              alt={classData.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-md">
              {classInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-start gap-1">
            <TypographySmall className="text-primary-muted">
              Level 2-4 (Placeholder)
            </TypographySmall>

            <TypographyRegBold>
              {classData.name}
            </TypographyRegBold>

            <TypographyReg>
              {schedules.slice(0, 2).map((schedule, idx) => (
                <span
                  key={idx}
                  className="after:mx-1 after:content-['·'] last:after:content-['']"
                >
                  {schedule}
                </span>
              ))}
              {schedules.length > 2 && (
                <span>+{schedules.length - 2} more</span>
              )}
            </TypographyReg>
          </div>
        </CardContent>
      </Button>
    </Card>
  );
}
