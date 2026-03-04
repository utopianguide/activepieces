# How to Set Up Activepieces on Your PC

This guide provides a comprehensive overview of different ways to set up Activepieces on your PC, from quick testing to full development environments.

## Table of Contents
- [Quick Start (Recommended for Testing)](#quick-start-recommended-for-testing)
- [Production Setup (Recommended for Companies)](#production-setup-recommended-for-companies)
- [Local Development Setup](#local-development-setup)
- [Cloud Deployment Options](#cloud-deployment-options)

---

## Quick Start (Recommended for Testing)

The fastest way to get Activepieces running on your PC for testing purposes.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your machine

### Installation Steps

1. **Pull and run the Docker image:**
   ```bash
   docker run -d -p 8080:80 \
     -v ~/.activepieces:/root/.activepieces \
     -e AP_QUEUE_MODE=MEMORY \
     -e AP_DB_TYPE=SQLITE3 \
     -e AP_FRONTEND_URL="http://localhost:8080" \
     activepieces/activepieces:latest
   ```

2. **Access Activepieces:**
   Open your browser and go to: `http://localhost:8080`

3. **Configure Webhooks (Optional):**
   If you need to test webhooks on localhost, use [ngrok](https://ngrok.com/):
   ```bash
   ngrok http 8080
   ```
   Then restart the container with the ngrok URL as `AP_FRONTEND_URL`.

---

## Production Setup (Recommended for Companies)

For production use with PostgreSQL and Redis for better performance and reliability.

### Prerequisites
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Docker](https://docs.docker.com/get-docker/) (version 2.0+ with `docker compose` command)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/activepieces/activepieces.git
   cd activepieces
   ```

2. **Generate environment variables:**
   ```bash
   sh tools/deploy.sh
   ```
   
   *Alternative:* Rename `.env.example` to `.env` and manually configure the variables.

3. **Start Activepieces:**
   ```bash
   docker compose -p activepieces up
   ```

4. **Access Activepieces:**
   Open your browser and go to: `http://localhost:8080`

### Upgrading

To upgrade to the latest version:

**Automatic:**
```bash
sh tools/update.sh
```

**Manual:**
```bash
git pull
docker compose pull
docker compose up -d --remove-orphans
```

⚠️ **Important:** Always review the [changelog](https://www.activepieces.com/docs/about/breaking-changes) for breaking changes before upgrading.

---

## Local Development Setup

For developers who want to contribute to Activepieces or develop custom pieces.

### Prerequisites
- **Node.js v18 or v20**
- **npm v9+**

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/activepieces/activepieces.git
   cd activepieces
   ```

2. **Set up the development environment:**
   ```bash
   node tools/setup-dev.js
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   
   This command will:
   - Install all dependencies
   - Start the backend API
   - Start the frontend GUI
   - Start the engine
   - Use SQLite3 and in-memory queue

4. **Access Activepieces:**
   - Open your browser and go to: `http://localhost:4200`
   - Default credentials:
     - **Email:** `dev@ap.com`
     - **Password:** `12345678`

### Development Tips

- **Enable specific pieces:** By default, only a few pieces are loaded to keep development fast. To enable more pieces:
  ```bash
  AP_DEV_PIECES=google-sheets,cal-com npm start
  ```
  
- **Separate commands for different components:**
  - Backend only: `npm run dev:backend`
  - Frontend + Backend: `npm run dev:frontend`
  - Both: `npm run dev`

- **Build and test pieces:**
  ```bash
  npm run create-piece      # Create a new piece
  npm run build-piece       # Build a piece
  npm run publish-piece     # Publish a piece
  ```

### Alternative Development Options

- **GitHub Codespaces:** Quickest cloud-based setup - see [docs](https://www.activepieces.com/docs/developers/development-setup/codespaces)
- **Dev Container:** For remote development - see [docs](https://www.activepieces.com/docs/developers/development-setup/dev-container)

---

## Cloud Deployment Options

For those who prefer managed deployments:

### Activepieces Cloud
The fastest option - fully managed by Activepieces team.
- Visit: [https://cloud.activepieces.com/](https://cloud.activepieces.com/)

### Other One-Click Deployments
- **PikaPods** - Starting from $2.9/month
- **Easypanel** - Community-maintained template
- **Elestio** - One-click deployment
- **Zeabur** - One-click deployment
- **RepoCloud** - Community-maintained template

For more deployment options, see the [installation documentation](https://www.activepieces.com/docs/install/overview).

---

## What is Activepieces?

Activepieces is an **open source** alternative to Zapier, designed to be:
- **AI-First**: Native AI integration and copilot features
- **Developer-Friendly**: TypeScript-based pieces with hot reloading
- **Extensible**: 280+ pieces available as MCP servers for LLMs
- **Enterprise-Ready**: Self-hosted, secure, and customizable
- **User-Friendly**: Intuitive interface for both technical and non-technical users

### Key Features
- ✅ Loops and Branches
- ✅ Auto Retries
- ✅ HTTP Requests
- ✅ Code with NPM support
- ✅ AI Assistance in Code Pieces
- ✅ 280+ Integrations
- ✅ Fully Versioned Flows
- ✅ Multi-language Support

---

## Need Help?

- **Documentation:** [https://www.activepieces.com/docs](https://www.activepieces.com/docs)
- **Discord Community:** [Join here](https://discord.gg/2jUXBKDdP8)
- **Contributing Guide:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Create a Piece:** [Developer Docs](https://www.activepieces.com/docs/developers/overview)

---

## License

- **Community Edition:** MIT License (free and open source)
- **Enterprise Edition:** Commercial License

For more details, see [LICENSE](./LICENSE) and [editions comparison](https://www.activepieces.com/docs/about/editions).
