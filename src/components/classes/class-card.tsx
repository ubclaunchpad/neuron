"use client";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { WithPermission } from "@/components/utils/with-permission";
import type { ListClass } from "@/models/class";
import { consolidateSchedules } from "@/utils/scheduleUtils";
import EditIcon from "@public/assets/icons/edit.svg";
import Link from "next/link";
import type { MouseEventHandler } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { TypographyRegBold, TypographySmall } from "../primitives/typography";

export function ClassCard({
  classData,
  onClick,
}: {
  classData: ListClass;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const schedules = consolidateSchedules(classData.schedules);

  return (
    <Card
      size="sm"
      className="relative has-[button[data-overlay]:hover]:bg-secondary/90 has-[button[data-overlay]:focus-visible]:ring-2 has-[button[data-overlay]:focus-visible]:ring-ring/50"
    >
      {/* Button that covers the entire card*/}
      <Button
        data-overlay
        unstyled
        aria-label={`Open ${classData.name}`}
        className="absolute inset-0 cursor-pointer"
        onClick={onClick}
      ></Button>

      {/* Edit button (prevents bubbling to main press area) */}
      <WithPermission permissions={{ permission: { classes: ["update"] } }}>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-6 top-6 z-10"
          asChild
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

      <CardContent className="flex flex-col gap-2">
        <Avatar className="aspect-square shrink-0 h-auto w-full rounded-md pointer-events-none">
          <AvatarImage
            src={classData.image ?? undefined}
            alt={classData.name}
            className="rounded-md object-cover"
          />
          <AvatarFallback className="rounded-md">
            {classData.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-start">
          <TypographySmall className="text-primary-muted mb-1">
            Level 2-4 (Placeholder)
          </TypographySmall>

          <TypographyRegBold>{classData.name}</TypographyRegBold>

          <TypographySmall>
            {schedules.slice(0, 2).map((schedule, idx) => (
              <span
                key={idx}
                className="after:mx-1 after:content-['·'] last:after:content-['']"
              >
                {schedule}
              </span>
            ))}
            {schedules.length > 2 && <span>+{schedules.length - 2} more</span>}
          </TypographySmall>
        </div>
      </CardContent>
    </Card>
  );
}
