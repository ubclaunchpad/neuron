"use client";

import React from "react";
import type { Shift } from "@/models/shift";
import {
  AsideContainer,
  AsideHeader,
  AsideTitle,
  AsideDescription,
  AsideBody,
  AsideSection,
} from "@/components/aside";
import "./page.scss";

export interface CalendarAsideProps {
  shift?: Shift;
}

export function CalendarAside({ shift }: CalendarAsideProps) {
  if (!shift) return null;

  // e.g. Friday October 25
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };

  // e.g. 11:30 AM
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  
  const day = shift.startAt.toLocaleDateString("en-US", dateOptions);
  const startTime = shift.startAt.toLocaleTimeString("en-US", timeOptions);
  const endTime = shift.endAt.toLocaleTimeString("en-US", timeOptions);

  return (
    <AsideContainer>
      <AsideHeader className="border-0 pb-0">
        <AsideDescription>
          {day}
        </AsideDescription>
        <AsideDescription>
          {startTime} - {endTime}
        </AsideDescription>
        <AsideTitle>{shift.class.name}</AsideTitle>
      </AsideHeader>

      <AsideBody>
        <AsideSection className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="aside-label">Status</div><div>test</div>

            {/* Instructor(s) */}
            <div className="aside-label">{"Instructor" + (shift.schedule.instructors.length > 1 ? "s" : "")}</div>
            <div>
                {shift.schedule.instructors.map(instructor => 
                    <div key={instructor.id} className="mb-3">
                        {/* TODO: add image for instructor */}
                        {instructor.name} {instructor.lastName}
                        <div className="text-xs">{instructor.email}</div>
                    </div>)}
            </div>
            
            {/* Volunteer(s) */}
            <div className="aside-label">Volunteers</div>
            <div>
                {shift.volunteers.map(volunteer => 
                    <div key={volunteer.id} className="mb-3">
                        {/* TODO: add images for volunteers */}
                        {volunteer.name} {volunteer.lastName}
                    </div>
                )}
            </div>

            {/* Zoom Link */}
            <div className="aside-label">Zoom link</div><div>test</div>
        </AsideSection>
        <AsideSection>
            <div>Description</div>
            <div>A full-body workout focused on improving balance, strength, and postural alignment for those that typically require a walking aid or need support to balance. Participants are encouraged to stand by holding onto a chair for balance support, however, seated options are always offered. Dumbbells or other hand weights are encouraged but not</div>
        </AsideSection>
      </AsideBody>
    </AsideContainer>
  );
}
