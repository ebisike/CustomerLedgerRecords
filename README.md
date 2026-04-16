# Customer Credit Ledger System
### Food and Drinks Warehouse Intl Limited

A production-ready, full-stack web application for managing customer credit ledgers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 9 Web API — Clean Architecture |
| ORM | Entity Framework Core 9 + Pomelo MySQL |
| Database | MySQL 8 |
| Auth | JWT Bearer + Refresh Tokens (BCrypt) |
| Email | MailKit (SMTP) |
| PDF Export | QuestPDF (Community License) |
| Excel Export | EPPlus |
| CQRS | MediatR 12 |
| Validation | FluentValidation |
| Logging | Serilog |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (auth) + TanStack Query (server state) |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| PWA | vite-plugin-pwa |

---

## Project Structure

```
CustomerLedgerRecords/
├── backend/
│   ├── CustomerLedger.sln
│   └── src/
│       ├── CustomerLedger.Domain/          # Entities, Enums
│       ├── CustomerLedger.Application/     # Commands, Queries, DTOs, Interfaces
│       ├── CustomerLedger.Infrastructure/  # EF Core, Services, Repositories
│       └── CustomerLedger.API/             # Controllers, Middleware, Program.cs
└── frontend/
    └── src/
        ├── api/          # Axios API clients
        ├── components/   # Reusable UI & layout components
        ├── hooks/        # Custom hooks
        ├── pages/        # Page components
        ├── store/        # Zustand stores
        ├── types/        # TypeScript types
        └── utils/        # Helpers (format, cn)
```

---

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/)
- [MySQL 8](https://dev.mysql.com/downloads/)
- [EF Core CLI](https://learn.microsoft.com/en-us/ef/core/cli/dotnet): `dotnet tool install --global dotnet-ef`

---

## Backend Setup

### 1. Configure Connection String

Edit `backend/src/CustomerLedger.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=CustomerLedgerDb;User=root;Password=YOUR_PASSWORD;AllowPublicKeyRetrieval=true;SslMode=None;"
  },
  "Jwt": {
    "SecretKey": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!2024"
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "Username": "your-gmail@gmail.com",
    "Password": "your-gmail-app-password"
  },
  "AppSettings": {
    "FrontendUrl": "http://localhost:5173"
  }
}
```

> **Gmail App Password**: Enable 2FA on your Google account → Google Account → Security → App Passwords → Generate.

### 2. Create Database

```sql
CREATE DATABASE CustomerLedgerDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Run Migrations

```bash
cd CustomerLedgerRecords/backend

dotnet ef migrations add InitialCreate \
  --project src/CustomerLedger.Infrastructure \
  --startup-project src/CustomerLedger.API \
  --output-dir Data/Migrations

dotnet ef database update \
  --project src/CustomerLedger.Infrastructure \
  --startup-project src/CustomerLedger.API
```

### 4. Run the API

```bash
cd CustomerLedgerRecords/backend
dotnet run --project src/CustomerLedger.API
```

API runs at: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/swagger`

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd CustomerLedgerRecords/frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env if your API runs on a different port
```

`.env`:
```
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Run the App

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Seeded Credentials

On first run, the database is automatically seeded with:

| Field | Value |
|-------|-------|
| Email | `admin@fdwarehouse.com` |
| Password | `Admin@1234` |
| Role | Admin |

---

## Features

### Authentication
- ✅ Login with email + password
- ✅ Forgot Password (email reset link)
- ✅ Reset Password (token-based)
- ✅ JWT access tokens + refresh tokens (persistent sessions)
- ✅ Admin invitation system (email invite → accept link)

### Customer Management
- ✅ Create / Edit customers (Name, Address, Phone, Email)
- ✅ Unique phone number per company
- ✅ Paginated customer list
- ✅ Search by name, phone, email
- ✅ Sortable columns

### Credit Ledger
- ✅ Chronological ledger table per customer
- ✅ Running balance: `B_current = B_previous + D - C` (server-side)
- ✅ Add entry: Date, Description, Invoice/Receipt #, Debit, Credit
- ✅ "Updated By" auto-filled from logged-in user
- ✅ Filter by date range, invoice number, updated-by user
- ✅ Sortable columns

### Exports
- ✅ PDF export (QuestPDF — formatted, printable)
- ✅ Excel export (.xlsx, EPPlus)
- ✅ Exports respect active filters

### UI/UX
- ✅ PWA (installable, offline-ready)
- ✅ Fully responsive (desktop + tablet + mobile)
- ✅ Minimalist dashboard with stats
- ✅ Breadcrumb navigation
- ✅ Smooth Framer Motion animations
- ✅ Interactive sortable tables
- ✅ Loading skeletons and empty states
- ✅ Toast notifications

### Security
- ✅ BCrypt password hashing
- ✅ JWT with short expiry + refresh token rotation
- ✅ CORS configured for frontend origin
- ✅ Global exception middleware
- ✅ FluentValidation on all inputs
- ✅ Soft delete (IsDeleted flag)
- ✅ Role-based access (Admin/User)
- ✅ Audit trail via "Updated By"

---

## API Endpoints

All responses follow:
```json
{
  "results": {},
  "status": true,
  "errorMessage": "",
  "successMessage": "",
  "metaData": { "pageIndex": 1, "pageSize": 10, "totalCount": 50, "totalPages": 5, "showing": "..." },
  "statusCode": 200
}
```

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Login |
| POST | `/api/v1/auth/forgot-password` | Public | Request reset email |
| POST | `/api/v1/auth/reset-password` | Public | Reset password |
| POST | `/api/v1/auth/refresh-token` | Public | Refresh JWT |
| POST | `/api/v1/auth/invite` | Admin | Invite user |
| POST | `/api/v1/auth/accept-invitation` | Public | Accept invite |
| GET | `/api/v1/customers` | Auth | List customers |
| POST | `/api/v1/customers` | Auth | Create customer |
| GET | `/api/v1/customers/:id` | Auth | Get customer |
| PUT | `/api/v1/customers/:id` | Auth | Update customer |
| GET | `/api/v1/ledger/customers/:id/entries` | Auth | Get ledger entries |
| POST | `/api/v1/ledger/customers/:id/entries` | Auth | Add ledger entry |
| GET | `/api/v1/ledger/customers/:id/export` | Auth | Export ledger |
| GET | `/api/v1/users` | Admin | List users |

---

## Production Build

**Backend:**
```bash
cd backend
dotnet publish src/CustomerLedger.API -c Release -o publish/
```

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## Database Schema

```
Company ──< Users
Company ──< Customers
Customer ──< LedgerEntries
User ──< LedgerEntries (UpdatedBy)
User ──< RefreshTokens
User ──< PasswordResetTokens
Company ──< InvitationTokens
```
