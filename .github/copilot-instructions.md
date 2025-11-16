## Purpose
Short, actionable guidance for AI code assistants working on this repo (NestJS + Mongoose). Use this file to find the project's patterns, run commands, and follow small, reproducible recipes.

## Big picture (what this app is)
- A NestJS (v11) microservice-style monolithic repository that implements an HR Employee Profile, Organization Structure and Performance subsystem.
- Core tech: NestJS, Nest Mongoose integration, MongoDB (mongoose v8), TypeScript. App boots from `src/main.ts` and registers modules in `src/app.module.ts`.

## Key files to read first
- `src/app.module.ts` — shows global ConfigModule and MongooseModule.forRootAsync (MONGODB_URI from .env).
- `src/main.ts` — app bootstrap and port (env `PORT` or 3000).
- `package.json` — useful scripts: `start:dev`, `build`, `test`, `lint`, `format`, `test:e2e`.
- Example modules: `src/employee/employee.module.ts`, `src/notification/notification.module.ts`, `src/organization-structure/organization-structure.module.ts`.

## Common project conventions (explicit, follow these)
- Mongoose schemas live under each feature's `schema/` or `schemas/` folder and use the Nest decorators. Example: `src/employee/schema/employee.schema.ts` defines `export class Employee` and `export const EmployeeSchema = SchemaFactory.createForClass(Employee)`.
- Modules register schemas with `MongooseModule.forFeature([{ name: X.name, schema: XSchema }])` (see `src/employee/employee.module.ts`, `src/notification/notification.module.ts`).
- DTOs live in `dto/` under each feature (e.g. `src/employee/dto`). Keep DTOs simple and reflect the schema shape.
- `repository/` folders exist for data-layer helpers; prefer adding queries there if you need complex DB logic.

## How to run, build and test (developer workflows)
- Dev server (watch): `npm run start:dev` — uses Nest CLI; hot reload/watch enabled.
- Build (production artifact): `npm run build` -> output to `dist/`; run with `npm run start:prod` (which runs `node dist/main`).
- Tests: unit `npm run test`, watch `npm run test:watch`, e2e `npm run test:e2e` (config at `test/jest-e2e.json`).
- Lint/format: `npm run lint` and `npm run format` (prettier + eslint integration).

## Environment & integration
- DB connection is configured in `AppModule` via `MongooseModule.forRootAsync` reading `MONGODB_URI` from environment variables. Always provide `MONGODB_URI` in `.env` when running locally or CI containers.
- App listens on `process.env.PORT` (default 3000).

## Small actionable recipes (copy/paste friendly)
- Add a new feature with a Mongoose model:
  1. Create `src/<feature>/schema/<model>.schema.ts` using `@Schema()` + `SchemaFactory.createForClass()` (see `src/employee/schema/employee.schema.ts`).
  2. Create `src/<feature>/<feature>.module.ts` and register the schema with `MongooseModule.forFeature([{ name: Model.name, schema: ModelSchema }])`.
  3. Add the new module to `src/app.module.ts` imports so Nest can discover it.

- Querying patterns: Prefer adding repository helpers under `src/<feature>/repository/` rather than placing complex queries in controllers.

## Examples to copy from
- Schema pattern: `src/employee/schema/employee.schema.ts` — uses nested types, timestamps, and indexes.
- Module registration: `src/notification/notification.module.ts` — minimal module that registers a schema via `MongooseModule.forFeature`.

## Pitfalls & hints
- Config is global: `ConfigModule.forRoot({ isGlobal: true })` in `app.module.ts`. Use `ConfigService` in factories, e.g., DB connection.
- When running tests that need a DB, ensure a test Mongo instance or mocking layer is available; e2e config lives in `test/jest-e2e.json`.
- Avoid changing TS root-level compiler options without checking `tsconfig.json` (project uses NodeNext resolution and `outDir: ./dist`).

## Where to look for follow-up changes
- DTOs: `src/**/dto/*.ts`
- Schema examples: `src/**/schema/*.schema.ts`, `src/**/schemas/*.schema.ts`
- Modules wiring: `src/*/*.module.ts` and `src/app.module.ts`

If anything here is unclear or you want me to include more concrete snippets (examples of a typical controller-service-repository trio, or CI instructions), tell me which area to expand and I will iterate.
