"use client";

import { authClient } from "@/lib/auth/client";
import { useAuth } from "@/providers/client-auth-provider";
import { Button } from "../_components/primitives/Button";

export default function DashboardPage() {
  const { user } = useAuth();

  const signOut = async () => {
    const { error } = await authClient.signOut();
  };

  return (
    <main>
      <div>
        This is the dashboard page for {user?.email}
        <Button onPress={signOut}>Sign Out</Button>
      </div>
    </main>
  );
}
