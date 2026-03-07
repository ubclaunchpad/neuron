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

## Database Migrations

This repo uses [**Drizzle**](https://orm.drizzle.team/). After Postgres is up, run migrations:

```bash
pnpm db:migrate

# Fallback:
pnpx drizzle-kit migrate
```

Migrations target Postgres and align with the schema under the `src/server/db/schema` module.

---

## Install & Run

```bash
pnpm install
pnpm dev
```

This launches the Next.js app (frontend + tRPC backend) in development mode

---

## Login & auth troubleshooting

**The SMTP and MinIO values in `.env` are not your login credentials.** They configure the server (email sending and file storage). To sign in, you use an **email + password** that you set when you sign up in the app.

1. **Create an account**  
   Use [Sign Up](/auth/signup), then check your inbox for the verification email.

2. **Email verification is required**  
   Login is blocked until the email is verified. If you see *"Please verify your email address before continuing"*:
   - Ensure SMTP is correct so verification emails are sent. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) (not your normal password).
   - Keep spaces in the app password by quoting it in `.env`:  
     `SMTP_PASS="meke tlgd qeae babe"`
   - `BASE_URL` must be a full URL (e.g. `http://localhost:3000`). It is used in verification and password-reset links.

3. **Required for auth**
   - `BETTER_AUTH_SECRET`: set and at least 32 characters (e.g. generate at [better-auth.com](https://www.better-auth.com/docs/installation)).
   - `BASE_URL`: valid URL, e.g. `http://localhost:3000`.

4. **MinIO / file storage**  
   The app expects these names (see `.env.example`): `MINIO_HOST`, `MINIO_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`, `MINIO_USE_SSL`, and **`FILES_BASE_URL`** as a full URL (e.g. `http://localhost:9000`), not `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_ENDPOINT`. Align your `.env` with `.env.example` so the app starts and file features work.

---

## Clean Up (Optional)

```bash
docker rm -f neuron-postgres neuron-redis
docker volume prune -f
```

> Removing containers does **not** delete local data unless volumes were created and pruned.
