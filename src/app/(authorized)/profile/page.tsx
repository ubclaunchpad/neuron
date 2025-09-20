"use client";

import { PageLayout } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { Button } from "@/components/primitives/Button";
import { AvailabilityGrid } from "@/components/profile/AvailabilityGrid";
import { authClient } from "@/lib/auth/client";
import { Role } from "@/models/interfaces";
import { useAuth } from "@/providers/client-auth-provider";
import LogOutIcon from "@public/assets/icons/log-out.svg";
import "./page.scss";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <PageLayout
        title="My Profile"
      >
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
        
        <span>Welcome back, {user?.name}</span>

        <AvailabilityGrid
          availability={
            user?.role === Role.volunteer ? user.availability ?? "" : ""
          }
          onSave={(availability) => {
            //  updateMutation.mutate({ availability });
          }}
        />
      </PageLayout>
    </>
  );
}
