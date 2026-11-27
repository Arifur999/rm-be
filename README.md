# rm-be — রেন্ট এ কার (Backend API)

API for the rent-a-car manager: cars, drivers, trips (fare / paid / due), expenses, dashboard, users.
**Frontend:** [rn-fe](https://github.com/Arifur999/rn-fe)

**Stack:** Express 5 · Prisma 7 (pg adapter) · PostgreSQL (Neon) · Zod 4 · TypeScript (ESM)

## Structure
`src/app/module/<name>/<name>.{route,controller,service,validation}.ts` for
`auth`, `car`, `driver`, `trip`, `expense`, `dashboard`, `user`.

- Auth: database session (random token, SHA-256 hash stored), JWT nei. Password change, reset ba account bondho korle session mucche jay.
- Roles: `super_admin` (`/users` module) and `owner`.
- Prothom super admin toiri hoy `ADMIN_EMAIL` / `ADMIN_PASSWORD` theke, shudhu jokhon database e kono account nei. Baki account site theke banano hoy.
- Soft delete (`deleted_at`). Business date gulo `date` column, Asia/Dhaka time e.

## Run
```bash
cp .env.example .env         # fill in values
npm install
npx prisma migrate deploy    # or: npx prisma dev -n rentcar -d  for a local DB
npm run dev                  # http://localhost:5000
```
Check: `npx tsc --noEmit && npm run lint && npm test`

## Deploy (Vercel + Neon, free)
1. Neon: pooled URL → `DATABASE_URL`, direct URL → `DIRECT_URL`. Run `npx prisma migrate deploy` once.
2. Vercel: new project → ei repo. Env: `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`,
   `FRONTEND_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DB_POOL_MAX=5`. Build is in `vercel.json`.

Built by [Arif](https://www.instagram.com/arif_xtwo)
