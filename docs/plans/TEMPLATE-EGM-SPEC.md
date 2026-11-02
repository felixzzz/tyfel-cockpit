# [Feature / System Name] Technical Specification (EGM)

> **Elephant-Goldfish Model (EGM) Status:**
> - [ ] **Phase 1: Elephant Draft** (Complete architectural mapping)
> - [ ] **Phase 2: Goldfish Stress-Test** (Adversarial critique by zero-context agent)
> - [ ] **Phase 3: Arbitration & Hardening** (Resolutions integrated into spec)
> - [ ] **Phase 4: TDD & Execution** (Tests written, code implemented)

---

## 1. Context & Business Value
- **Domain Scope**: (e.g., Recipe COGS, Bank Rec, Stock Opname, Catering, Payroll)
- **Target Brands / Outlets**: (e.g., Herbox, People Pasta, LA Breakfast Club, Central Commissary)
- **Problem Statement**: What breaks or leaks money if this is not built correctly?
- **Success Metrics**: (e.g., 0% variance discrepancies, < 100ms calculation overhead, zero manual bank re-entries)

---

## 2. Invariants & Calculation Rules
*Define strict mathematical and domain rules that must NEVER be violated.*

1. **Precision & Units**: (e.g., currency in integer IDR, inventory in grams/ml with standard conversion coefficients).
2. **Formula Specifications**:
   $$\text{Variance \%} = \frac{\text{Actual Qty} - \text{Theoretical Qty}}{\text{Theoretical Qty}} \times 100$$
3. **Boundary Guarantees**: (e.g., balances cannot drop below 0 without superadmin override; duplicate invoice hashes rejected).

---

## 3. Data Schema & Contracts (PostgreSQL / Drizzle ORM)

### Drizzle Schema Changes
```typescript
// Proposed schema changes in src/db/schema.ts
```

### Server Action / API Route Contracts
- **Route**: `POST /api/...`
- **RBAC Required**: `superadmin` | `admin` | `staff`
- **Request Payload**:
  ```typescript
  export interface RequestPayload { ... }
  ```
- **Response Payload**:
  ```typescript
  export interface ResponsePayload { ... }
  ```

---

## 4. Failure Modes & Edge Case Matrix
*To be populated and audited by the Goldfish reviewer.*

| Scenario / Edge Case | Expected System Behavior | Fallback / Rollback Strategy |
| :--- | :--- | :--- |
| Network disconnect mid-transaction | Atomic DB transaction rolls back | Show retry modal with persisted form draft |
| Concurrent update to same stock batch | Optimistic locking / version check | Abort second writer with 409 Conflict |
| Division by zero (e.g. 0 initial stock) | Return 0% or explicit `N/A` | Prevent NaN / crash |

---

## 5. Goldfish Adversarial Critique Log
*Record feedback from the zero-context `goldfish-reviewer` subagent here.*

### Round 1 Goldfish Findings
- [ ] **Critical 1**: ...
- [ ] **Edge Case 1**: ...
- [ ] **Resolution / Mitigation**: ...

---

## 6. Implementation & Verification Plan (TDD)
- **Step 1: Vitest Test Suite** (`src/lib/__tests__/....test.ts`)
  - [ ] Unit tests for formulas & edge cases
  - [ ] RBAC verification tests
- **Step 2: Database Schema & Migration** (`npm run db:push`)
- **Step 3: Core Business Logic** (`src/lib/...`)
- **Step 4: UI Workbench / Components** (`src/components/...`)
- **Step 5: Full Suite Pass** (`npm run test && npm run lint`)
