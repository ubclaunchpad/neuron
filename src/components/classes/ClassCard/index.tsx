"use client";

import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { FallbackImage } from "@/components/utils/FallbackImage";
import { WithPermission } from "@/components/utils/WithPermission";
import type { ListClass } from "@/models/class";
import EditIcon from "@/public/assets/icons/edit.svg";
import { computeLiteralSchedule } from "@/utils/scheduleUtils";
import "./index.scss";

export function ClassCard({ classData }: { classData: ListClass }) {

  return (
    <Card>
      <WithPermission permissions={{ permission: { classes: ["update"] }}}>
        <Button className="class-card__button ghost small icon-only">
          <EditIcon/>
        </Button>
      </WithPermission>

      <FallbackImage className="class-card__image" src={classData.image} name={classData.name} />
      <div className="class-card__content">
        <strong className="class-card__name">{classData.name}</strong>
        <p className="class-card__schedule">
          {classData.schedules.map(schedule => (
            <span key={schedule.id}>{computeLiteralSchedule(schedule)}</span>
          ))}
        </p>
      </div>
    </Card>
  );
}
