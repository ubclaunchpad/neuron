import type { NeuronCradle, NeuronContainer } from "@/server/api/di-container";
import { createTestContainer } from "../test-container";
import { MockCurrentSessionService } from "../mocks/mock-current-session-service";

type Drizzle = NeuronCradle["db"];

export interface ITestServiceScope {
  resolve<T>(serviceName: keyof NeuronCradle): T;
  readonly mockSession: MockCurrentSessionService;
  readonly db: Drizzle;
  readonly container: NeuronContainer;
  dispose(): void;
}

class TestServiceScope implements ITestServiceScope {
  private readonly _container: NeuronContainer;
  private readonly _mockSession: MockCurrentSessionService;
  private readonly _db: Drizzle;
  private _disposed = false;

  constructor(container: NeuronContainer) {
    this._container = container;
    this._mockSession = container.resolve<MockCurrentSessionService>(
      "currentSessionService",
    );
    this._db = container.resolve<Drizzle>("db");
  }

  resolve<T>(serviceName: keyof NeuronCradle): T {
    this.ensureNotDisposed();
    return this._container.resolve<T>(serviceName as string);
  }

  get mockSession(): MockCurrentSessionService {
    this.ensureNotDisposed();
    return this._mockSession;
  }

  get db(): Drizzle {
    this.ensureNotDisposed();
    return this._db;
  }

  get container(): NeuronContainer {
    this.ensureNotDisposed();
    return this._container;
  }

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this._mockSession.clear();
    }
  }

  private ensureNotDisposed(): void {
    if (this._disposed) {
      throw new Error("Cannot access a disposed TestServiceScope");
    }
  }
}

export function createTestScope(): ITestServiceScope {
  const container = createTestContainer();
  return new TestServiceScope(container);
}
