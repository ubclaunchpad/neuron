"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WithPermission } from "@/components/utils/with-permission";
import { getImageUrlFromKey } from "@/lib/build-image-url";
import { formatScheduleRecurrence, formatTimeRange } from "@/lib/schedule-fmt";
import type { ListClass } from "@/models/class";
import EditIcon from "@public/assets/icons/edit.svg";
import Link from "next/link";
import type { MouseEventHandler } from "react";
import { Avatar } from "../../../primitives/avatar";
import { TypographyRegBold, TypographySmall } from "../../../ui/typography";

export function ClassCard({
  classData,
  onClickAction,
}: {
  classData: ListClass;
  onClickAction?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Card
      size="sm"
      className="max-w-full w-[258px] relative has-[button[data-overlay]:hover]:bg-secondary/90 has-[button[data-overlay]:focus-visible]:ring-2 has-[button[data-overlay]:focus-visible]:ring-ring/50"
    >
      {/* Button that covers the entire card*/}
      <Button
        data-overlay
        unstyled
        aria-label={`Open ${classData.name}`}
        className="absolute inset-0 cursor-pointer"
        onClick={onClickAction}
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
            <EditIcon />
          </Link>
        </Button>
      </WithPermission>

      <CardContent className="flex flex-col gap-2">
        <Avatar
          className="w-full"
          src={getImageUrlFromKey(classData.image)}
          fallbackText={classData.name}
        />

        <div className="flex flex-col items-start">
          <TypographySmall className="text-primary-muted mb-1">
            {classData.lowerLevel === classData.upperLevel ? (
              <>Level {classData.lowerLevel}</>
            ) : (
              <>
                Level {classData.lowerLevel}-{classData.upperLevel}
              </>
            )}
          </TypographySmall>

          <TypographyRegBold className="mb-0.5">
            {classData.name}
          </TypographyRegBold>

          <TypographySmall className="mb-4">
            {classData.schedules.length > 0 ? (
              <>
                {classData.schedules.slice(0, 2).map((schedule, idx) => (
                  <span
                    key={idx}
                    className="after:mx-1 after:content-['·'] last:after:content-['']"
                  >
                    {formatScheduleRecurrence(schedule.rule, {
                      style: "short",
                    })}{" "}
                    |{" "}
                    {formatTimeRange(
                      schedule.localStartTime,
                      schedule.localEndTime,
                    )}
                  </span>
                ))}
                {classData.schedules.length > 2 && (
                  <span>+{classData.schedules.length - 2} more</span>
                )}
              </>
            ) : (
              <>No schedules</>
            )}
          </TypographySmall>
        </div>
      </CardContent>
    </Card>
  );
}
