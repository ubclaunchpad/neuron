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
  AsideFooter,
} from "@/components/aside";
import { Badge } from "@/components/ui/badge";
import { WithPermission } from "@/components/utils/with-permission";
import { CoverageStatus } from "@/models/api/coverage";
import { useAuth } from "@/providers/client-auth-provider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCoveragePage } from "./coverage-page-context";
import { FillCoverageButton } from "./fill-coverage-button";
import { WithdrawCoverageButton } from "./withdraw-coverage-button";
import { useEffect } from "react";
import { Separator } from "@radix-ui/react-separator";
import { UserList } from "@/components/users/user-list";
import { Button } from "@/components/ui/button";

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
  const { selectedItem, closeAside, goToNext, goToPrev } = useCoveragePage();
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedItem) closeAside();
  }, [selectedItem, closeAside]);

  if (!selectedItem) return null;

  const shiftDate: string = dateFormatter.format(selectedItem.shift.startAt);
  const shiftStartTime: string = timeFormatter.format(
    selectedItem.shift.startAt,
  );
  const shiftEndTime: string = timeFormatter.format(selectedItem.shift.endAt);

  const instructors = selectedItem.shift.instructors;
  const requestingVolunteer = selectedItem.requestingVolunteer;

  return (
    <AsideContainer>
      <AsideHeader className="border-0">
        <AsideDescription>{shiftDate}</AsideDescription>
        <AsideDescription>
          {shiftStartTime + "-" + shiftEndTime}
        </AsideDescription>
        <AsideTitle>{selectedItem.shift.class.name}</AsideTitle>
      </AsideHeader>

      <Separator />

      <AsideBody>
        <AsideSection>
          <AsideSectionContent>
            <AsideField inline>
              <AsideFieldLabel>
                Instructor{instructors.length === 1 ? "" : "s"}
              </AsideFieldLabel>
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
                <UserList
                  users={[
                    {
                      id: requestingVolunteer.id,
                      fullName: `${requestingVolunteer.name} ${requestingVolunteer.lastName}`,
                      email: requestingVolunteer.email,
                      image:
                        "image" in requestingVolunteer
                          ? requestingVolunteer.image
                          : null,
                      subtitle: undefined,
                    },
                  ]}
                  emptyLabel="Requesting volunteer not found"
                />
              </AsideFieldContent>
            </AsideField>

            {/* Reason fields only present for admin view (ListCoverageRequestWithReason) */}
            {"details" in selectedItem && selectedItem.details !== "" && (
              <AsideField inline>
                <AsideFieldLabel>Reason for request</AsideFieldLabel>
                <AsideFieldContent className="w-auto">
                  {selectedItem.details}
                </AsideFieldContent>
              </AsideField>
            )}

            {"comments" in selectedItem && selectedItem.comments && (
              <AsideField inline>
                <AsideFieldLabel>Request Details</AsideFieldLabel>
                <AsideFieldContent className="w-auto">
                  {selectedItem.comments}
                </AsideFieldContent>
              </AsideField>
            )}

            {selectedItem.status === CoverageStatus.open && (
              <div className="flex gap-2">
                {user?.id !== selectedItem.requestingVolunteer.id && (
                  <WithPermission
                    permissions={{ permission: { coverage: ["fill"] } }}
                  >
                    <FillCoverageButton
                      item={selectedItem}
                      className="w-full"
                    />
                  </WithPermission>
                )}

                {user?.id === selectedItem.requestingVolunteer.id && (
                  <WithPermission
                    permissions={{ permission: { coverage: ["request"] } }}
                  >
                    <WithdrawCoverageButton
                      item={selectedItem}
                      className="w-full"
                    />
                  </WithPermission>
                )}
              </div>
            )}

            {selectedItem.status !== CoverageStatus.open && (
              <Badge
                variant="colored"
                color={
                  selectedItem.status === CoverageStatus.resolved
                    ? "success"
                    : "default"
                }
              >
                {selectedItem.status === CoverageStatus.resolved
                  ? "Fulfilled"
                  : "Withdrawn"}
              </Badge>
            )}

            <AsideFooter>
              <div className="flex-row">
                <Button variant="ghost" onClick={() => goToPrev()}>
                  <ChevronLeft></ChevronLeft>
                </Button>
                <Button variant="ghost" onClick={() => goToNext()}>
                  <ChevronRight></ChevronRight>
                </Button>
              </div>
            </AsideFooter>
          </AsideSectionContent>
        </AsideSection>
      </AsideBody>
    </AsideContainer>
  );
}
