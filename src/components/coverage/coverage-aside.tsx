"use client"

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
import { useCoveragePage } from "./coverage-page-context";
import { useEffect } from "react";
import { clientApi } from "@/trpc/client";
import { Separator } from "@radix-ui/react-separator";
import type { User } from "@/models/user";
import type { Volunteer } from "@/models/volunteer";
import { UserList } from "@/components/users/user-list";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function CoverageAside() {
  const { selectedItem, closeAside } = useCoveragePage();

  useEffect(() => {
    if (!selectedItem) closeAside();
  }, [selectedItem, closeAside]);

  if (!selectedItem) return null;

  const shiftDate: string = dateFormatter.format(selectedItem.shift.startAt);
  const shiftStartTime: string = timeFormatter.format(selectedItem.shift.startAt);
  const shiftEndTime: string = timeFormatter.format(selectedItem.shift.endAt);

  const instructors: User[] = selectedItem.shift.instructors;
  const requestingVolunteer: Volunteer = selectedItem.requestingVolunteer;

  return (
    <AsideContainer>
      <AsideHeader className="border-0">
        <AsideDescription>{shiftDate}</AsideDescription>
        <AsideDescription>
          {shiftStartTime + '-' + shiftEndTime}
        </AsideDescription>
        <AsideTitle>{selectedItem.shift.class.name}</AsideTitle>
      </AsideHeader>

      <Separator />

      <AsideBody>
        <AsideSection>
          <AsideSectionContent>
            <AsideField inline>
              <AsideFieldLabel>Instructor{instructors.length === 1 ? "" : "s"}</AsideFieldLabel>
              <AsideFieldContent className="w-auto">
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

            {/* <AsideField inline>
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
            </AsideField> */}

            <AsideField inline>
              <AsideFieldLabel>Requested by</AsideFieldLabel>
              <AsideFieldContent>
                <UserList users={[{
                  id: requestingVolunteer.id,
                  fullName: `${requestingVolunteer.name} ${requestingVolunteer.lastName}`,
                  email: requestingVolunteer.email,
                  image: "image" in requestingVolunteer ? requestingVolunteer.image : null,
                  subtitle: undefined,
                }]}
                emptyLabel="Requesting volunteer not found" />
              </AsideFieldContent>
            </AsideField>

            <AsideField inline>
              <AsideFieldLabel>Requested on</AsideFieldLabel>
              <AsideFieldContent className="w-auto">
                REQUESTED ON HERE
              </AsideFieldContent>
            </AsideField>

            {/* Volunteers only see reason for their own requests */}
            {selectedItem.details !== '' && <AsideField inline>
              <AsideFieldLabel>Reason for request</AsideFieldLabel>
              <AsideFieldContent className="w-auto">
                {selectedItem.details}
              </AsideFieldContent>
            </AsideField>}

            {/* Volunteers only see reason details for their own requests */}
            {selectedItem.comments && <AsideField inline>
              <AsideFieldLabel>Request Details</AsideFieldLabel>
              <AsideFieldContent className="w-auto">
                {selectedItem.comments}
              </AsideFieldContent>
            </AsideField>}
          </AsideSectionContent>
        </AsideSection>
      </AsideBody>
    </AsideContainer>
  );
}