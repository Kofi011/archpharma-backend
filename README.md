# ArchPharma ERP - Backend API

Production-ready NestJS backend service with PostgreSQL & TypeORM for the ArchPharma Wholesale Pharmacy ERP system.

---

## Features
- **Authentication & RBAC**: JWT-based auth with roles (`admin`, `cashier`, `storekeeper`, `accountant`).
- **Auto-Seeding**: Automatically seeds default super admin (`admin@archpharma.com` / `admin123`) on clean database boot.
- **Dynamic Database Support**: Seamlessly connects via standard `DATABASE_URL` (Railway, Supabase, Render) or individual environment variables with SSL encryption.
- **Swagger Documentation**: Interactive API documentation available at `/api/v1/docs`.
- **Master Reset Endpoint**: `/api/v1/sync/reset` for clearing transaction ledgers while preserving user accounts.

---

## Tech Stack
- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database ORM**: [TypeORM](https://typeorm.io/)
- **Database Engine**: PostgreSQL
- **Containerization**: Docker (Alpine multi-stage build)
- **Deployment Platform**: [Railway](https://railway.com/)

---

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and adjust credentials:
```bash
cp .env.example .env
```

### 3. Run in Development Mode
```bash
npm run start:dev
```
The API will be live at `http://localhost:3000/api/v1` (Swagger docs at `http://localhost:3000/api/v1/docs`).

### 4. Build for Production
```bash
npm run build
npm run start:prod
```

---

## Railway Cloud Deployment

1. Create a project on [railway.com](https://railway.com/) and click **Provision PostgreSQL**.
2. Add this repository (or the `/backend` subdirectory) as a GitHub service.
3. In the Backend service **Variables**, add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` = `archpharma_super_secret_jwt_key_2026`
4. Under **Settings > Networking**, click **Generate Domain**.
5. Your public API endpoint will be: `https://<your-domain>.up.railway.app/api/v1`.
