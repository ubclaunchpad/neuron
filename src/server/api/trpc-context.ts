import "server-only";

import { asValue } from "awilix";

import { auth, type Session } from "@/lib/auth";
import { rethrowServiceUnavailable } from "@/server/errors/service-unavailable";
import { createRequestScope } from "./di-container";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  let session: Session | null;
  try {
    session = await auth.api.getSession({ headers: opts.headers });
  } catch (error) {
    rethrowServiceUnavailable(error);
  }
  const container = createRequestScope();

  container.register({
    session: asValue<Session | undefined>(session ?? undefined),
    headers: asValue<Headers>(opts.headers),
  });

  return {
    ...container.cradle,
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
