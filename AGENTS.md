# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Activepieces is an open-source automation platform (Nx monorepo, Node.js 18). The dev environment uses SQLite + in-memory queue by default — no external services (Postgres/Redis/Docker) are needed.

### Running the dev environment
`npm run dev` starts three concurrent processes (frontend on :4200, backend API on :3000, engine in watch mode). See `package.json` scripts for details. The backend `.env` is at `packages/server/api/.env` and is pre-configured for local dev.

### Lint and test
- Lint: `npx nx lint server-api`, `npx nx lint react-ui`
- Tests: `npx nx test shared`, `npx nx test server-api`

### Non-obvious gotchas
- **Node.js version**: Must use v18.19.0 (see `.nvmrc`). Use `nvm use` before running any commands.
- **Nx Cloud warnings**: You will see "Invalid Credentials (CI Access Token)" warnings from Nx Cloud — these are harmless and can be ignored. They do not affect builds or tests.
- **Piece dev loading**: The `AP_DEV_PIECES` env var in `packages/server/api/.env` controls which pieces are loaded from source during development. By default only `google-sheets` and `store` are loaded. To develop other pieces, add them to this comma-separated list.
- **Commit hook**: A `commit-msg` hook runs `commitlint` and blocks commits of `packages/server/api/.env`. Use conventional commit format.
- **Agents feature**: The Agents feature (AI multi-step agents) is accessed via the sidebar under "Agents". Its backend code lives in `packages/server/api/src/app/agents/`, the engine tools in `packages/engine/src/lib/tools/`, and the UI in `packages/react-ui/src/features/agents/` and `packages/react-ui/src/app/routes/agents/`. The AI piece with agent actions is at `packages/pieces/community/ai/src/lib/actions/agents/`.
