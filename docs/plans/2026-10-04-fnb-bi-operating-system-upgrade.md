# F&B Operating System & BI Intelligence Upgrade Implementation Plan

> **For Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the F&B Cockpit into a proactive decision-support OS by adding: (1) SKU-Level Net Contribution & Menu Engineering (BCG Matrix), (2) Hourly Labor Efficiency & SPLH Analysis, (3) Stock Opname & Variance Tracking Engine, and (4) Catering Customer Retention & Auto-Renewal Pipeline.

**Architecture:**
- Analytical layer: DuckDB SQL queries with Postgres parity for multi-brand menu engineering and attendance-order hourly correlation.
- Persistence layer: Drizzle ORM schema extensions for physical stock opname records and variance audits.
- UI layer: Interactive Next.js App Router client components with responsive charts, quadrant matrix filters, and WhatsApp re-engagement hooks.

**Tech Stack:** Next.js 15 (App Router, React 19), DuckDB Node API, PostgreSQL (Drizzle ORM), Recharts, Tailwind CSS v4, Lucide Icons.

---

### Task 1: Menu Engineering (BCG Matrix) & SKU Net Margin Engine

**Files:**
- Modify: `src/lib/queries.ts`
- Create: `src/components/MenuEngineeringMatrix.tsx`
- Modify: `src/components/DashboardWorkspace.tsx`

**Step 1: Implement Menu Engineering & SKU Contribution query in `src/lib/queries.ts`**
Add `getMenuEngineeringMatrix(filters: QueryFilters)`:
- Calculates item quantity, gross revenue, average price.
- Blends platform cut (~20% on delivery), merchant promo burn per item.
- Incorporates BOM food cost and delivery packaging.
- Calculates net realization Rp, unit contribution margin Rp and %, total contribution margin Rp.
- Categorizes each menu into: Star, Plowhorse, Puzzle, Dog.

**Step 2: Create `src/components/MenuEngineeringMatrix.tsx`**
- Interactive quadrant selector: All, Stars, Plowhorses, Puzzles, Dogs.
- Visual quadrant summary cards (Revenue share, average contribution margin %, recommended actions).
- Table view with sortable columns: Selling Price, Platform Cut, COGS, Net Margin Rp, Margin %, and Action badge.

**Step 3: Integrate into `DashboardWorkspace.tsx`**
- Add "Menu Engineering (BCG)" sub-section/tab or overview card to view SKU profitability.

---

### Task 2: Hourly Labor Efficiency & SPLH (Sales Per Labor Hour) Engine

**Files:**
- Modify: `src/lib/queries.ts`
- Create: `src/components/HourlyLaborEfficiencyChart.tsx`
- Modify: `src/components/DashboardWorkspace.tsx`

**Step 1: Implement `getHourlyLaborEfficiency(filters: QueryFilters)` in `src/lib/queries.ts`**
- Joins order hourly trends with attendance shift hours (`clockIn` to `clockOut`).
- Computes hourly active staff headcount, estimated hourly labor cost.
- Computes SPLH (Sales Per Labor Hour = Hourly GMV / Active Staff).
- Identifies overstaffed dead hours (high labor %, low sales) vs understaffed bottleneck hours (SLA breach spike).

**Step 2: Create `src/components/HourlyLaborEfficiencyChart.tsx`**
- Recharts combo chart (Bars for hourly GMV, Line for SPLH and Active Kru count).
- Peak efficiency badge and dead-hour cost leak alerts.

**Step 3: Integrate into `DashboardWorkspace.tsx` & `/attendance`**
- Connect to existing dashboard SLA & Economics tab.

---

### Task 3: Physical Stock Opname & Variance Tracking Engine

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/lib/inventory.ts`
- Create: `src/app/api/inventory/opname/route.ts`
- Create: `src/components/StockOpnameModal.tsx`
- Modify: `src/components/InventoryWorkbench.tsx`

**Step 1: Extend schema in `src/db/schema.ts`**
- Add `stockOpnameRecords` and `stockOpnameItems`.

**Step 2: Add Variance calculation functions in `src/lib/inventory.ts`**
- `calculateStockOpnameVariance(opnameItems)`:
  - Compares `actualQty` vs `systemStock`.
  - Calculates `varianceQty`, `varianceValueRp` (`varianceQty * purchasePrice`), and `variancePct`.
  - Flags shrinkage above 2.5% threshold.

**Step 3: Create API route `src/app/api/inventory/opname/route.ts`**
- Handles POST to submit stock opname count and retrieve variance history.

**Step 4: Create UI `StockOpnameModal.tsx` and hook into `InventoryWorkbench.tsx`**
- Clean modal allowing outlet managers to select branch, input physical stock counts, and immediately see shrinkage/variance diagnostics.

---

### Task 4: Catering Renewal & Retention Pipeline

**Files:**
- Modify: `src/lib/catering.ts`
- Modify: `src/app/catering/page.tsx`

**Step 1: Implement `getCateringRenewalPipeline()` in `src/lib/catering.ts`**
- Calculates remaining boxes per customer package (`totalBoxes - deliveredBoxes`).
- Groups into: `CRITICAL_RENEWAL` ($\le 3$ boxes), `UPCOMING_EXPIRY` (4-7 boxes), `EXPIRED_NO_RENEWAL` ($0$ boxes).
- Formats Indonesian WhatsApp direct-renewal templates with payment details.

**Step 2: Add Renewal & Retention Section in `src/app/catering/page.tsx`**
- Top-level alert banner for packages nearing completion.
- Pipeline list with one-click "Kirim WA Renewal" button opening pre-filled WhatsApp Web link.

---

### Task 5: Testing & Production Build Validation

- Run TypeScript check and `npm run build` to verify zero compile errors.
- Verify smooth rendering across all routes (`/`, `/recipes`, `/catering`, `/attendance`, `/finance`).
