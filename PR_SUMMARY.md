# Add Shift Context to Coverage Requests + Refactor Test Infrastructure

## Coverage Request Changes

Coverage requests now embed full shift context instead of just `shiftId`:

- Added `EmbeddedShift` type with shift details, class info, and instructors
- `CoverageRequest.shift` replaces `CoverageRequest.shiftId`
- `CoverageService` batch-loads shift, course, and instructor data for coverage lists

## Test Infrastructure Refactor

Migrated to .NET-style service testing pattern:

- **`ICurrentSessionService`** - Abstraction for session access (mockable in tests)
- **`createTestScope()`** - Creates test scope with mock session and resolved services
- Tests call services directly instead of through tRPC
- Migrations run once per test run via `globalSetup`
- Suppressed PostgreSQL NOTICE messages

### New Test Pattern
```typescript
let scope = createTestScope();
scope.mockSession.setAsAdmin();
let termService = scope.resolve<ITermService>("termService");
await termService.getAllTerms();
```
