# Monolith Pages Refactoring & Printable Operations (EGM Spec)

> **Elephant-Goldfish Model (EGM) Status:**
> - [x] **Phase 1: Elephant Draft** (Complete architectural mapping)
> - [x] **Phase 2: Goldfish Stress-Test** (Adversarial critique logged and resolved)
> - [x] **Phase 3: Arbitration & Hardening** (Resolutions integrated into spec)
> - [x] **Phase 4: TDD & Execution** (In progress)

---

## 1. Context & Business Value

### Domain Scope
- **F&B Operating System Cockpit**: Recipes & COGS costing, Labor & Attendance/Payslips, Catering CRM & Dispatch, Inventory & Stock Opname.
- **Target Brands**: Tyfel Coffee, American Breakfast Club, People Pasta, Herbox, LA Breakfast Club.

### Problem Statement
1. **Monolithic Page Debt**:
   - `src/app/catering/page.tsx` has ballooned to **3,714 lines**.
   - `src/app/attendance/page.tsx` has reached **2,638 lines**.
   - `src/app/recipes/page.tsx` has grown to **2,105 lines**.
   These giant files create slow Next.js Hot Module Replacement (HMR), high cognitive overhead, difficulty writing granular component tests, and heightened risk of merge conflicts and regression during feature updates.
2. **Missing Operational Print Artifacts**:
   - Outlet kitchen managers conducting physical inventory in chillers, freezers, and dry storage need a **Printable Stock Opname Sheet (Lembar Hitung Fisik)** with category groupings, storage zones, optional blind counting, and audit signatures.
   - Staff payroll transparency requires an official, high-contrast, print-optimized **Employee Payslip PDF / Print Document (Slip Gaji Karyawan)** formatted for standard A4 and receipt printing with exact legal deduction/allowance breakdowns and dual-signature sign-off.

### Success Metrics
- Each main page file reduced to < 350 lines of clean, composable Next.js App Router code.
- Zero behavioral regressions across all existing features, state modifications, and API interactions.
- Flawless `@media print` formatting with zero background clutter, correct page breaks, and high contrast typography.
- 100% pass on all existing and new Vitest suites, ESLint, and production build.

---

## 2. Invariants & Calculation Rules

1. **Zero Regression Invariant**:
   - All state management (modals, filters, optimistic updates, search params, mutations) must retain identical functionality.
   - All API endpoints (`/api/recipes`, `/api/attendance`, `/api/catering`, `/api/inventory/opname`) continue receiving the exact same contract payloads.

2. **Payslip Calculation Invariant**:
   $$\text{Take Home Pay} = \text{Basic Salary} + (\text{Daily Count} \times \text{Daily Rate}) + (\text{Half Day Count} \times \text{Half Day Rate}) + (\text{Bonus Qty} \times \text{Bonus Rate}) + \text{Custom Allowance} - \text{Late Penalties} - \text{Kasbon Deductions} - \text{Custom Deductions}$$
   - Any manual override (`basicSalaryOverride`, `dailyRateOverride`, `latePenaltyOverride`, etc.) takes precedence over employee master defaults.

3. **Print Layout Invariants**:
   - All interactive UI chrome (`navbar`, `sidebar`, `cockpit-panel`, action buttons, modals, backdrop overlays) MUST be hidden during `@media print` via `.no-print`.
   - The printable document (`.print-sheet`) must occupy 100% width, reset background to `#ffffff`, text to `#000000` / `#18181b`, use explicit border styling, and set `break-inside: avoid` on table rows and signature blocks to prevent broken page splits.

4. **Stock Opname Blind vs Guided Count**:
   - In **Blind Count Mode**, the `System Stock` column is blanked with dashes (`-`) or empty checkboxes so auditors physically count without confirmation bias.
   - In **Guided Count Mode**, `System Stock` is displayed as a reference baseline.

---

## 3. Data Schema & Contracts

### Component Architecture & Contracts

#### A. Recipes & COGS Decomposition (`src/components/recipes/`)
- `RecipesCatalogTab.tsx`: Recipe cards, brand filtering, hero BOM badge, inline BOM ingredient editor, recipe creation modal.
- `IngredientsCatalogTab.tsx`: Master ingredients catalog table, search & category filtering, unit conversion, upsert modal.
- `CogsSimulatorTab.tsx`: Interactive inflation price shock simulator with dynamic margin impact calculation.
- `types.ts`: Shared recipe UI types.

#### B. Attendance & Payslip Decomposition (`src/components/attendance/`)
- `PayslipCard.tsx`: The canonical Tyfel Coffee payslip card visual (supports regular, modal, and light/dark modes).
- `PrintablePayslipModal.tsx`: Dedicated print & PDF modal with printable A4 slip, salary breakdown, and signature block.
- `PayslipEditor.tsx`: Right-hand editor form for per-period salary overrides, custom allowances, kasbon, and notes.
- `AttendanceMatrixTable.tsx`: Staff payroll roster table with batch payment toggle and status filters.
- `AttendanceLogsTable.tsx`: Detailed clock-in/out log inspector with anomaly badges and live search.
- `AttendanceHeader.tsx`: Cycle selector, period switcher, CSV upload modal, and aggregate KPI cards.

