# TutorStartup - AI Coding Agent Instructions

## Project Overview

TutorStartup is a modern jobs marketplace for tutoring services. It's a **Turborepo monorepo** with:

- `apps/api`: NestJS modular monolith (Prisma, Redis, BullMQ, Meilisearch)
- `apps/web`: Next.js App Router (Tailwind v4, TypeScript, bilingual EN/AM)

**Key architectural principle**: Modular monolith first - strict module boundaries enable future microservice splits without premature complexity.

## Essential Developer Workflows

```bash
# Setup (one-time)
docker compose up -d  # Starts Postgres (15432), Redis (16379), Meilisearch (7700)
pnpm install
pnpm --filter api exec prisma migrate dev

# Development
pnpm --filter api start:dev        # API on :4000
pnpm --filter web dev              # Web on :3000
pnpm --filter api start:worker:dev # Background worker

# Quality gates (run before committing)
pnpm lint      # Turbo runs eslint across all apps
pnpm --filter api test             # Jest unit + integration tests
pnpm --filter api build            # Type-check + build
pnpm --filter web build            # Next.js build
```

## API Patterns (NestJS)

### Module Structure

Every module follows this exact structure:

```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── dto/
│   ├── create-entity.dto.ts
│   ├── update-entity.dto.ts
│   └── entity-response.dto.ts
└── interfaces/ (when needed)
```

### Controller Conventions

```typescript
@Controller({ path: 'tutors', version: '1' })  // API versioning mandatory
export class TutorsController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Put('me')
  upsertMyProfile(
    @CurrentUser() user: JwtPayload,    // Always use custom decorator
    @Body() dto: UpsertTutorProfileDto, // Validation via class-validator
  ) { ... }
}
```

### Service Patterns

- Use `private readonly` for all dependencies
- Explicit role checking in business logic (don't rely solely on guards)
- Use Prisma transactions for multi-step operations
- Fire-and-forget pattern for non-critical async work:

```typescript
private fireAndForget(task: Promise<unknown>, label: string): void {
  void task.catch((error) => this.logger.warn(`${label} failed: ${error.message}`));
}
```

### DTO Patterns

- Use definite assignment assertion (`!`) for required fields
- Custom validation messages for enums

```typescript
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsEnum(UserRole, { message: "role must be STUDENT, PARENT, or TUTOR" })
  role?: UserRole;
}
```

### Error Handling

- Prisma exceptions are automatically mapped via `PrismaClientExceptionFilter`:
  - `P2002` → `ConflictException` (409)
  - `P2025` → `NotFoundException` (404)
- Always throw NestJS HTTP exceptions, never raw errors

## Frontend Patterns (Next.js)

### Component Organization

```
src/app/
├── layout.tsx              # Root layout with fonts, theme, metadata
├── providers.tsx           # Auth, Theme, I18n contexts
├── globals.css             # Tailwind + CSS custom properties
├── _components/            # Shared components (AppHeader, PageShell)
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
└── [feature]/
    └── page.tsx
```

### State Management

- **Auth tokens**: Stored in memory via React Context (NOT localStorage)
- **Theme/Locale**: Persisted in localStorage with `STORAGE_PREFIX`
- **API client**: Centralized in `src/lib/api.ts` with automatic token injection

### API Client Pattern

```typescript
// Always use the centralized API client
import { api } from "@/lib/api";

// Tokens are automatically injected from AuthContext
const user = await api.get("/v1/users/me");
```

### Styling Conventions

- Tailwind CSS v4 with custom design tokens
- CSS custom properties in `globals.css`:
  - `--background`, `--foreground`, `--accent`
- Utility classes: `.glass-panel`, `.surface-card`, `.ui-btn`, `.ui-field`

## Database (Prisma)

### Key Models

- **User**: Core identity with role (STUDENT|PARENT|TUTOR|AGENCY|ADMIN)
- **TutorProfile**: 1:1 with User, indexed in Meilisearch
- **JobPost/Proposal/Contract**: Hiring workflow with status enums
- **Payment/LedgerEntry**: Financial records with idempotency keys

### Critical Patterns

- Always use transactions for multi-table operations
- Idempotency keys for payments: `"CHAPA:<tx_ref>:CLIENT_CHARGE"`
- Soft deletes via status fields (no hard deletes on business entities)

## Async Architecture

### Queue System (BullMQ + Redis)

- Jobs: welcome emails, search index updates, profile reminders
- Graceful fallback: executes inline when `QUEUE_DRIVER=memory`
- Worker process: `pnpm --filter api start:worker:dev`

### Search Pipeline

1. Tutor profile changes → enqueue Meilisearch sync job
2. Redis cache layer in front of Meilisearch
3. Graceful degradation when search unavailable

## Environment & Configuration

### Feature Drivers (can toggle via env)

```bash
CACHE_DRIVER=redis|memory
QUEUE_DRIVER=redis|memory
SEARCH_DRIVER=meilisearch|memory
RATE_LIMIT_DRIVER=redis|memory
```

### Required for Development

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/tutorstartup
JWT_SECRET=32+chars
JWT_REFRESH_SECRET=32+chars
REDIS_URL=redis://localhost:6379
MEILISEARCH_HOST=http://localhost:7700
```

## Testing Strategy

### API Tests

- Unit tests: `*.spec.ts` alongside source files
- E2E tests: `test/*.e2e-spec.ts`
- CI uses `RATE_LIMIT_DRIVER=memory` for deterministic tests

### Frontend Tests

- Manual testing requires both dev servers running
- API integration is the primary verification method

## Security Baseline

- **Auth**: JWT access tokens (15min) + refresh tokens (30 days, httpOnly cookies)
- **Rate limiting**: Redis-backed via `@nestjs/throttler`
- **CORS**: Configured for `FRONTEND_URL` origins only
- **Helmet**: CSP enabled except for Swagger docs
- **Input validation**: DTOs + `ValidationPipe` with `forbidNonWhitelisted: true`

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`):

1. Lint job: install → prisma generate → lint
2. Build & test: install → prisma generate → API build → API test → Web build

## Common Pitfalls to Avoid

1. **Don't persist auth tokens in localStorage** - use in-memory context
2. **Don't import across module boundaries** - use service interfaces or events
3. **Don't skip role validation in services** - guards are the first line only
4. **Don't use hard deletes** - use status fields for soft deletes
5. **Don't forget idempotency keys** - required for all payment operations
6. **Don't cache without TTL** - Redis cache must have explicit expiration

## Key Files to Reference

- `apps/api/src/main.ts` - Bootstrap with versioning, swagger, helmet, CORS
- `apps/api/src/app.module.ts` - Module orchestration
- `apps/api/src/config/` - Configuration validation schemas
- `apps/api/prisma/schema.prisma` - Complete data model
- `apps/web/src/app/providers.tsx` - Auth/Theme/I18n contexts
- `apps/web/src/lib/api.ts` - API client with token handling
- `docs/ARCHITECTURE.md` - Full architectural documentation
