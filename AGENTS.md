# AGENTS.md

## Commands

- `npm run build` — nest build (output to `dist/`, cleared each build)
- `npm run start:dev` — dev server with watch (port 3000, overridable via `PORT` env)
- `npm run lint` — eslint with auto-fix (flat config at `eslint.config.mjs`)
- `npm run test` — unit tests (jest, `src/**/*.spec.ts`)
- `npm run test:e2e` — e2e tests (jest, `test/**/*.e2e-spec.ts`, config at `test/jest-e2e.json`)
- `npm run format` — prettier on `src/` and `test/`
- `npm run test:cov` — coverage output to `coverage/`
- `npx prisma generate` — regenerate Prisma client after schema changes
- `npx prisma migrate dev` — create and apply a migration (dev)
- `npx prisma migrate deploy` — apply pending migrations (prod)

Run a single test file: `npx jest src/path/to/file.spec.ts`
Run a single e2e test: `npx jest --config ./test/jest-e2e.json test/app.e2e-spec.ts`

No typecheck script is defined; use `npx tsc --noEmit` to typecheck.

## Key facts

- NestJS v11, Express adapter, single app (no monorepo)
- TypeScript with `module: "nodenext"`, target `ES2023`, `noImplicitAny: false`, `strictNullChecks: true`
- ESLint uses `projectService: true` (type-aware linting) — typecheck errors can surface as lint errors
- ESLint rule overrides: `@typescript-eslint/no-explicit-any` is off, `no-floating-promises` and `no-unsafe-argument` are warn
- Prettier: single quotes, trailing commas
- All imports use `.js` extensions (required by `nodenext` module resolution)
- Jest v30 (both unit and e2e)

## Architecture

```
src/
  main.ts                  # Bootstrap, global pipes/filters/interceptors, Swagger setup
  app.module.ts            # Root module, global guards (Throttler, JWT, Roles)
  config/
    env.validation.ts      # class-validator startup validation for env vars
    logger.config.ts       # Winston logger config (console transport, NestJS-like format)
  prisma/
    prisma.module.ts       # @Global() PrismaModule
    prisma.service.ts      # PrismaService (OnModuleInit/OnModuleDestroy lifecycle)
  common/
    constants/index.ts     # ROLES = { ADMIN, USER } (defined but unused — roles are hardcoded strings)
    decorators/
      current-user.decorator.ts   # @CurrentUser() / @CurrentUser('id')
      public.decorator.ts         # @Public() — bypasses JwtAuthGuard
      roles.decorator.ts          # @Roles('ADMIN') — restricts by role
    dto/
      base-response.dto.ts        # Shared response DTO (defined but unused)
      pagination.dto.ts           # page/limit query DTO (defined but unused)
    filters/
      all-exceptions.filter.ts    # Global exception filter
    guards/
      jwt-auth.guard.ts           # Global JWT auth guard (respects @Public)
      roles.guard.ts              # Global roles guard (queries userOrganization table for role names)
    interceptors/
      response-transform.interceptor.ts  # Wraps all responses in { statusCode, message, data, timestamp, path }
    interfaces/
      auth-user.interface.ts      # { id: string; email: string }
      jwt-payload.interface.ts    # { sub: string; email: string }
  modules/
    auth/                         # Register, login (local strategy), JWT strategy, refresh
      strategies/
        local.strategy.ts         # Validates email/password via AuthService -> UsersRepository
        jwt.strategy.ts           # Verifies Bearer token, calls AuthService.validateUserById
      local-auth.guard.ts         # Non-global, used only on POST /auth/login
    users/                        # CRUD (admin-guarded) + GET /me profile
    organizations/                # CRUD (admin-guarded) + GET /slug/:slug (public)
    roles/                        # CRUD (admin-guarded)
    user-organizations/           # CRUD (admin-guarded) — junction table: user + org + role
    health/                       # Terminus health check with Prisma indicator
```

## Database schema (PostgreSQL via Prisma v6)

- **User** — id (UUID), email (unique), password, firstName?, lastName?, isActive (default true), timestamps
- **Role** — id (UUID), name (unique), timestamps
- **Organization** — id (UUID), name, slug (unique), description?, website?, logoUrl?, timestamps
- **UserOrganization** — id (UUID), userId (FK), organizationId (FK), roleId (FK), timestamps; composite unique on `[userId, organizationId]`; cascade deletes on all FKs
- No enums in schema — roles are string-based
- No soft deletes implemented (isActive field exists on User but is never checked)

## Routes

All routes under global prefix `/api`. Total: 23 routes (4 public, 19 JWT-protected, 16 admin-gated).

### Auth (`/api/auth`)

| Method | Path        | Auth                    | Description                                                 |
| ------ | ----------- | ----------------------- | ----------------------------------------------------------- |
| POST   | `/register` | Public                  | Register new user                                           |
| POST   | `/login`    | Public + LocalAuthGuard | Login, returns `{ accessToken, refreshToken }`              |
| POST   | `/refresh`  | JWT                     | Refresh tokens, returns new `{ accessToken, refreshToken }` |

### Users (`/api/users`)

| Method | Path   | Auth  | Description            |
| ------ | ------ | ----- | ---------------------- |
| GET    | `/me`  | JWT   | Current user's profile |
| GET    | `/`    | ADMIN | List all users         |
| GET    | `/:id` | ADMIN | Get user by ID         |
| PATCH  | `/:id` | ADMIN | Update user by ID      |
| DELETE | `/:id` | ADMIN | Delete user by ID      |

### Organizations (`/api/organizations`)