#### C. Catering CRM Decomposition (`src/components/catering/`)
- `CateringHeader.tsx`: Brand header, month/date picker, quick metrics, and renewal reminder banner.
- `CateringMatrixView.tsx`: Full monthly schedule matrix grid with day headers and cell slots.
- `CateringDispatchView.tsx`: Daily delivery dispatch board, driver groupings, and box checklist.
- `CateringCrmView.tsx`: Customer subscription roster, active packages, remaining box countdown, and renewal pipeline.
- Modals:
  - `CateringSlotModal.tsx`: Edit cell delivery slot, meal notes, and status.
  - `CateringExtendModal.tsx`: Renew or extend customer package.
  - `CateringCustomerModal.tsx`: Create or edit customer profile.
  - `CateringManifestModal.tsx`: Printable driver delivery manifest.
  - `CateringWhatsAppModal.tsx`: Pre-filled Indonesian WhatsApp dispatch and renewal broadcast templates.
  - `CateringInvoiceModal.tsx`: Billing and invoice generator.

#### D. Printable Stock Opname (`src/components/inventory/`)
- `PrintableStockOpnameSheet.tsx`:
  - Props:
    ```typescript
    export interface PrintableStockOpnameSheetProps {
      isOpen: boolean;
      onClose: () => void;
      ingredients: IngredientInventoryItem[];
      branch?: string;
      conductedBy?: string;
    }
    ```
  - Controls: Blind count toggle, category filter, date/shift selector, print button (`window.print()`).

---

## 4. Failure Modes & Edge Case Matrix

| Scenario / Edge Case | Expected System Behavior | Fallback / Rollback Strategy |
| :--- | :--- | :--- |
| Zero payslips in selected period | Display empty state illustration and disable print button | Provide "Upload Attendance Data" button |
| Overflowing ingredients list in print | Print stylesheet allows natural page breaks between table rows without clipping | `tr { break-inside: avoid; }` |
| Dark mode active when user prints | CSS `@media print` forces background to white and text to black | `-webkit-print-color-adjust: exact` with explicit monochrome borders |
| Special characters in notes or names | Handled safely in JSX without rendering artifacts | Sanitized text rendering |
| Modal background click | Closes print modal and restores normal web view | Click outside handler with `e.target === e.currentTarget` |

---

## 5. Goldfish Adversarial Critique Log

### Round 1 Goldfish Findings
- [x] **Critique 1**: *If the monolith pages are broken into separate components, how do we prevent prop drilling from causing state synchronization bugs (e.g. updating an employee override in `PayslipEditor` not immediately reflecting on `PayslipCard` and `AttendanceMatrixTable`)?*
  - **Resolution**: Keep the source-of-truth state in the top-level page orchestrator (`attendance/page.tsx`, `catering/page.tsx`, `recipes/page.tsx`) and pass explicit callback props (`onUpdateReport`, `onSaveAdjustment`, `onMutateSlot`). This preserves 100% parity with existing state behavior without introducing external state store complexities.
- [x] **Critique 2**: *In `PrintableStockOpnameSheet`, what happens if an outlet has 200+ ingredients? Will the print dialog choke or cut off table headers?*
  - **Resolution**: Use HTML `<thead>` with `display: table-header-group` and `<tfoot>` with `display: table-footer-group` so browsers automatically repeat table headers on every subsequent printed page. Group items by Category with clean subheader rows.
- [x] **Critique 3**: *How do we ensure that printing the Payslip from the modal does not print the background page content behind it?*
  - **Resolution**: Add a global print stylesheet class `.print-only-container` that has `display: block !important` in `@media print` while adding `.no-print` to all top-level wrappers (`<main>`, `<nav>`, `<aside>`).

---

## 6. Implementation & Verification Plan (TDD)

- **Step 1: Printable Operations Components**:
  - Implement `PrintableStockOpnameSheet.tsx` in `src/components/inventory/`
  - Connect to `StockOpnameModal.tsx` and `InventoryWorkbench.tsx`
  - Implement `PrintablePayslipModal.tsx` in `src/components/attendance/`
- **Step 2: Recipes Page Decomposition**:
  - Extract `RecipesCatalogTab.tsx`, `IngredientsCatalogTab.tsx`, `CogsSimulatorTab.tsx`
  - Simplify `src/app/recipes/page.tsx`
- **Step 3: Attendance Page Decomposition**:
  - Extract `PayslipCard.tsx`, `PayslipEditor.tsx`, `AttendanceMatrixTable.tsx`, `AttendanceLogsTable.tsx`, `AttendanceHeader.tsx`
  - Simplify `src/app/attendance/page.tsx`
- **Step 4: Catering Page Decomposition**:
  - Extract sub-views and modals into `src/components/catering/`
  - Simplify `src/app/catering/page.tsx`
- **Step 5: Automated Testing & Build Validation**:
  - Add unit tests for printable utilities and payslip formatting
  - Run `npm test`
  - Run `npm run egm:lint docs/plans/2026-11-22-monolith-refactor-and-printable-ops.md`
  - Run `npm run lint`
  - Run `npm run build`
