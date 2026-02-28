import type { Session, User } from "@/lib/auth";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import type { ICurrentSessionService } from "@/server/services/currentSessionService";

export class MockCurrentSessionService implements ICurrentSessionService {
  private user: User | undefined;
  private session: Session | undefined;

  setUser(user: User): void {
    this.user = user;
    this.session = {
      user,
      session: {
        id: `mock-session-${Date.now()}`,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: "mock-token",
        ipAddress: null,
        userAgent: null,
      },
    };
  }

  setAsAdmin(overrides?: Partial<User>): void {
    this.setUser({
      id: "admin-1",
      name: "Test",
      lastName: "Admin",
      email: "admin@test.com",
      role: "admin",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      ...overrides,
    });
  }

  setAsVolunteer(overrides?: Partial<User>): void {
    this.setUser({
      id: "volunteer-1",
      name: "Test",
      lastName: "Volunteer",
      email: "volunteer@test.com",
      role: "volunteer",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      ...overrides,
    });
  }

  setAsInstructor(overrides?: Partial<User>): void {
    this.setUser({
      id: "instructor-1",
      name: "Test",
      lastName: "Instructor",
      email: "instructor@test.com",
      role: "instructor",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      ...overrides,
    });
  }

  setUnauthenticated(): void {
    this.user = undefined;
    this.session = undefined;
  }

  clear(): void {
    this.setUnauthenticated();
  }

  getSession(): Session | undefined {
    return this.session;
  }

  getUser(): User | undefined {
    return this.user;
  }

  getUserId(): string | undefined {
    return this.user?.id;
  }

  isAuthenticated(): boolean {
    return !!this.user;
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
