"use client";

import { PageLayout } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { Button } from "@/components/primitives/Button";
import { WithPermission } from "@/components/utils/WithPermission";
import { AvailabilityGrid } from "@/components/profile/AvailabilityGrid";
import { ProfilePictureUpload } from "@/components/profile/ProfilePictureUpload";
import { authClient } from "@/lib/auth/client";
import { useAuth } from "@/providers/client-auth-provider";
import LogOutIcon from "@public/assets/icons/log-out.svg";
import "./page.scss";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <PageLayout>
        <PageLayout.Header>
          <PageTitle title="My Profile">
            <PageTitle.RightContent>
              <Button className="secondary" onPress={() => authClient.signOut()}>
                <LogOutIcon />
                <span>Log Out</span>
              </Button>
            </PageTitle.RightContent>
          </PageTitle>
        </PageLayout.Header>
        
        <div className="profile-content">
          <div className="profile-header">
            <ProfilePictureUpload
              currentImage={user?.image || undefined}
              name={user?.name}
              userId={user?.id}
              onImageChange={(file) => {
                // getPresignedUrlMutation.mutate({ fileType: file.type });
                // updateProfileImageMutation.mutate({ imageUrl: file.name, userId: user?.id });
                toast.success("Profile picture updated successfully");

              }}
            />
            <div className="profile-info">
              <h2>Welcome back, {user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          <WithPermission permissions={{ permission: { profile: ["update"] } }}>
            <div className="profile-actions">
              {/* <AvailabilityGrid
                availability={
                  user?.role === Role.volunteer ? user.availability ?? "" : ""
                }
                onSave={(availability) => {
                  //  updateMutation.mutate({ availability });
                }}
              /> */}
            </div>
          </WithPermission>
        </div>
      </PageLayout>
    </>
  );
}
