# AGENTS.md

## Cursor Cloud specific instructions

### Product overview
Activepieces is an open-source automation platform (Zapier alternative). It is an Nx monorepo with a React frontend (`packages/react-ui`, port 4200), a Fastify backend API (`packages/server/api`, port 3000), and an engine (`packages/engine`). See `README.md` for full details.

### Node version
The project requires **Node.js 18** (see `.nvmrc`). Use `nvm use` to activate.

### Dev mode
In development mode the backend uses **SQLite3** and an **in-memory queue**, so no external databases (Postgres/Redis) are needed. The dev `.env` is at `packages/server/api/.env`.

### Running the app
```
npm run dev
```
This starts frontend, backend, and engine concurrently. The app is available at `http://localhost:4200`.

### Dev login credentials
A dev user is seeded automatically: **email** `dev@ap.com`, **password** `12345678`. New sign-ups are invitation-only; use these credentials to log in.

### Only two pieces loaded in dev
The env var `AP_DEV_PIECES="google-sheets,store"` controls which pieces are built and loaded from source. To develop a different piece, add its name to this comma-separated list in `packages/server/api/.env`.

### Lint / Test / Build
- **Lint (all core):** `npx nx run-many --target=lint --projects=react-ui,server-api,engine,shared`
- **Tests (server):** `npx nx test server-api`
- **Tests (shared):** `npx nx test shared`
- **Build:** `npx nx run-many --target=build`

Refer to `package.json` scripts for additional commands.

### Pre-push hook
The `.husky/pre-push` hook is a no-op. The `.husky/commit-msg` hook runs commitlint (conventional commits) and blocks commits that include `packages/server/api/.env`.
