import type { Session, User } from "@/lib/auth";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";

export interface ICurrentSessionService {
  getSession(): Session | undefined;
  getUser(): User | undefined;
  getUserId(): string | undefined;
  isAuthenticated(): boolean;
  requireSession(): Session;
  requireUser(): User;
}

export class CurrentSessionService implements ICurrentSessionService {
  private readonly session: Session | undefined;

  constructor({ session }: { session?: Session }) {
    this.session = session;
  }

  getSession(): Session | undefined {
    return this.session;
  }

  getUser(): User | undefined {
    return this.session?.user;
  }

  getUserId(): string | undefined {
    return this.session?.user?.id;
  }

  isAuthenticated(): boolean {
    return !!this.session;
  }

  requireSession(): Session {
    if (!this.session) {
      throw new NeuronError(
        "Authentication required",
        NeuronErrorCodes.UNAUTHORIZED,
      );
    }
    return this.session;
  }

  requireUser(): User {
    return this.requireSession().user;
  }
}
