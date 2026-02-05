"use client";

import type { Session, User } from "@/lib/auth";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  session?: Session;
  user?: User;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export const useAuth = () => {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used within <AuthProvider>");
  return v;
};

export default function ClientAuthProvider({
  initialSession,
  children,
}: {
  initialSession?: Session;
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Start from the server value so first paint is correct
  const [bootstrapped, setBootstrapped] = useState(
    (initialSession ?? initialSession === null) as boolean,
  );
  const stableRef = useRef<Session | undefined>(initialSession);
  const { data: liveSession, isPending, error } = authClient.useSession();

  // Keep last non-pending session during client re-fetches
  useEffect(() => {
    if (!isPending) {
      // Check if changed
      const prev = stableRef.current;
      if (prev !== liveSession) {
        stableRef.current = liveSession ?? undefined;
        if (bootstrapped) {
          // refresh client/server trees after session change
          router.refresh();
        }
      }
      setBootstrapped(true);
    }
  }, [router, isPending, liveSession]);

  const session =
    isPending && bootstrapped
      ? stableRef.current
      : (liveSession ?? stableRef.current);

  // Memoize context value to avoid repaints
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!session,
      session,
      user: session?.user,
    }),
    [session],
  );

  // While page is loading
  if (!bootstrapped && isPending) {
    return <div>Loading...</div>;
  }

  if (!session && error) {
    console.warn("Better-Auth session error:", error);
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
