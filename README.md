# CubeHub

CubeHub is a cube timer and cubing hub with WCA-event scrambles, Google login, encrypted profile storage, account settings, and local room UI.

## Local Run

```powershell
npm.cmd install
npm.cmd run build:java:windows
npm.cmd run dev
```

Open `http://127.0.0.1:5173`.

Google login and database-backed account features require these environment variables:

- `APP_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`
- `DATA_ENCRYPTION_KEY`

`DATA_ENCRYPTION_KEY` must be 32 random bytes as base64 or 64 hex characters.

## Render Deploy

This repo includes:

- `Dockerfile`
- `render.yaml`
- `.env.example`

Deploy with Render Blueprint or create:

- one Docker web service
- one PostgreSQL database

Set Render environment variables:

- `APP_URL=https://your-service.onrender.com`
- `GOOGLE_CLIENT_ID=<Google OAuth client id>`
- `GOOGLE_CLIENT_SECRET=<Google OAuth client secret>`
- `DATA_ENCRYPTION_KEY=<generated secret>`
- `DATABASE_URL` from Render PostgreSQL

In Google Cloud OAuth, add this authorized redirect URI:

```text
https://your-service.onrender.com/auth/google/callback
```

## Data Storage

Accounts, sessions, profiles, PRs, and room participants are stored in PostgreSQL. Profile fields and PR data are encrypted with AES-256-GCM before being written to the database. Passwords are not stored because login uses Google OAuth.

## TNoodle

The backend uses official TNoodle through `vendor/TNoodle-WCA-1.2.3.jar` and `java-src/TNoodleSingleScramble.java`.

On Render, the Dockerfile installs OpenJDK and compiles the helper with:

```bash
npm run build:java
```

Locally on Windows, use:

```powershell
npm.cmd run build:java:windows
```
