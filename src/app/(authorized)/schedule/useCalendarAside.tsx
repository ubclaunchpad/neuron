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
        <AsideSection>
            Test
        </AsideSection>
        <AsideSection>
            Test
        </AsideSection>
      </AsideBody>
    </AsideContainer>
  );
}
