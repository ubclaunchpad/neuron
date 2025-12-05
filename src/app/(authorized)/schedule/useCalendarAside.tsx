"use client";

import React from "react";
import {
  AsideContainer,
  AsideHeader,
  AsideTitle,
  AsideDescription,
  AsideBody,
  AsideSection,
} from "@/components/aside";
import "./page.scss";
import { Button } from "@/components/primitives/button";
import Link from "next/link";
import { Video } from "lucide-react";
import type { RouterOutputs } from "@/trpc/client";
import type { Route } from "next";

type SingleShift = RouterOutputs["shift"]["byId"];

export interface CalendarAsideProps {
  shift?: SingleShift;
}

export function CalendarAside({ shift }: CalendarAsideProps) {
  if (!shift) return null;

  const startAt =
    shift.startAt instanceof Date ? shift.startAt : new Date(shift.startAt);
  const endAt =
    shift.endAt instanceof Date ? shift.endAt : new Date(shift.endAt);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const day = startAt.toLocaleDateString("en-US", dateOptions);
  const startTime = startAt.toLocaleTimeString("en-US", timeOptions);
  const endTime = endAt.toLocaleTimeString("en-US", timeOptions);

  const instructors = "instructors" in shift ? shift.instructors : [];
  const volunteers = "volunteers" in shift ? shift.volunteers : [];

  return (
    <AsideContainer>
      <AsideHeader className="border-0 pb-0">
        <AsideDescription>{day}</AsideDescription>
        <AsideDescription>
          {startTime} - {endTime}
        </AsideDescription>
        <AsideTitle>{shift.class.name}</AsideTitle>
      </AsideHeader>

      <AsideBody>
        <AsideSection className="grid grid-cols-2 gap-4">
          <div className="aside-label">Status</div>
          <div>{shift.canceled ? "Canceled" : "Scheduled"}</div>

          <div className="aside-label">
            Instructor{instructors.length === 1 ? "" : "s"}
          </div>
          <div className="space-y-2">
            {instructors.map((instructor) => (
              <div key={instructor.id}>
                {instructor.name} {instructor.lastName}
                {instructor.email && (
                  <div className="text-xs text-muted-foreground">
                    {instructor.email}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="aside-label">
            Volunteer{volunteers.length === 1 ? "" : "s"}
          </div>
          <div className="space-y-2">
            {volunteers.map((volunteer) => (
              <div key={volunteer.id}>
                {volunteer.name} {volunteer.lastName}
                {"coveringFor" in volunteer && volunteer.coveringFor && (
                  <div className="text-xs text-muted-foreground">
                    Covering for {volunteer.coveringFor.name}{" "}
                    {volunteer.coveringFor.lastName}
                  </div>
                )}
              </div>
            ))}
          </div>

          {shift.class.meetingURL && (
            <>
              <div className="aside-label">Meeting Link</div>
              <Button asChild className="cursor-pointer" variant="outline">
                <Link href={shift.class.meetingURL as Route}>
                  <Video /> Join Class
                </Link>
              </Button>
            </>
          )}
        </AsideSection>
        <AsideSection>
          <div>Description</div>
          <div className="text-sm text-muted-foreground">
            {shift.class.description ?? "No description available."}
          </div>
        </AsideSection>
      </AsideBody>
    </AsideContainer>
  );
}
