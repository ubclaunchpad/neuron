"use client";

import { WithPermission } from "@/components/utils/with-permission";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";
import { useState } from "react";

import { Spinner } from "@/components/ui/spinner";

import { AvailabilityFormProvider } from "./availability-form-provider";
import { AvailabilitySection } from "./availability-section";
import { useAvailabilitySubmit } from "./hooks/use-availability-submit";
import { AVAILABILITY_SLOTS } from "@/constants";
import type { AvailabilitySchemaInput } from "./schema";

const EMPTY_AVAILABILITY = "0".repeat(AVAILABILITY_SLOTS);

export function AvailabilitySettingsContent() {
  const { user } = useAuth();
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: volunteer } = clientApi.volunteer.byId.useQuery(
    { userId: user!.id },
    { enabled: !!user },
  );

  const { onSubmit, isPending } = useAvailabilitySubmit(
    user?.id ?? "",
    () => setHasUnsavedChanges(false),
  );

  if (!user || !volunteer) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const initial: AvailabilitySchemaInput = {
    availability: volunteer.availability ?? EMPTY_AVAILABILITY,
    preferredTimeCommitment:
      volunteer.preferredTimeCommitmentHours?.toString() ?? "0",
  };

  return (
    <WithPermission permissions={{ permission: { "volunteer-profile": ["update"] } }}>
      <AvailabilityFormProvider initial={initial} onSubmit={onSubmit}>
        <AvailabilitySection
          isPending={isPending}
          hasUnsavedChanges={hasUnsavedChanges}
          setHasUnsavedChanges={setHasUnsavedChanges}
        />
      </AvailabilityFormProvider>
    </WithPermission>
  );
}