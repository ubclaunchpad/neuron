"use client";

import { WithPermission } from "@/components/utils/with-permission";
import { usePermission } from "@/hooks/use-permission";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";

import { useImageUrl } from "@/lib/build-image-url";
import { GeneralProfileFormProvider } from "./general/general-form-provider";
import { GeneralProfileSection } from "./general/general-profile-section";
import { useGeneralProfileSubmit } from "./general/hooks/use-general-profile-submit";

import { VolunteerProfileFormProvider } from "./volunteer/volunteer-form-provider";
import { VolunteerProfileSection } from "./volunteer/volunteer-profile-section";
import { useVolunteerProfileSubmit } from "./volunteer/hooks/use-volunteer-profile-submit";
import type { Volunteer } from "@/models/volunteer";
import type { VolunteerProfileSchemaType } from "./volunteer/schema";
import type { User } from "@/lib/auth";
import type { GeneralProfileSchemaType } from "./general/schema";

function volunteerProfileToFormValues(
  volunteer: Volunteer,
): VolunteerProfileSchemaType {
  return {
    preferredName: volunteer?.preferredName ?? "",
    pronouns: volunteer?.pronouns ?? "",
    bio: volunteer?.bio ?? "",
    city: volunteer?.city ?? "",
    province: volunteer?.province ?? "",
  };
}

function generalProfileToFormValues(
  user: User,
  imageUrl?: string,
): GeneralProfileSchemaType {
  return {
    firstName: user.name ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    image: imageUrl ?? null,
  };
}

export function ProfileSettingsContent() {
  const { user } = useAuth();

  const hasVolunteerProfile = usePermission({
    permission: { "volunteer-profile": ["view"] },
  });
  const { data: volunteer } = clientApi.volunteer.byId.useQuery(
    { userId: user!.id },
    { enabled: !!user && hasVolunteerProfile },
  );

  const imageUrl = useImageUrl(user?.image);

  const { onSubmit: onGeneralSubmit, isPending: isGeneralPending } =
    useGeneralProfileSubmit();

  const { onSubmit: onVolunteerSubmit, isPending: isVolunteerPending } =
    useVolunteerProfileSubmit(user?.id ?? "");

  if (!user) return null;

  return (
    <WithPermission permissions={{ permission: { profile: ["update"] } }}>
      <div className="space-y-6">
        <GeneralProfileFormProvider
          initial={generalProfileToFormValues(user, imageUrl)}
          onSubmit={onGeneralSubmit}
        >
          <GeneralProfileSection
            fallbackName={user.name}
            isPending={isGeneralPending}
          />
        </GeneralProfileFormProvider>

        {hasVolunteerProfile && volunteer && (
          <VolunteerProfileFormProvider
            initial={volunteerProfileToFormValues(volunteer)}
            onSubmit={onVolunteerSubmit}
          >
            <VolunteerProfileSection isPending={isVolunteerPending} />
          </VolunteerProfileFormProvider>
        )}
      </div>
    </WithPermission>
  );
}
