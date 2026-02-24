## Cursor Cloud specific instructions

### Overview

Activepieces is an open-source automation platform (Nx monorepo). Three services run concurrently in dev mode via `npm run dev`:

| Service | Port | Description |
|---------|------|-------------|
| React frontend (Vite) | 4200 | SPA at `packages/react-ui` |
| Fastify backend API | 3000 | API server at `packages/server/api` |
| Engine | — | Flow execution engine at `packages/engine` |

### Key dev environment notes

- **Node.js v18** is required (see `.nvmrc`). Use `source /home/ubuntu/.nvm/nvm.sh && nvm use 18.19.0` before running commands.
- **Package manager**: npm with `package-lock.json`. Always use `npm ci --legacy-peer-deps`.
- **No Docker needed for dev**: The dev `.env` at `packages/server/api/.env` uses SQLite3 (`AP_DB_TYPE=SQLITE3`) and in-memory queue (`AP_QUEUE_MODE=MEMORY`), so no Postgres or Redis is required.
- **Dev pieces**: Only pieces listed in `AP_DEV_PIECES` in `packages/server/api/.env` are loaded in dev mode (default: `google-sheets,store`). Add more piece names comma-separated to test additional integrations.
- **Pre-seeded dev account**: On first startup, a dev user is created automatically. Credentials: `dev@ap.com` / `12345678`. Sign-up for new accounts is restricted by default.
- **Nx Cloud warnings**: The NX Cloud access token in `nx.json` is invalid for local dev. Ignore `Invalid Credentials (CI Access Token)` warnings — they don't affect functionality.

### Commands reference

- **Dev server**: `npm run dev` (starts frontend + backend + engine concurrently)
- **Lint**: `npx nx run-many --target=lint --projects=server-api,react-ui,engine`
- **Tests**: `npx nx test server-api` (integration tests), `npx nx test shared` (unit tests)
- **Build**: `npx nx build server-api` / `npx nx build react-ui`

See `package.json` scripts for additional commands (CLI, piece creation, i18n).

### Gotchas

- **IPv6 issue with `localhost`**: Node.js 18 resolves `localhost` to IPv6 `::1` first, but the Vite dev server only listens on IPv4 `0.0.0.0`. This causes the backend's AI proxy (used by Agents) to fail with `ECONNREFUSED ::1:4200`. Fix: change `AP_FRONTEND_URL` in `packages/server/api/.env` from `http://localhost:4200` to `http://127.0.0.1:4200`.
- The backend builds dev pieces on first startup, which takes ~30-60 seconds. Wait for the `✨ Changes are ready!` log message before testing.
- The Vite frontend TypeScript checker may show `ERROR` with `Found 0 errors` — this is normal (the checker plugin logs "ERROR" as a category label even when clean).
- The `husky` pre-commit hook runs `commit-msg` validation. Commit messages should follow conventional commits format.
- **Agents feature**: To use Agents, you must first configure an OpenAI API key under Platform Admin > Setup > AI. The "Invent an Agent" creation flow calls OpenAI to enhance the prompt.
