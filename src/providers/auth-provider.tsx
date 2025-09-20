import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ClientAuthProvider from "./client-auth-provider";

export async function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <ClientAuthProvider initialSession={session ?? undefined}>{children}</ClientAuthProvider>
  );
}
