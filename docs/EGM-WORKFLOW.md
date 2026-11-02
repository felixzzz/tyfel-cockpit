# Elephant-Goldfish Model (EGM) Workflow in Tyfel Hub

This document defines how **Spec-Driven Development (SDD)** is executed in `fnb-ops` using the **Elephant-Goldfish Model (EGM)**.

```
       +-------------------------------------------------------------+
       |                         USER REQUEST                        |
       +-------------------------------------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                PHASE 1: THE ELEPHANT (DRAFT)                |
       |  - Deep-context architect designs spec in docs/plans/       |
       |  - Maps domain rules, Drizzle schemas, APIs & math formulas |
       +-------------------------------------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |               PHASE 2: THE GOLDFISH (ATTACK)                |
       |  - Fresh, zero-context agent stress-tests the draft         |
       |  - Uncovers hidden edge cases, race conditions, ambiguities |
       +-------------------------------------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |            PHASE 3: HUMAN ARBITRATION & HARDENING           |
       |  - Review critiques, resolve edge cases, finalize plan      |
       +-------------------------------------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |             PHASE 4: TDD & ATOMIC IMPLEMENTATION            |
       |  - Write Vitest tests first                                 |
       |  - Implement business logic & Drizzle migrations            |
       |  - Full green test suite validation                         |
       +-------------------------------------------------------------+
```

---

## The Two Personas

### 1. The Elephant (`elephant-architect`)
- **Memory**: Deep, cumulative project context.
- **Responsibilities**:
  - Knows our schema, multi-brand F&B operations, payroll logic, and bank reconciliation quirks.
  - Drafts comprehensive specs using [docs/plans/TEMPLATE-EGM-SPEC.md](TEMPLATE-EGM-SPEC.md).

### 2. The Goldfish (`goldfish-reviewer`)
- **Memory**: 3 seconds (clean slate, zero baggage).
- **Responsibilities**:
  - Reads **only** the newly created spec.
  - Plays the role of an adversarial auditor.
  - Asks: *"What happens if this input is 0? What if two managers submit stock opname at 11:59 PM? What if the bank CSV has duplicate reference numbers?"*

---

## How to Trigger the EGM Workflow in Chat

### Step 1: Draft the Spec
Tell the assistant:
> *"Let's draft an EGM spec for [feature name, e.g. Central Kitchen Purchase Order & Supplier Invoicing]."*

The Elephant drafts `docs/plans/YYYY-MM-DD-<feature-name>.md`.

### Step 2: Trigger the Goldfish
Tell the assistant:
> *"Now run the Goldfish review on docs/plans/YYYY-MM-DD-<feature-name>.md."*

The assistant invokes the `goldfish-reviewer` subagent with the spec text.

### Step 3: Review and Arbitrate
The Goldfish produces a critique of critical vulnerabilities and edge cases. You and the assistant resolve each item and update the spec.

### Step 4: Execute with TDD
Once the plan is marked hardened, code is written against Vitest test suites.
