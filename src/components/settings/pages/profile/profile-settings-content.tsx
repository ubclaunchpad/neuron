"use client";

import { Role } from "@/models/interfaces";
import { WithPermission } from "@/components/utils/with-permission";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";

import { Spinner } from "@/components/ui/spinner";
import { useImageUrl } from "@/lib/build-image-url";

import { GeneralProfileFormProvider } from "./general/general-form-provider";
import { GeneralProfileSection } from "./general/general-profile-section";
import { useGeneralProfileSubmit } from "./general/hooks/use-general-profile-submit";

import { VolunteerProfileFormProvider } from "./volunteer/volunteer-form-provider";
import { VolunteerProfileSection } from "./volunteer/volunteer-profile-section";
import { useVolunteerProfileSubmit } from "./volunteer/hooks/use-volunteer-profile-submit";

export function ProfileSettingsContent() {
  const { user } = useAuth();

  const isVolunteer = user?.role === Role.volunteer;
  const { data: volunteer } = clientApi.volunteer.byId.useQuery(
    { userId: user!.id },
    { enabled: !!user && isVolunteer },
  );

  const imageUrl = useImageUrl(user?.image) ?? null;

  const { onSubmit: onGeneralSubmit, isPending: isGeneralPending } =
    useGeneralProfileSubmit();

  const { onSubmit: onVolunteerSubmit, isPending: isVolunteerPending } =
    useVolunteerProfileSubmit(user?.id ?? "");

  if (!user || (isVolunteer && !volunteer)) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const generalInitial = {
    firstName: user.name ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    image: imageUrl,
  };

  const volunteerInitial = {
    preferredName: volunteer?.preferredName ?? "",
    pronouns: volunteer?.pronouns ?? "",
    bio: volunteer?.bio ?? "",
    city: volunteer?.city ?? "",
    province: volunteer?.province ?? "",
  };

  return (
    <WithPermission permissions={{ permission: { profile: ["update"] } }}>
      <div className="space-y-6">
        <GeneralProfileFormProvider
          initial={generalInitial}
          onSubmit={onGeneralSubmit}
        >
          <GeneralProfileSection
            fallbackName={user.name ?? "U"}
            isPending={isGeneralPending}
          />
        </GeneralProfileFormProvider>

        {isVolunteer && (
          <VolunteerProfileFormProvider
            initial={volunteerInitial}
            onSubmit={onVolunteerSubmit}
          >
            <VolunteerProfileSection isPending={isVolunteerPending} />
          </VolunteerProfileFormProvider>
        )}
      </div>
    </WithPermission>
  );
}
