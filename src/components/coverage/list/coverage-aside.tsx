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
import { CoverageRequestCategory, CoverageStatus } from "@/models/api/coverage";
import { useAuth } from "@/providers/client-auth-provider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCoveragePage } from "./coverage-page-context";
import { FillCoverageButton } from "@/components/coverage/primitives/fill-coverage-button";
import { WithdrawCoverageButton } from "@/components/coverage/primitives/withdraw-coverage-button";
import { Separator } from "@/components/ui/separator";
import { UserList } from "@/components/users/user-list";
import { Button } from "@/components/ui/button";
import { clientApi } from "@/trpc/client";
import { SkeletonAside } from "@/components/ui/skeleton";

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
  const { selectedCoverageId, goToNext, goToPrev, hasNext, hasPrev } =
    useCoveragePage();
  const { user } = useAuth();

  const { data: coverateRequestData, isLoading: isLoadingCoverageRequstData } =
    clientApi.coverage.byId.useQuery(
      { coverageRequestId: selectedCoverageId ?? "" },
      {
        enabled: !!selectedCoverageId,
        meta: { suppressToast: true },
      },
    );

  if (isLoadingCoverageRequstData || !coverateRequestData) {
    return <SkeletonAside />;
  }

  const shiftDate: string = dateFormatter.format(
    coverateRequestData.shift.startAt,
  );
  const shiftStartTime: string = timeFormatter.format(
    coverateRequestData.shift.startAt,
  );
  const shiftEndTime: string = timeFormatter.format(
    coverateRequestData.shift.endAt,
  );
  const requestedOn: string = dateFormatter.format(
    coverateRequestData.requestedAt,
  );

  const instructors = coverateRequestData.shift.instructors;
  const requestingVolunteer = coverateRequestData.requestingVolunteer;
  const volunteers = coverateRequestData.shift.volunteers;

  return (
    <AsideContainer>
      <AsideHeader className="border-0">
        <AsideDescription>{shiftDate}</AsideDescription>
        <AsideDescription>
          {shiftStartTime} - {shiftEndTime}
        </AsideDescription>
        <AsideTitle>{coverateRequestData.shift.class.name}</AsideTitle>
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
          </AsideSectionContent>

          <AsideSectionContent>
            <AsideField inline>
              <AsideFieldLabel>Volunteers</AsideFieldLabel>
              <AsideFieldContent>
                <UserList
                  users={volunteers.map((volunteer) => ({
                    id: volunteer.id,
                    fullName: `${volunteer.name} ${volunteer.lastName}`,
                    email: volunteer.email,
                    image: "image" in volunteer ? volunteer.image : null,
                  }))}
                  emptyLabel="No volunteers assigned"
                />
              </AsideFieldContent>
            </AsideField>
          </AsideSectionContent>

          <AsideSectionContent>
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
                    },
                  ]}
                  emptyLabel="Requesting volunteer not found"
                />
              </AsideFieldContent>
            </AsideField>

            <AsideField inline>
              <AsideFieldLabel>Requested on</AsideFieldLabel>
              <AsideFieldContent>{requestedOn}</AsideFieldContent>
            </AsideField>

            <WithPermission
              permissions={{ permission: { shifts: ["view-all"] } }}
            >
              {"category" in coverateRequestData && (
                <AsideField inline>
                  <AsideFieldLabel>Reason for Request</AsideFieldLabel>
                  <AsideFieldContent className="w-auto font-semibold">
                    {CoverageRequestCategory.getName(
                      coverateRequestData.category,
                    )}
                  </AsideFieldContent>
                </AsideField>
              )}

              {"details" in coverateRequestData &&
                coverateRequestData.details !== "" && (
                  <AsideField inline>
                    <AsideFieldLabel>Reason Details</AsideFieldLabel>
                    <AsideFieldContent className="w-auto">
                      {coverateRequestData.details}
                    </AsideFieldContent>
                  </AsideField>
                )}

              {"comments" in coverateRequestData &&
                coverateRequestData.comments && (
                  <AsideField inline>
                    <AsideFieldLabel>Additional Comments</AsideFieldLabel>
                    <AsideFieldContent className="w-auto">
                      {coverateRequestData.comments}
                    </AsideFieldContent>
                  </AsideField>
                )}
            </WithPermission>
          </AsideSectionContent>

          <Separator />

          <AsideSectionContent>
            {coverateRequestData.status === CoverageStatus.open && (
              <>
                {user?.id !== coverateRequestData.requestingVolunteer.id && (
                  <WithPermission
                    permissions={{ permission: { coverage: ["fill"] } }}
                  >
                    <FillCoverageButton item={coverateRequestData} />
                  </WithPermission>
                )}

                {user?.id === coverateRequestData.requestingVolunteer.id && (
                  <WithPermission
                    permissions={{ permission: { coverage: ["request"] } }}
                  >
                    <WithdrawCoverageButton item={coverateRequestData} />
                  </WithPermission>
                )}
              </>
            )}

            {coverateRequestData.status !== CoverageStatus.open && (
              <Badge
                variant="colored"
                color={
                  coverateRequestData.status === CoverageStatus.resolved
                    ? "success"
                    : "default"
                }
              >
                {coverateRequestData.status === CoverageStatus.resolved
                  ? "Fulfilled"
                  : "Withdrawn"}
              </Badge>
            )}
          </AsideSectionContent>

          <AsideFooter>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={!hasPrev}
                onClick={() => goToPrev()}
              >
                <ChevronLeft></ChevronLeft>
              </Button>
              <Button
                variant="ghost"
                disabled={!hasNext}
                onClick={() => goToNext()}
              >
                <ChevronRight></ChevronRight>
              </Button>
            </div>
          </AsideFooter>
        </AsideSection>
      </AsideBody>
    </AsideContainer>
  );
}
