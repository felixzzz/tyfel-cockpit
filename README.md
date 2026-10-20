# Tyfel Hub · F&B Multi-Brand Operating System

An end-to-end cloud operations cockpit for multi-brand F&B concepts, ghost kitchens, and catering businesses (**Herbox, People Pasta, LA Breakfast Club, etc.**).

---

## Capabilities

- **Multi-Channel Sales & KPT Analytics**: Integrated aggregators (GrabFood, GoFood, ShopeeFood via Klikit) and dine-in POS (Majoo). Real-time Kitchen Prep Time (KPT) tracking and SLA breach alerts.
- **Recipe COGS & BOM Costing**: Bill of Materials (BOM) management, ingredient yield, packaging costs, and theoretical vs. actual food cost tracking.
- **Stock Opname & Variance Engine**: Physical count auditing with real-time variance reconciliation (Shrinkage, Spillage, Surplus, Portioning Variance).
- **Catering CRM & Dispatch**: Customer subscription management, daily delivery slot scheduling, WhatsApp dispatch broadcast, and customer self-service portal.
- **Labor, Attendance & Kasbon Payroll**: Clock-in duration audits, shift lateness penalties, attendance bonuses, salary advance (kasbon) management, and payroll adjustments.
- **Finance & Smart Bank Reconciliation**: BCA / Mandiri bank statement CSV ingestion, rule-based auto-categorization, and P&L reporting.
- **Enterprise RBAC**: Role-based access control (`superadmin`, `admin`, `staff`) with granular permission flags.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Database**: PostgreSQL (Supabase with connection pooling on port 6543)
- **ORM**: Drizzle ORM
- **Authentication**: Stateless JWT sessions via WebCrypto (`jose`) with bcrypt password hashing
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Testing**: Vitest with unit and integration test suites

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)

### 2. Setup Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate the required environment variables:
- `DATABASE_URL`: Supabase Transaction Pooler connection string (Port 6543)
- `DIRECT_URL`: Supabase Direct connection string (Port 5432)
- `AUTH_JWT_SECRET`: Random 32+ character JWT secret (`openssl rand -base64 48`)

### 3. Install & Push Schema

```bash
npm install
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment (Vercel / Cloud)

1. Push your changes to GitHub:
   ```bash
   git push origin main
   ```
2. In your Vercel Project Settings, add the following Environment Variables:
   - `DATABASE_URL` (Supabase Transaction Pooler, Port 6543)
   - `DIRECT_URL` (Supabase Session Mode, Port 5432)
   - `AUTH_JWT_SECRET` (JWT Secret)
3. Build command: `npm run build`
4. Health check endpoint: `GET /api/health`

---

## Verification & Tests

```bash
# Run unit & integration test suites
npm run test

# Run ESLint validation
npm run lint

# Run production build
npm run build
```
