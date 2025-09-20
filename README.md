# Neuron
A volunteer management system for BC Brain Wellness Program.

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

## Prerequisites
- [**Node.js**](https://nodejs.org/en/download) and a [pnpm](https://pnpm.io/installation)
- [**Docker**](https://docs.docker.com/desktop/) for local Postgres + Redis (install Docker Desktop locally)
- A local `.env` with required variables (see **Environment**)

This project uses:
- **Postgres** (via Drizzle ORM with `postgres-js`)
- **Redis** for caching
- Strict typed env validation (fails fast if required keys are missing)

---

## Environment

Create a `.env` in the repo root, following the format and content of `.env`

> The app validates these at startup. If any are missing/malformed, it will exit with an error.

---

## Start the Dev Services (Docker)

Start **Postgres** and **Redis** locally:

1. Create or update your `.env` with the required variables used by Docker and the app. You can generate strong passwords with the helper script:

```bash
./gen-pass.sh
```

Example `.env` snippet for local dev:

```
# Drizzle
DATABASE_PASSWORD="password" // Change this to a generated password
DATABASE_URL="postgresql://postgres:password@localhost:5432/neuron" // Change "password" to the same as above

# Redis
REDIS_PASSWORD="password" // Change this to a generated password
REDIS_URL="redis://:password@localhost:6379/0" // Change "password" to the same as above
```

2. Start the containers using the provided scripts:

```bash
pnpm dev:up # starts postgres + redis in the background
```

To stop services:

```bash
pnpm dev:down
```

To flush Redis during development:

```bash
pnpm dev:redis:clear
```

---

## Install & Run

```bash
npm install
npm dev
```

This launches the Next.js app (frontend + tRPC backend) in development mode

---

## Database Migrations

This repo uses [**Drizzle**](https://orm.drizzle.team/). After Postgres is up, run migrations:

```bash
npm db:push

# Fallback:
npx drizzle-kit push
```

Migrations target Postgres and align with the schema under the `src/server/db/schema` module.

---

## Clean Up (Optional)

```bash
docker rm -f neuron-postgres neuron-redis
docker volume prune -f
```

> Removing containers does **not** delete local data unless volumes were created and pruned.
