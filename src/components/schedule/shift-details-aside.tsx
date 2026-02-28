"use client";

import {
  AsideBody,
  AsideContainer,
  AsideDescription,
  AsideField,
  AsideFieldContent,
  AsideFieldLabel,
  AsideHeader,
  AsideSection,
  AsideSectionContent,
  AsideTitle,
} from "@/components/aside";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserList } from "@/components/users/user-list";
import { clientApi } from "@/trpc/client";
import { Video } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { CancelShiftButton } from "./cancel-shift-button";
import { useSchedulePage } from "./schedule-page-context";
import { WithPermission } from "../utils/with-permission";
import { CheckInButton } from "./check-in-button";
import {
  ShiftStatus,
  type ListShiftWithPersonalStatus,
  type SingleShiftWithPersonalContext,
} from "@/models/shift";
import { RequestCoverageButton } from "./request-coverage-button";
import { ShiftStatusBadge } from "./shift-status-badge";

export function ShiftDetailsAside() {
  const { selectedShiftId, closeAside } = useSchedulePage();
  const { data: shift, isPending: isLoadingShift } =
    clientApi.shift.byId.useQuery(
      { shiftId: selectedShiftId ?? "" },
      {
        enabled: !!selectedShiftId,
        suspense: !!selectedShiftId,
        meta: { suppressToast: true },
      },
    );

  // Close aside if no shiftId is selected
  useEffect(() => {
    if (!selectedShiftId) {
      closeAside();
    }
  }, [selectedShiftId, closeAside]);

  if (isLoadingShift || !shift) {
    return <>Loading shift...</>;
  }

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
      <AsideHeader className="border-0">
        <AsideDescription>{day}</AsideDescription>
        <AsideDescription>
          {startTime} - {endTime}
        </AsideDescription>
        <AsideTitle>{shift.class.name}</AsideTitle>
      </AsideHeader>

      <Separator />

      <AsideBody>
        <AsideSection>
          <AsideSectionContent>
            <AsideField inline>
              <AsideFieldLabel>Status</AsideFieldLabel>
              <AsideFieldContent className="w-auto">
                <ShiftStatusBadge
                  status={shift.status}
                  className="w-fit pointer-events-none"
                />
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>

          <AsideSectionContent>
            <AsideField inline>
              <AsideFieldLabel>
                Instructor{instructors.length === 1 ? "" : "s"}
              </AsideFieldLabel>
              <AsideFieldContent>
                <UserList
                  users={instructors.map((instructor) => ({
                    id: instructor.id,
                    fullName: `${instructor.name} ${instructor.lastName}`,
                    email: instructor.email,
                    image: "image" in instructor ? instructor.image : null,
                  }))}
                  emptyLabel="No instructors assigned"
                />
              </AsideFieldContent>
            </AsideField>

            <AsideField inline>
              <AsideFieldLabel>Volunteers</AsideFieldLabel>
              <AsideFieldContent>
                <UserList
                  users={volunteers.map((volunteer) => ({
                    id: volunteer.id,
                    fullName: `${volunteer.name} ${volunteer.lastName}`,
                    email: volunteer.email,
                    image: "image" in volunteer ? volunteer.image : null,
                    subtitle:
                      "coveringFor" in volunteer && volunteer.coveringFor
                        ? `Covering for ${volunteer.coveringFor.name} ${volunteer.coveringFor.lastName}`
                        : undefined,
                  }))}
                  emptyLabel="No volunteers assigned"
                />
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>

          <AsideSectionContent>
            <AsideField inline>
              <AsideFieldLabel>Meeting</AsideFieldLabel>
              <AsideFieldContent>
                {shift.class.meetingURL ? (
                  <Button asChild className="cursor-pointer" variant="outline">
                    <Link href={shift.class.meetingURL as Route}>
                      <Video /> Join Class
                    </Link>
                  </Button>
                ) : (
                  <span>No meeting link</span>
                )}
              </AsideFieldContent>
            </AsideField>

            <AsideField inline={false}>
              <AsideFieldLabel>Description</AsideFieldLabel>
              <AsideFieldContent className="text-sm">
                {shift.class.description ?? "No description available."}
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>
        </AsideSection>

        <Separator />

        <div className="flex gap-2">
          <WithPermission permissions={{ permission: { shifts: ["cancel"] } }}>
            <CancelShiftButton shift={shift} />
          </WithPermission>
          <WithPermission
            permissions={{ permission: { shifts: ["check-in"] } }}
          >
            <CheckInButton shift={shift as ListShiftWithPersonalStatus} />
            <RequestCoverageButton
              shift={shift as SingleShiftWithPersonalContext}
            />
          </WithPermission>
        </div>
      </AsideBody>
    </AsideContainer>
  );
}
