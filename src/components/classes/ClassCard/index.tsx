"use client";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/Card";
import { FallbackImage } from "@/components/utils/FallbackImage";
import { WithPermission } from "@/components/utils/WithPermission";
import type { ListClass } from "@/models/class";
import { consolidateSchedules } from "@/utils/scheduleUtils";
import EditIcon from "@public/assets/icons/edit.svg";
import type { PressEvent } from "react-aria";
import "./index.scss";

export function ClassCard({ 
  classData, 
  onPress 
}: { 
  classData: ListClass, 
  onPress?: (e: PressEvent) => void 
}) {
  const schedules = consolidateSchedules(classData.schedules);
  
  return (
    <Card asChild className="class-card" size="small">
      <Button unstyled onPress={onPress}>
        <WithPermission permissions={{ permission: { classes: ["update"] }}}>
          <Button 
            className="class-card__button secondary small icon-only"
            href={{
              pathname: "/classes/edit",
              query: { class: classData.id },
            }}
          >
            <EditIcon/>
          </Button>
        </WithPermission>

        <FallbackImage className="class-card__image" src={classData.image} name={classData.name} />
        <div className="class-card__content">
          <strong className="class-card__title">{classData.name}</strong>
          <p className="class-card__schedule">
            {schedules.slice(0, 2).map((schedule, index) => (
              <span className="class-card__schedule-item" key={index}>{schedule}</span>
            ))}
            {schedules.length > 2 && (
              <span className="class-card__schedule-item">+{schedules.length - 2} more</span>
            )}
          </p>
        </div>
      </Button>
    </Card>
  );
}
