"use client";

import { WithPermission } from "@/components/utils/with-permission";
import { useAuth } from "@/providers/client-auth-provider";
import { clientApi } from "@/trpc/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/primitives/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

import { ProfileFormProvider } from "./profile-form-provider";
import { ProfileGeneralSection } from "./content/profile-general-section";
import { useProfileUpsert } from "./hooks/use-profile-upsert";
import { getImageUrlFromKey } from "@/lib/build-image-url";

export function ProfileSettingsContent() {
  const { user } = useAuth();
  const { data: volunteer } = clientApi.volunteer.byId.useQuery(
    { userId: user!.id },
    { enabled: !!user }
  );

  const { onSubmit, successMessage, isPending } =
    useProfileUpsert(user?.id ?? "");

  if (!user || !volunteer) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const initial = {
    firstName: user?.name ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    preferredName: volunteer?.preferredName ?? "",
    pronouns: volunteer?.pronouns ?? "",
    bio: volunteer?.bio ?? "",
    city: volunteer?.city ?? "",
    province: volunteer?.province ?? "",
    image: getImageUrlFromKey(volunteer?.image) ?? null,
  };

  return (
    <WithPermission permissions={{ permission: { profile: ["update"] } }}>
      <ProfileFormProvider initial={initial} onSubmit={onSubmit}>

        <div className="space-y-4">
            {successMessage && (
                <Alert variant="success" role="status" aria-live="polite">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4">
                <ProfileGeneralSection fallbackName={user?.name ?? "U"} />

                <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? <><Spinner /> Saving...</> : "Save Changes"}
                </Button>
                </div>
            </CardContent>
            </Card>
        </div>
        
      </ProfileFormProvider>
    </WithPermission>
  );
}
