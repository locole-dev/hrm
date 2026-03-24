# Backend Local Setup

## PostgreSQL voi Docker

Tu root repo, chay:

```powershell
docker compose up -d
```

PostgreSQL se mo tai:
- Host: `localhost`
- Port: `5432`
- Database: `hrm`
- Username: `postgres`
- Password: `postgres`

## Backend env

Tao file `backend/.env` voi noi dung:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrm"
PORT=3000
JWT_SECRET="change-me"
```

## Prisma

Trong `backend/`, chay:

```powershell
npx prisma migrate deploy --config prisma.config.ts
npm run db:seed
```

## Start backend

```powershell
npm run start:dev
```

Swagger:
- `http://localhost:3000/api/docs`

## Admin mac dinh

- Email: `admin@hrm.local`
- Password: `Admin@123456`

## Auth flow co san

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