| Method | Path          | Auth   | Description               |
| ------ | ------------- | ------ | ------------------------- |
| GET    | `/`           | ADMIN  | List all organizations    |
| GET    | `/:id`        | ADMIN  | Get organization by ID    |
| GET    | `/slug/:slug` | Public | Get organization by slug  |
| POST   | `/`           | ADMIN  | Create organization       |
| PATCH  | `/:id`        | ADMIN  | Update organization by ID |
| DELETE | `/:id`        | ADMIN  | Delete organization by ID |

### Roles (`/api/roles`)

| Method | Path   | Auth  | Description       |
| ------ | ------ | ----- | ----------------- |
| GET    | `/`    | ADMIN | List all roles    |
| GET    | `/:id` | ADMIN | Get role by ID    |
| POST   | `/`    | ADMIN | Create role       |
| PATCH  | `/:id` | ADMIN | Update role by ID |
| DELETE | `/:id` | ADMIN | Delete role by ID |

### User-Organizations (`/api/user-organizations`)

| Method | Path                            | Auth  | Description                  |
| ------ | ------------------------------- | ----- | ---------------------------- |
| GET    | `/`                             | ADMIN | List all assignments         |
| GET    | `/user/:userId`                 | ADMIN | Org memberships for a user   |
| GET    | `/organization/:organizationId` | ADMIN | Users in an organization     |
| GET    | `/:id`                          | ADMIN | Get assignment by ID         |
| POST   | `/`                             | ADMIN | Assign user to org with role |
| PATCH  | `/:id`                          | ADMIN | Update assignment            |
| DELETE | `/:id`                          | ADMIN | Remove assignment            |

### Health (`/api/health`)

| Method | Path | Auth   | Description     |
| ------ | ---- | ------ | --------------- |
| GET    | `/`  | Public | DB health check |

## Request processing pipeline

1. Winston logger (replaces NestJS default)
2. Global prefix `/api`
3. CORS enabled (all origins — default settings)
4. Global `ValidationPipe` — whitelist, forbidNonWhitelisted, transform, enableImplicitConversion
5. Global guards: ThrottlerGuard (10 req/60s) → JwtAuthGuard (respects `@Public()`) → RolesGuard (queries DB for role names across all user's org memberships)
6. `AllExceptionsFilter` — normalizes all errors to `{ statusCode, message, errors?, timestamp, path }`
7. `ResponseTransformInterceptor` — wraps success to `{ statusCode, message: "Success", data, timestamp, path }`

## Authentication

- **Login**: Passport local strategy validates email/password against DB (bcrypt, 10 salt rounds)
- **JWT**: `passport-jwt` verifies Bearer token signed with `JWT_ACCESS_SECRET`; `JwtStrategy.validate()` confirms user still exists in DB
- **RolesGuard**: queries `prisma.userOrganization` for the authenticated user's role names across ALL organizations — a user who is ADMIN in any org is ADMIN everywhere
- **Refresh**: `POST /auth/refresh` requires valid access token; returns new token pair. Incoming refresh token is NOT validated (only access token is checked)
- **Token payload**: `{ sub: user.id, email: user.email }` (see `JwtPayload` interface)

## Environment variables

| Variable                 | Required | Default       | Description                       |
| ------------------------ | -------- | ------------- | --------------------------------- |
| `NODE_ENV`               | No       | `development` | development \| production \| test |
| `PORT`                   | No       | `3000`        | Server port                       |
| `DATABASE_URL`           | Yes      | —             | PostgreSQL connection string      |
| `JWT_ACCESS_SECRET`      | Yes      | —             | Signs access tokens               |
| `JWT_REFRESH_SECRET`     | Yes      | —             | Signs refresh tokens              |
| `JWT_ACCESS_EXPIRATION`  | No       | `15m`         | Access token expiry               |
| `JWT_REFRESH_EXPIRATION` | No       | `7d`          | Refresh token expiry              |

## Module pattern

All business modules follow a 3-layer pattern:

- **Controller** — HTTP handling, decorators (`@ApiTags`, `@Roles`, `@Public`)
- **Service** — thin business logic, delegates to repository
- **Repository** — direct Prisma queries, throws `NotFoundException` on missing entities
- **DTOs** — Create DTO with `class-validator` + Swagger decorators; Update DTO via `PartialType(CreateDto)`

## Code conventions

- Password fields are destructured out before returning user objects
- Update methods cast DTOs to `{ [key: string]: unknown }` before passing to repository
- All Swagger DTOs use `@ApiProperty`/`@ApiPropertyOptional` with example values
- Swagger UI at `/docs` (no global prefix), bearer auth configured

## Known issues / technical debt

- **No unit tests** — zero `.spec.ts` files; only 1 e2e test (health endpoint)
- **E2E test mismatch** — test setup doesn't apply `AllExceptionsFilter` or `ResponseTransformInterceptor`, so response shape differs from production
- **Unused code**: `ROLES` constants, `BaseResponseDto`, `PaginationDto` are defined but never used
- **`CreateRoleDto.organizationId`** is silently dropped — `RolesRepository.create()` only passes `{ name }`
- **`User.isActive`** is never checked in login, JWT strategy, or guards
- **Token expiry parsing** strips non-digits from strings like `"15m"` → `15`, which may be interpreted as 15 seconds
- **No refresh token verification** — the refresh endpoint only validates the access token
- **No helmet middleware** — no security headers configured
- **CORS allows all origins** — security concern for production
- **Role scoping issue** — roles are global (unique name), not per-organization, despite the junction table design
