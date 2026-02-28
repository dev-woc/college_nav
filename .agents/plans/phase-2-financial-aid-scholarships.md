# Feature: Phase 2 — Financial Aid Agent + Scholarship Matching

The following plan should be complete, but validate documentation and codebase patterns before starting.
Pay special attention to naming of existing utils, types, and models. Import from the right files.

---

## Feature Description

Phase 2 adds two new agents — the **Financial Aid Agent** and the **Scholarship Matching Agent** — along with their supporting data layer, API routes, and UI. Students can see a side-by-side financial comparison across all colleges on their list, upload award letters for AI-powered parsing, and receive matched scholarship opportunities with deadline tracking. An email notification system sends deadline reminders via Resend.

## User Story

As a first-generation high school senior
I want to see exactly what each college on my list will cost me (not the sticker price), get matched to scholarships I qualify for, and receive reminders before scholarship deadlines
So that I can make a financially informed decision and never miss money I'm eligible for

## Problem Statement

Phase 1 surfaces a tiered college list with net prices. But students can't yet compare costs side-by-side, upload award letters, discover scholarships, or receive proactive notifications — the core gaps between a passive information tool and an active financial guidance system.

## Solution Statement

1. Add schema tables for scholarships, student scholarship matches, and parsed award letters
2. Enhance the `colleges` table with cost-of-attendance and tuition breakdown fields
3. Build Financial Aid Agent: calculates 4-year cost model + debt projection per student income bracket
4. Build award letter parser: Groq-powered text parsing that categorizes grant/loan/work-study
5. Build Scholarship Matching Agent: scores 50+ seeded scholarships against student profile attributes
6. Build side-by-side financial comparison UI on student dashboard
7. Add Resend email for scholarship deadline reminders (Vercel Cron triggered)

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: DB schema, agent layer, API routes, student UI, email
**Dependencies**: `resend` npm package, `RESEND_API_KEY` env var

---

## CONTEXT REFERENCES

### Relevant Codebase Files — MUST READ BEFORE IMPLEMENTING

- `src/lib/db/schema.ts` — All table/enum patterns; use same imports (pgTable, pgEnum, uuid, text, etc.)
- `src/lib/db/index.ts` — Lazy Proxy DB init pattern; do not call `neon()` at module load
- `src/lib/agents/discovery/index.ts` — Agent runner pattern: create agentRuns record → run → update status → return summary. MIRROR THIS EXACTLY.
- `src/lib/agents/discovery/scoring.ts` — Scoring pattern: pure function, typed inputs, clamp helper
- `src/lib/agents/discovery/explanations.ts` — Groq LLM call pattern: `createGroq` + `generateText` from `ai`, `maxOutputTokens` (NOT `maxTokens`)
- `src/lib/integrations/scorecard.ts` — External API fetch pattern with DB upsert; field mapping function
- `src/app/api/agents/discovery/route.ts` — Agent trigger route pattern: auth → rate limit → student check → run agent → 202 response
- `src/app/api/student/college-list/route.ts` — GET route pattern with join queries
- `src/lib/auth/server.ts` — `auth.getSession()` → `{ data: { user: { id } } }` or null; SKIP_AUTH mock
- `src/lib/ai/client.ts` — Lazy Proxy for Anthropic client (reference for Resend lazy init pattern)
- `src/lib/rate-limit.ts` — `createRateLimiter(maxReq, windowMs)` factory + pre-exported limiters
- `src/lib/validations.ts` — Zod schema patterns; use `.safeParse()`, `.refine()`, `.enum()`
- `src/types/index.ts` — `InferSelectModel<typeof table>` pattern for type exports
- `src/components/student/college-card.tsx` — Existing card UI pattern (shadcn Card, Tailwind classes)
- `src/components/student/college-list.tsx` — List component pattern with tier grouping
- `src/app/student/dashboard/page.tsx` — Page auth flow: session check → role check → onboarding check → fetch data → render
- `src/lib/__tests__/rate-limit.test.ts` — Vitest pattern: `describe/it/expect`
- `src/lib/agents/discovery/__tests__/scoring.test.ts` — Agent unit test pattern

### New Files to Create

```
src/
├── lib/
│   ├── db/
│   │   └── schema.ts                   UPDATE — add scholarships, studentScholarships, awardLetters tables;
│   │                                           add costOfAttendance/tuition fields to colleges
│   ├── agents/
│   │   ├── financial-aid/
│   │   │   ├── index.ts                NEW — Financial Aid Agent runner
│   │   │   ├── net-price.ts            NEW — 4-year cost model + debt projection calculations
│   │   │   └── __tests__/net-price.test.ts  NEW — unit tests for financial calculations
│   │   └── scholarships/
│   │       ├── index.ts                NEW — Scholarship Matching Agent runner
│   │       ├── matching.ts             NEW — profile-based scholarship scoring algorithm
│   │       ├── seed-data.ts            NEW — 50+ curated national scholarships
│   │       └── __tests__/matching.test.ts   NEW — unit tests for matching algorithm
│   ├── email/
│   │   └── index.ts                    NEW — Resend client (lazy init) + sendScholarshipReminder()
│   └── integrations/
│       └── scorecard.ts                UPDATE — fetch costOfAttendance, tuitionInState, tuitionOutOfState
├── app/
│   ├── api/
│   │   ├── agents/
│   │   │   ├── financial-aid/
│   │   │   │   └── route.ts            NEW — POST: trigger Financial Aid Agent
│   │   │   └── scholarships/
│   │   │       └── route.ts            NEW — POST: trigger Scholarship Matching Agent
│   │   ├── financial-aid/
│   │   │   ├── route.ts                NEW — GET: financial aid summary for student list
│   │   │   └── award-letter/
│   │   │       └── route.ts            NEW — POST: parse uploaded award letter text
│   │   ├── scholarships/
│   │   │   ├── route.ts                NEW — GET: matched scholarships for student
│   │   │   └── seed/
│   │   │       └── route.ts            NEW — POST: seed scholarship DB (dev/admin only)
│   │   └── cron/
│   │       └── scholarship-reminders/
│   │           └── route.ts            NEW — GET: send deadline reminder emails (Vercel Cron)
│   └── student/
│       └── financial-aid/
│           └── page.tsx                NEW — Financial Aid & Scholarships page
├── components/
│   └── student/
│       ├── financial-comparison.tsx    NEW — Side-by-side cost comparison table
│       ├── award-letter-uploader.tsx   NEW — Text paste + parsed award letter display
│       └── scholarship-list.tsx        NEW — Matched scholarships with deadline badges
└── types/
    └── index.ts                        UPDATE — add FinancialAidSummary, ScholarshipMatch, AwardLetter types
```

### Relevant Documentation — SHOULD READ BEFORE IMPLEMENTING

- College Scorecard cost fields: `latest.cost.attendance.academic_year`, `latest.cost.tuition.in_state`, `latest.cost.tuition.out_of_state` — already researched; see patterns section below
- Vercel Cron documentation: add `vercel.json` with `{ "crons": [{ "path": "/api/cron/scholarship-reminders", "schedule": "0 9 * * *" }] }` (daily at 9am UTC)
- Resend Next.js guide: `npm install resend`, import `{ Resend }` from `"resend"`, `new Resend(process.env.RESEND_API_KEY)`
- Federal monthly payment formula: `M = P × [r(1+r)^n / ((1+r)^n - 1)]` where `P = principal, r = monthly rate (6.8% / 12), n = 120 months (10 years)`

### Patterns to Follow

**Agent Runner Pattern** (MIRROR from `src/lib/agents/discovery/index.ts`):
```typescript
export async function runFinancialAidAgent(studentProfileId: string): Promise<string> {
  const startedAt = new Date();
  const [run] = await db.insert(agentRuns).values({ studentProfileId, agentType: "financial_aid", status: "running", startedAt }).returning();
  try {
    // ... do work ...
    await db.update(agentRuns).set({ status: "completed", summary, durationMs: ..., completedAt: new Date() }).where(eq(agentRuns.id, run.id));
    return summary;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await db.update(agentRuns).set({ status: "failed", errorMessage, durationMs: ..., completedAt: new Date() }).where(eq(agentRuns.id, run.id));
    throw error;
  }
}
```

**Agent API Route Pattern** (MIRROR from `src/app/api/agents/discovery/route.ts`):
```typescript
export const dynamic = "force-dynamic";
// rate limit → auth.getSession() → validate student → run agent → return 202
```

**LLM Call Pattern** (MIRROR from `src/lib/agents/discovery/explanations.ts`):
```typescript
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.3-70b-versatile");
const { text } = await generateText({ model, prompt, maxOutputTokens: 2048 });
```

**Lazy Resend Init Pattern** (follow `src/lib/ai/client.ts` Proxy pattern):
```typescript
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) { _resend = new Resend(process.env.RESEND_API_KEY!); }
  return _resend;
}
export const resend = new Proxy({} as Resend, { get(_, prop: string) { return (getResend() as any)[prop]; } });
```

**Income Bracket Net Price Field Mapping** (from `colleges` table):
```typescript
const NET_PRICE_FIELD: Record<IncomeBracket, keyof College> = {
  "0_30k":    "netPrice0_30k",
  "30_48k":   "netPrice30_48k",
  "48_75k":   "netPrice48_75k",
  "75_110k":  "netPrice75_110k",
  "110k_plus":"netPrice110kPlus",
};
function getNetPrice(college: College, bracket: IncomeBracket): number | null {
  return college[NET_PRICE_FIELD[bracket]] as number | null;
}
```

**Scholarship Matching Score Pattern** (pure function, 0-100):
```typescript
export function scoreScholarship(scholarship: Scholarship, student: StudentProfile): number {
  let score = 0;
  if (scholarship.requiresFirstGen && !student.isFirstGen) return 0; // hard disqualifier
  if (scholarship.minGpa !== null && student.gpa !== null && student.gpa < scholarship.minGpa) return 0;
  if (scholarship.requiresFirstGen && student.isFirstGen) score += 30;
  // ... more scoring
  return Math.min(100, score);
}
```

**Drizzle JSON/Array Storage**: Use `text()` column + `JSON.stringify/parse` for arrays/objects (no jsonb in free Neon tier schema). Example: `eligibleStates: text("eligible_states")` stored as `JSON.stringify(["CA", "AZ"])`.

**Error handling in route**: Return `NextResponse.json({ error: "..." }, { status: 400/401/500 })`.

---

## IMPLEMENTATION PLAN

### Phase 1: Schema + Types Foundation

Extend the DB schema with 3 new tables and enhance the `colleges` table. Update types and run migration.

**Tasks:**
- ADD `scholarshipStatusEnum` pgEnum to schema.ts
- ADD `costOfAttendance`, `tuitionInState`, `tuitionOutOfState` columns to `colleges` table
- ADD `scholarships` table with full eligibility fields
- ADD `studentScholarships` junction table
- ADD `awardLetters` table
- ADD Drizzle relations for new tables
- UPDATE `scorecard.ts` to fetch and map new cost fields
- UPDATE `types/index.ts` with new exported types
- RUN `db:push` to apply schema

### Phase 2: Financial Aid Agent + API

Build the Financial Aid Agent that computes net price, 4-year cost, and debt projection for every college on the student's list.

**Tasks:**
- CREATE `net-price.ts` with pure calculation functions (no LLM needed — all structured data)
- CREATE `financial-aid/index.ts` agent runner (MIRROR discovery agent pattern)
- CREATE `POST /api/agents/financial-aid` route
- CREATE `GET /api/financial-aid` route (returns financial summary per college on list)
- WRITE unit tests for net-price calculations

### Phase 3: Award Letter Parser

Build the Groq-powered award letter parser that accepts pasted text and categorizes components.

**Tasks:**
- CREATE `award-letter-parser.ts` with Groq prompt + response parser
- CREATE `POST /api/financial-aid/award-letter` route (text input, returns parsed components)
- Store parsed result in `awardLetters` table

### Phase 4: Scholarship Matching Agent

Build the Scholarship Matching Agent with seeded data and profile-based scoring.

**Tasks:**
- CREATE `seed-data.ts` with 50 curated national scholarships
- CREATE `matching.ts` with scoring algorithm
- CREATE `scholarships/index.ts` agent runner
- CREATE `POST /api/scholarships/seed` route (dev/admin only)
- CREATE `POST /api/agents/scholarships` route
- CREATE `GET /api/scholarships` route
- WRITE unit tests for matching algorithm

### Phase 5: Email Notifications

Add Resend email client and Vercel Cron for daily scholarship deadline reminders.

**Tasks:**
- INSTALL `resend` package
- ADD `RESEND_API_KEY` and `CRON_SECRET` to `.env.example`
- CREATE `email/index.ts` with lazy Resend init + `sendScholarshipReminder()` helper
- CREATE `GET /api/cron/scholarship-reminders` route (protected by `CRON_SECRET` header)
- ADD `vercel.json` with cron schedule

### Phase 6: UI

Build the Financial Aid page with side-by-side comparison, award letter upload, and scholarship list.

**Tasks:**
- CREATE `financial-comparison.tsx` component (table with each college as column)
- CREATE `award-letter-uploader.tsx` component (textarea + submit + parsed breakdown)
- CREATE `scholarship-list.tsx` component (cards with match score + deadline badge)
- CREATE `src/app/student/financial-aid/page.tsx` (full page assembling components)
- ADD navigation link from dashboard to financial aid page

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### TASK 1: UPDATE `src/lib/db/schema.ts` — Add new enum + columns + tables

- **ADD** `scholarshipStatusEnum = pgEnum("scholarship_status", ["matched", "applied", "awarded", "rejected"])` after existing enums
- **ADD** three columns to `colleges` table body (after `studentSize`):
  ```typescript
  costOfAttendance: integer("cost_of_attendance"),
  tuitionInState: integer("tuition_in_state"),
  tuitionOutOfState: integer("tuition_out_of_state"),
  ```
- **ADD** `scholarships` table after `agentRuns`:
  ```typescript
  export const scholarships = pgTable("scholarships", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    amount: integer("amount"),             // null = varies
    amountMin: integer("amount_min"),
    amountMax: integer("amount_max"),
    deadlineText: text("deadline_text").notNull().default(""), // "March 1 annually"
    deadlineMonth: integer("deadline_month"),  // 1-12, null = rolling
    deadlineDay: integer("deadline_day"),
    minGpa: real("min_gpa"),
    requiresFirstGen: boolean("requires_first_gen").notNull().default(false),
    requiresEssay: boolean("requires_essay").notNull().default(false),
    eligibleStates: text("eligible_states"),   // JSON.stringify(string[]) or null=national
    eligibleMajors: text("eligible_majors"),   // JSON.stringify(string[]) or null=any
    demographicTags: text("demographic_tags"), // JSON.stringify(string[]) e.g. ["hispanic", "black"]
    applicationUrl: text("application_url").notNull().default(""),
    renewable: boolean("renewable").notNull().default(false),
    source: text("source").notNull().default("curated"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }, (table) => [
    index("idx_scholarships_deadline_month").on(table.deadlineMonth),
    index("idx_scholarships_first_gen").on(table.requiresFirstGen),
  ]);
  ```
- **ADD** `studentScholarships` table:
  ```typescript
  export const studentScholarships = pgTable("student_scholarships", {
    id: uuid("id").defaultRandom().primaryKey(),
    studentProfileId: uuid("student_profile_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
    scholarshipId: uuid("scholarship_id").notNull().references(() => scholarships.id, { onDelete: "cascade" }),
    matchScore: real("match_score").notNull(),
    matchReasons: text("match_reasons").notNull().default("[]"), // JSON.stringify(string[])
    status: scholarshipStatusEnum("status").notNull().default("matched"),
    agentRunId: uuid("agent_run_id"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }, (table) => [
    uniqueIndex("idx_student_scholarships_pair").on(table.studentProfileId, table.scholarshipId),
    index("idx_student_scholarships_student").on(table.studentProfileId),
    index("idx_student_scholarships_deadline").on(table.scholarshipId),
  ]);
  ```
- **ADD** `awardLetters` table:
  ```typescript
  export const awardLetters = pgTable("award_letters", {
    id: uuid("id").defaultRandom().primaryKey(),
    studentProfileId: uuid("student_profile_id").notNull().references(() => studentProfiles.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "set null" }),
    collegeName: text("college_name").notNull().default(""),
    academicYear: text("academic_year").notNull().default(""),
    rawText: text("raw_text").notNull().default(""),
    components: text("components").notNull().default("[]"), // JSON.stringify(AidComponent[])
    freeMoneyTotal: integer("free_money_total").notNull().default(0),
    loanTotal: integer("loan_total").notNull().default(0),
    workStudyTotal: integer("work_study_total").notNull().default(0),
    outOfPocket: integer("out_of_pocket").notNull().default(0),
    agentRunId: uuid("agent_run_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }, (table) => [
    index("idx_award_letters_student").on(table.studentProfileId),
    index("idx_award_letters_college").on(table.collegeId),
  ]);
  ```
- **ADD** Drizzle relations for all 3 new tables (follow existing relation patterns at bottom of schema.ts)
- **VALIDATE**: `npx tsc --noEmit` passes with no schema errors

---

### TASK 2: UPDATE `src/lib/integrations/scorecard.ts` — Add cost fields

- **ADD** to the Scorecard field fetch params (find the `_fields` parameter list): `latest.cost.attendance.academic_year,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state`
- **UPDATE** `scorecardToDbValues()` mapping function to map:
  ```typescript
  costOfAttendance: result.latest?.cost?.attendance?.academic_year ?? null,
  tuitionInState:   result.latest?.cost?.tuition?.in_state ?? null,
  tuitionOutOfState: result.latest?.cost?.tuition?.out_of_state ?? null,
  ```
- **VALIDATE**: `npx tsc --noEmit` passes

---

### TASK 3: UPDATE `src/types/index.ts` — Add new exported types

- **ADD** after existing type exports:
  ```typescript
  export type Scholarship = InferSelectModel<typeof scholarships>;
  export type StudentScholarship = InferSelectModel<typeof studentScholarships>;
  export type AwardLetter = InferSelectModel<typeof awardLetters>;

  export interface AidComponent {
    name: string;
    amount: number;
    category: "grant" | "scholarship" | "loan" | "work_study";
    mustRepay: boolean;
    renewable: boolean;
  }

  export interface FinancialAidSummary {
    collegeId: string;
    collegeName: string;
    netPricePerYear: number | null;
    costOfAttendance: number | null;
    fourYearNetCost: number | null;
    totalDebtEstimate: number | null;   // loans × 4 years
    monthlyPayment: number | null;      // 10-yr repayment at 6.8%
    awardLetter: AwardLetter | null;
  }

  export interface ScholarshipMatch {
    scholarship: Scholarship;
    matchScore: number;
    matchReasons: string[];
    status: "matched" | "applied" | "awarded" | "rejected";
    daysUntilDeadline: number | null;
    notifiedAt: Date | null;
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` passes

---

### TASK 4: RUN DB migration

- **VALIDATE**: `dotenv -e .env.local -- npx drizzle-kit push --force` (force flag accepts new tables/columns)
- Confirm 3 new tables created: `scholarships`, `student_scholarships`, `award_letters`
- Confirm 3 new columns on `colleges`: `cost_of_attendance`, `tuition_in_state`, `tuition_out_of_state`

---

### TASK 5: CREATE `src/lib/agents/financial-aid/net-price.ts`

Pure calculation functions — no DB calls, no LLM. All inputs are typed.

```typescript
import type { College, StudentProfile } from "@/types";
import type { IncomeBracket } from "@/lib/db/schema";

const MONTHLY_RATE = 0.068 / 12; // Federal loan rate
const LOAN_TERM = 120;            // 10 years × 12 months
const DEFAULT_MEDIAN_EARNINGS = 45_000; // national baseline

/**
 * Returns the net price for a given income bracket from the colleges table.
 * Returns null if no data available for this bracket.
 */
export function getNetPriceForBracket(college: College, bracket: IncomeBracket): number | null {
  const map: Record<IncomeBracket, number | null> = {
    "0_30k":    college.netPrice0_30k,
    "30_48k":   college.netPrice30_48k,
    "48_75k":   college.netPrice48_75k,
    "75_110k":  college.netPrice75_110k,
    "110k_plus": college.netPrice110kPlus,
  };
  return map[bracket];
}

/**
 * Projects 4-year net cost. Uses net price (already post-grant) × 4.
 * Returns null if net price unavailable.
 */
export function calcFourYearNetCost(netPricePerYear: number | null): number | null {
  if (netPricePerYear === null) return null;
  return Math.round(netPricePerYear * 4);
}

/**
 * Estimates total loan debt over 4 years.
 * Assumes loans = max(0, netPrice - outOfPocket capacity).
 * Simple heuristic: for income 0_30k bracket, student can pay ~$3k/yr from work.
 * This is a floor estimate; award letter parsing provides actuals.
 */
export function estimateDebt(netPricePerYear: number | null, bracket: IncomeBracket): number | null {
  if (netPricePerYear === null) return null;
  const pocketMap: Record<IncomeBracket, number> = {
    "0_30k":    3_000,
    "30_48k":   5_000,
    "48_75k":   8_000,
    "75_110k":  12_000,
    "110k_plus": 18_000,
  };
  const yearlyPocket = pocketMap[bracket];
  const yearlyLoan = Math.max(0, netPricePerYear - yearlyPocket);
  return Math.round(yearlyLoan * 4);
}

/**
 * Monthly payment on a loan balance using standard amortization.
 * P = principal, r = monthly rate, n = number of payments
 */
export function calcMonthlyPayment(loanTotal: number): number {
  if (loanTotal <= 0) return 0;
  const numerator = MONTHLY_RATE * (1 + MONTHLY_RATE) ** LOAN_TERM;
  const denominator = (1 + MONTHLY_RATE) ** LOAN_TERM - 1;
  return Math.round(loanTotal * (numerator / denominator));
}

/**
 * Compute full financial aid summary for one college on a student's list.
 */
export function buildFinancialSummary(college: College, student: StudentProfile) {
  const bracket = student.incomeBracket ?? "48_75k";
  const netPricePerYear = getNetPriceForBracket(college, bracket);
  const fourYearNetCost = calcFourYearNetCost(netPricePerYear);
  const totalDebtEstimate = estimateDebt(netPricePerYear, bracket);
  const monthlyPayment = totalDebtEstimate !== null ? calcMonthlyPayment(totalDebtEstimate) : null;
  return { netPricePerYear, fourYearNetCost, totalDebtEstimate, monthlyPayment };
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 6: CREATE `src/lib/agents/financial-aid/__tests__/net-price.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { calcMonthlyPayment, calcFourYearNetCost, estimateDebt, getNetPriceForBracket } from "../net-price";

describe("calcMonthlyPayment", () => {
  it("returns 0 for zero debt", () => expect(calcMonthlyPayment(0)).toBe(0));
  it("returns ~$345 for $30k at 6.8% over 10 years", () => {
    const payment = calcMonthlyPayment(30_000);
    expect(payment).toBeGreaterThan(340);
    expect(payment).toBeLessThan(355);
  });
});

describe("calcFourYearNetCost", () => {
  it("returns null for null input", () => expect(calcFourYearNetCost(null)).toBeNull());
  it("multiplies by 4", () => expect(calcFourYearNetCost(15_000)).toBe(60_000));
});

describe("estimateDebt", () => {
  it("returns null for null net price", () => expect(estimateDebt(null, "0_30k")).toBeNull());
  it("returns 0 when net price < pocket capacity", () => expect(estimateDebt(2_000, "0_30k")).toBe(0));
  it("calculates 4-year loans for bracket 0_30k at $15k/yr", () => {
    // 15k - 3k = 12k/yr × 4 = 48k
    expect(estimateDebt(15_000, "0_30k")).toBe(48_000);
  });
});
```

- **VALIDATE**: `npx vitest run src/lib/agents/financial-aid/__tests__/net-price.test.ts`

---

### TASK 7: CREATE `src/lib/agents/financial-aid/index.ts`

MIRROR the discovery agent pattern exactly. The Financial Aid Agent computes net price summaries for every college on the student's list and upserts them to a summary data structure (stored as agent run record; actual financial data stays in the `colleges` table and is fetched fresh from the API route).

```typescript
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, collegeListEntries, colleges, studentProfiles } from "@/lib/db/schema";
import { buildFinancialSummary } from "./net-price";

export async function runFinancialAidAgent(studentProfileId: string): Promise<string> {
  const startedAt = new Date();
  const [run] = await db.insert(agentRuns).values({
    studentProfileId,
    agentType: "financial_aid",
    status: "running",
    startedAt,
  }).returning();

  try {
    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, studentProfileId),
    });
    if (!student) throw new Error("Student profile not found");
    if (!student.incomeBracket) throw new Error("Student must complete financial onboarding before running Financial Aid Agent");

    // Fetch student's college list with college data
    const listEntries = await db.query.collegeListEntries.findMany({
      where: eq(collegeListEntries.studentProfileId, studentProfileId),
      with: { college: true },
    });

    if (listEntries.length === 0) throw new Error("No colleges on list. Run Discovery Agent first.");

    const summaries = listEntries.map((entry) => {
      const { netPricePerYear, fourYearNetCost, totalDebtEstimate, monthlyPayment } = buildFinancialSummary(entry.college, student);
      return { name: entry.college.name, netPricePerYear, fourYearNetCost, totalDebtEstimate, monthlyPayment };
    });

    const withData = summaries.filter(s => s.netPricePerYear !== null).length;
    const summary = `Computed financial summaries for ${listEntries.length} colleges (${withData} with net price data)`;

    await db.update(agentRuns).set({
      status: "completed",
      summary,
      durationMs: Date.now() - startedAt.getTime(),
      completedAt: new Date(),
    }).where(eq(agentRuns.id, run.id));

    return summary;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await db.update(agentRuns).set({
      status: "failed",
      errorMessage,
      durationMs: Date.now() - startedAt.getTime(),
      completedAt: new Date(),
    }).where(eq(agentRuns.id, run.id));
    throw error;
  }
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 8: CREATE `src/app/api/agents/financial-aid/route.ts`

MIRROR `src/app/api/agents/discovery/route.ts` exactly. Change `runDiscoveryAgent` → `runFinancialAidAgent`, agentType label in error messages.

- **ADD** `export const dynamic = "force-dynamic"` at top
- **PATTERN**: rate limit → auth → find student profile → run agent → return 202
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 9: CREATE `src/app/api/financial-aid/route.ts`

GET endpoint returning financial summaries for all colleges on the student's list.

```typescript
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userProfiles, studentProfiles, collegeListEntries, awardLetters } from "@/lib/db/schema";
import { buildFinancialSummary } from "@/lib/agents/financial-aid/net-price";
import type { FinancialAidSummary } from "@/types";

export async function GET() {
  const { data: { user } } = await auth.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userProfile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) });
  if (!userProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userProfileId, userProfile.id),
  });
  if (!studentProfile) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const entries = await db.query.collegeListEntries.findMany({
    where: eq(collegeListEntries.studentProfileId, studentProfile.id),
    with: { college: true },
  });

  const letters = await db.query.awardLetters.findMany({
    where: eq(awardLetters.studentProfileId, studentProfile.id),
  });

  const summaries: FinancialAidSummary[] = entries.map((entry) => {
    const { netPricePerYear, fourYearNetCost, totalDebtEstimate, monthlyPayment } = buildFinancialSummary(entry.college, studentProfile);
    const awardLetter = letters.find(l => l.collegeId === entry.collegeId) ?? null;
    return {
      collegeId: entry.collegeId,
      collegeName: entry.college.name,
      netPricePerYear,
      costOfAttendance: entry.college.costOfAttendance,
      fourYearNetCost,
      totalDebtEstimate,
      monthlyPayment,
      awardLetter,
    };
  });

  return NextResponse.json({ summaries });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 10: CREATE `src/app/api/financial-aid/award-letter/route.ts` — Award letter parser

```typescript
export const dynamic = "force-dynamic";
// POST: { text: string, collegeName: string, academicYear?: string, collegeId?: string }
// Returns: { components: AidComponent[], summary: { freeMoneyTotal, loanTotal, workStudyTotal, outOfPocket } }
```

Prompt design for Groq:
```
You are a financial aid award letter parser. Parse the following award letter text and return a JSON array of aid components.

For each component, identify:
- name: exact name from the letter
- amount: dollar amount as integer (no $ sign)
- category: one of "grant", "scholarship", "loan", "work_study"
  - grant: Pell Grant, state grants, institutional grants — FREE MONEY
  - scholarship: merit scholarships, private scholarships — FREE MONEY
  - loan: any loan (subsidized, unsubsidized, PLUS, private) — MUST REPAY
  - work_study: Federal Work-Study, institutional work-study — MUST EARN
- mustRepay: true only for loans
- renewable: true if the award letter indicates the aid is renewable

Return ONLY valid JSON, no markdown, no explanation:
[{"name":"...","amount":0,"category":"grant","mustRepay":false,"renewable":true}]

Award letter text:
{TEXT}
```

After parsing, calculate totals and upsert to `awardLetters` table.

- **GOTCHA**: LLM may return markdown code blocks — strip with regex before `JSON.parse()`. Pattern: `text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()`
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 11: CREATE `src/lib/agents/scholarships/seed-data.ts`

Seed 50+ curated national scholarships. Use this exact structure as all 50 entries.

Include these categories of scholarships:
- **First-gen specific**: Dell Scholars, QuestBridge, Gates Scholarship, Horatio Alger Award, Jack Kent Cooke
- **STEM**: Regeneron STS, Davidson Fellows, Society of Women Engineers, BEYA STEM
- **Underrepresented groups**: UNCF, Hispanic Scholarship Fund, AAUW, Asian & Pacific Islander
- **Income-based**: Federal Pell Grant reference (explain it), Coca-Cola Scholars, Burger King Scholars
- **State-agnostic general**: Elks National, AXA Achievement, Prudential Spirit of Community
- **Essay-free / auto-apply style**: RaiseMe micro-scholarships reference
- **ROTC / service**: Army/Navy/Air Force ROTC

Sample entry:
```typescript
export const SEED_SCHOLARSHIPS = [
  {
    name: "Gates Scholarship",
    description: "Full cost-of-attendance scholarship for exceptional, Pell-eligible minority students pursuing STEM, education, or library science.",
    amount: null, amountMin: 10_000, amountMax: 50_000,
    deadlineText: "September 15 annually",
    deadlineMonth: 9, deadlineDay: 15,
    minGpa: 3.3,
    requiresFirstGen: true, requiresEssay: true,
    eligibleStates: null, // national
    eligibleMajors: JSON.stringify(["STEM", "Education", "Library Science"]),
    demographicTags: JSON.stringify(["black", "hispanic", "asian", "native_american"]),
    applicationUrl: "https://www.thegatesscholarship.org",
    renewable: true,
    source: "curated",
    isActive: true,
  },
  // ... 49 more entries ...
];
```

- **VALIDATE**: file compiles with `npx tsc --noEmit`

---

### TASK 12: CREATE `src/lib/agents/scholarships/matching.ts`

Pure scoring function — no DB calls.

```typescript
import type { Scholarship, StudentProfile } from "@/types";

export interface MatchResult {
  scholarship: Scholarship;
  score: number;
  reasons: string[];
}

export function scoreScholarship(scholarship: Scholarship, student: StudentProfile): MatchResult | null {
  const reasons: string[] = [];
  let score = 0;

  // Hard disqualifiers — return null (not eligible)
  if (scholarship.requiresFirstGen && !student.isFirstGen) return null;
  if (scholarship.minGpa !== null && student.gpa !== null && student.gpa < scholarship.minGpa) return null;

  // Positive matches
  if (scholarship.requiresFirstGen && student.isFirstGen) {
    score += 30;
    reasons.push("first-generation student");
  }

  if (scholarship.minGpa !== null && student.gpa !== null && student.gpa >= scholarship.minGpa) {
    score += 20;
    reasons.push(`GPA ${student.gpa.toFixed(1)} meets minimum ${scholarship.minGpa}`);
  }

  // State eligibility
  if (scholarship.eligibleStates) {
    const states = JSON.parse(scholarship.eligibleStates) as string[];
    if (student.stateOfResidence && states.includes(student.stateOfResidence)) {
      score += 15;
      reasons.push(`eligible in ${student.stateOfResidence}`);
    } else if (student.stateOfResidence && !states.includes(student.stateOfResidence)) {
      return null; // state-restricted and student not in eligible state
    }
  } else {
    score += 10; // national scholarship = accessible
    reasons.push("nationally available");
  }

  // Major match
  if (scholarship.eligibleMajors && student.intendedMajor) {
    const majors = JSON.parse(scholarship.eligibleMajors) as string[];
    const studentMajorLower = student.intendedMajor.toLowerCase();
    const matches = majors.some(m => studentMajorLower.includes(m.toLowerCase()) || m.toLowerCase().includes(studentMajorLower));
    if (matches) {
      score += 15;
      reasons.push(`matches major: ${student.intendedMajor}`);
    }
  }

  // Demographic tags (income proxy)
  if (scholarship.demographicTags) {
    const tags = JSON.parse(scholarship.demographicTags) as string[];
    if (tags.includes("low_income") && ["0_30k", "30_48k"].includes(student.incomeBracket ?? "")) {
      score += 10;
      reasons.push("low-income eligible");
    }
  }

  if (score < 20) return null; // below relevance threshold

  return { scholarship, score: Math.min(100, score), reasons };
}

export function matchScholarships(scholarships: Scholarship[], student: StudentProfile): MatchResult[] {
  return scholarships
    .filter(s => s.isActive)
    .map(s => scoreScholarship(s, student))
    .filter((r): r is MatchResult => r !== null)
    .sort((a, b) => b.score - a.score);
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 13: CREATE `src/lib/agents/scholarships/__tests__/matching.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { scoreScholarship, matchScholarships } from "../matching";

const baseStudent = {
  id: "s1", userProfileId: "u1", gpa: 3.5, gradeLevel: 12,
  stateOfResidence: "CA", incomeBracket: "30_48k" as const,
  isFirstGen: true, intendedMajor: "Computer Science",
  satScore: null, actScore: null,
  collegeTypePreference: "either", locationPreference: "anywhere",
  createdAt: new Date(), updatedAt: new Date(),
};

const baseScholarship = {
  id: "sc1", name: "Test", description: "", amount: null, amountMin: null, amountMax: null,
  deadlineText: "", deadlineMonth: null, deadlineDay: null,
  minGpa: null, requiresFirstGen: false, requiresEssay: false,
  eligibleStates: null, eligibleMajors: null, demographicTags: null,
  applicationUrl: "", renewable: false, source: "curated", isActive: true,
  createdAt: new Date(),
};

describe("scoreScholarship", () => {
  it("returns null when requiresFirstGen=true and student is not first-gen", () => {
    const s = { ...baseScholarship, requiresFirstGen: true };
    const st = { ...baseStudent, isFirstGen: false };
    expect(scoreScholarship(s, st)).toBeNull();
  });

  it("returns null when student GPA below minimum", () => {
    const s = { ...baseScholarship, minGpa: 3.8 };
    const st = { ...baseStudent, gpa: 3.5 };
    expect(scoreScholarship(s, st)).toBeNull();
  });

  it("returns null for state-restricted scholarship when student not in state", () => {
    const s = { ...baseScholarship, eligibleStates: JSON.stringify(["TX"]) };
    expect(scoreScholarship(s, baseStudent)).toBeNull(); // student is CA
  });

  it("awards first-gen bonus and reason", () => {
    const s = { ...baseScholarship, requiresFirstGen: true };
    const result = scoreScholarship(s, baseStudent)!;
    expect(result).not.toBeNull();
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.reasons.some(r => r.includes("first-generation"))).toBe(true);
  });
});

describe("matchScholarships", () => {
  it("filters inactive scholarships", () => {
    const inactive = { ...baseScholarship, isActive: false };
    expect(matchScholarships([inactive], baseStudent)).toHaveLength(0);
  });

  it("sorts by score descending", () => {
    const s1 = { ...baseScholarship, id: "a", requiresFirstGen: true };
    const s2 = { ...baseScholarship, id: "b" };
    const results = matchScholarships([s2, s1], baseStudent);
    expect(results[0].scholarship.id).toBe("a"); // higher score (first-gen bonus)
  });
});
```

- **VALIDATE**: `npx vitest run src/lib/agents/scholarships/__tests__/matching.test.ts`

---

### TASK 14: CREATE `src/lib/agents/scholarships/index.ts`

MIRROR financial-aid agent pattern. This agent:
1. Fetches all active scholarships from DB
2. Runs matching algorithm against student profile
3. Deletes old `studentScholarships` for this student
4. Inserts new matches (top 20 by score)
5. Returns summary

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 15: CREATE `src/app/api/scholarships/seed/route.ts`

Admin/dev only endpoint to seed the scholarship database.

```typescript
export const dynamic = "force-dynamic";
// POST: no body required
// Guard: only allowed when SKIP_AUTH=true OR user is admin role
// Action: db.insert(scholarships).values(SEED_SCHOLARSHIPS).onConflictDoNothing()
// Returns: { seeded: number }
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 16: CREATE `src/app/api/agents/scholarships/route.ts`

MIRROR `src/app/api/agents/discovery/route.ts`. Change agent function to `runScholarshipAgent`.

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 17: CREATE `src/app/api/scholarships/route.ts`

GET endpoint returning matched scholarships for the authenticated student.

- Fetch `studentScholarships` joined with `scholarships`
- Calculate `daysUntilDeadline` from `deadlineMonth/deadlineDay` (handle year wrap for past deadlines)
- Return sorted by `daysUntilDeadline` ascending (soonest first), then by `matchScore` descending
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 18: INSTALL resend + CREATE `src/lib/email/index.ts`

```bash
npm install resend --legacy-peer-deps
```

Lazy init pattern mirroring `src/lib/ai/client.ts`:
```typescript
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendScholarshipReminder({
  to, studentName, scholarshipName, amount, deadlineText, applicationUrl, daysUntil,
}: {
  to: string; studentName: string; scholarshipName: string;
  amount: string; deadlineText: string; applicationUrl: string; daysUntil: number;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: "College Navigator <notifications@yourcollege.app>",
    to,
    subject: `⏰ Scholarship deadline in ${daysUntil} days: ${scholarshipName}`,
    html: `
      <h2>Hi ${studentName},</h2>
      <p>You have a scholarship deadline coming up in <strong>${daysUntil} days</strong>.</p>
      <h3>${scholarshipName}</h3>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Deadline:</strong> ${deadlineText}</p>
      <p><a href="${applicationUrl}" style="background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Apply Now →</a></p>
      <p style="color:#6b7280;font-size:12px">You received this because you matched this scholarship. Visit your dashboard to manage notifications.</p>
    `,
  });
}
```

- **ADD** to `.env.example`: `RESEND_API_KEY=re_...` and `CRON_SECRET=your-random-secret`
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 19: CREATE `src/app/api/cron/scholarship-reminders/route.ts`

```typescript
export const dynamic = "force-dynamic";
// GET: protected by Authorization: Bearer ${CRON_SECRET} header
// Logic:
//   1. Find all studentScholarships with status="matched" and notifiedAt=null
//   2. Join with scholarships to get deadline info
//   3. Calculate daysUntilDeadline for each
//   4. For entries where daysUntilDeadline in [1, 3, 7]: send email + set notifiedAt
//   5. Returns { sent: number }
```

- **GOTCHA**: Check `Authorization` header = `Bearer ${process.env.CRON_SECRET}` before processing
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 20: CREATE `vercel.json` at project root

```json
{
  "crons": [
    {
      "path": "/api/cron/scholarship-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- **VALIDATE**: File is valid JSON. `cat vercel.json | python3 -m json.tool`

---

### TASK 21: CREATE `src/components/student/financial-comparison.tsx`

Client component. Receives `FinancialAidSummary[]` as prop. Renders a responsive table:

| School | Net Price/yr | 4-Year Cost | Est. Debt | Monthly Payment |
|--------|-------------|-------------|-----------|-----------------|
| Arizona State | $12,400 | $49,600 | $36,000 | $415/mo |
| U of Arizona | $15,200 | $60,800 | $48,000 | $553/mo |

Columns represent schools; rows are cost metrics. Highlight the lowest value in each row (green badge).

- Add "What is net price?" tooltip using shadcn `Tooltip` component
- Show "Award letter uploaded ✓" badge if `awardLetter !== null`
- Show "—" with muted text if data unavailable
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 22: CREATE `src/components/student/award-letter-uploader.tsx`

Client component. UI flow:
1. Select which college from student's list (dropdown `select`)
2. Textarea: "Paste your award letter text here"
3. Submit → POST `/api/financial-aid/award-letter` → show parsed breakdown
4. Parsed view: categorized list with grant (green), loan (red), work-study (blue) color coding
5. Summary row: "Free money: $13,400 | Loans: $5,500 | You pay: $8,100"

- Use `sonner` toast on success/error
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 23: CREATE `src/components/student/scholarship-list.tsx`

Client component. Receives `ScholarshipMatch[]` as prop. Renders cards:

```
┌─────────────────────────────────────────────────────┐
│ Gates Scholarship                    [96% match]     │
│ Full cost-of-attendance...           [7 days left]   │
│ Why you qualify: first-generation, STEM major, GPA   │
│                                   [Apply Now →]      │
└─────────────────────────────────────────────────────┘
```

- Deadline badge: red if ≤3 days, yellow if ≤7, gray otherwise
- Match score badge using same color scale
- "Apply Now →" links to `scholarship.applicationUrl`
- Empty state: "Running scholarship matching..." skeleton
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 24: CREATE `src/app/student/financial-aid/page.tsx`

Client page. Auth flow MIRRORS `src/app/student/dashboard/page.tsx`:
1. `auth.getSession()` → redirect to login if null
2. Role check → redirect counselors
3. Onboarding check → redirect if not completed
4. Fetch: `GET /api/financial-aid` + `GET /api/scholarships` in parallel
5. If no scholarships: auto-trigger scholarship agent (`POST /api/agents/scholarships`)
6. If no financial summaries or all null: auto-trigger financial aid agent (`POST /api/agents/financial-aid`)

**Page Layout:**
```
<h1>Financial Aid & Scholarships</h1>

## Cost Comparison
<FinancialComparison summaries={summaries} />

## Your Award Letters
<AwardLetterUploader collegeList={...} onUploaded={() => refetch()} />

## Scholarships Matched to Your Profile
<ScholarshipList matches={scholarships} />
```

- **ADD** navigation link from dashboard to this page: `<Link href="/student/financial-aid">Financial Aid →</Link>`
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 25: UPDATE `src/app/student/dashboard/page.tsx`

- **ADD** a "Financial Aid →" navigation card/button linking to `/student/financial-aid`
- Place it between the college list section and any existing empty-state UI
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 26: Final validation sweep

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests pass
- `dotenv -e .env.local -- npx drizzle-kit push` — no errors (tables already exist)
- `npm run lint` — no Biome errors (run `npm run lint:fix` if needed)
- `npm run build` — successful build

---

## TESTING STRATEGY

### Unit Tests

- `src/lib/agents/financial-aid/__tests__/net-price.test.ts` — Monthly payment formula, 4-year cost, debt estimation per bracket
- `src/lib/agents/scholarships/__tests__/matching.test.ts` — Hard disqualifiers, scoring bonuses, inactive filter, sort order

### Integration Tests (manual, dev flow)

After implementation:
1. Seed scholarships: `curl -X POST http://localhost:3000/api/scholarships/seed`
2. Trigger scholarship agent: `curl -X POST http://localhost:3000/api/agents/scholarships` (with session cookie)
3. Fetch matches: `curl http://localhost:3000/api/scholarships`
4. Trigger financial aid agent: `curl -X POST http://localhost:3000/api/agents/financial-aid`
5. Fetch financial summaries: `curl http://localhost:3000/api/financial-aid`
6. Parse award letter: POST to `/api/financial-aid/award-letter` with sample text

### Edge Cases

- Student has no income bracket set (financial aid agent should throw clear error)
- College has no net price data for student's bracket (show "—" not crash)
- LLM returns malformed JSON for award letter (fallback: `{ components: [], freeMoneyTotal: 0, ... }`)
- All scholarships have past deadlines (calculate correctly using next year's date)
- Student has no college on list (scholarship agent should still run; financial aid agent should throw)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
npx tsc --noEmit
npm run lint
```

### Level 2: Unit Tests
```bash
npx vitest run src/lib/agents/financial-aid/__tests__/net-price.test.ts
npx vitest run src/lib/agents/scholarships/__tests__/matching.test.ts
npx vitest run
```

### Level 3: DB Migration
```bash
dotenv -e .env.local -- npx drizzle-kit push --force
```

### Level 4: Manual Validation
```bash
# Seed scholarships
curl -X POST http://localhost:3000/api/scholarships/seed

# Check seeded count
curl http://localhost:3000/api/scholarships

# Trigger financial aid agent
curl -X POST http://localhost:3000/api/agents/financial-aid \
  -H "Cookie: <your-session-cookie>"

# Fetch financial summaries
curl http://localhost:3000/api/financial-aid \
  -H "Cookie: <your-session-cookie>"

# Parse sample award letter
curl -X POST http://localhost:3000/api/financial-aid/award-letter \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"text":"Pell Grant: $7,395\nUA Merit Scholarship: $6,000\nFederal Work-Study: $2,500\nFederal Direct Subsidized Loan: $3,500\nFederal Direct Unsubsidized Loan: $2,000","collegeName":"University of Arizona","academicYear":"2026-27"}'
```

### Level 5: E2E Browser Test
```bash
npm run test:e2e
```

(Update `tests/e2e/` test to include navigation to `/student/financial-aid` and verify comparison table renders)

---

## ACCEPTANCE CRITERIA

- [ ] Financial Aid Agent runs without error for a student with income bracket set
- [ ] `GET /api/financial-aid` returns net price, 4-year cost, estimated debt, and monthly payment for each college on list
- [ ] Award letter parser correctly categorizes grants, loans, and work-study (test with sample letter above)
- [ ] Scholarship agent matches >5 scholarships for a first-gen STEM student
- [ ] Scholarship matching respects hard disqualifiers (wrong state, GPA below minimum, non-first-gen)
- [ ] `/student/financial-aid` page loads without error, shows comparison table and scholarship list
- [ ] All unit tests pass (`npx vitest run`)
- [ ] TypeScript check passes (`npx tsc --noEmit`)
- [ ] Biome linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Email function compiles and Resend client lazy-initializes (no crash at build time)
- [ ] `vercel.json` is valid JSON with cron schedule

---

## COMPLETION CHECKLIST

- [ ] All 26 tasks completed in order
- [ ] Each task validation passed immediately after implementation
- [ ] `npx vitest run` — all tests pass
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] `npm run build` — successful
- [ ] Scholarship database seeded with 50+ entries
- [ ] Financial comparison page navigable from dashboard
- [ ] Award letter upload flow works end-to-end with sample text
- [ ] No regressions: existing discovery agent still works
- [ ] Ready for `/commit`

---

## NOTES

### Why No PDF Upload (Yet)
PDF parsing in Next.js serverless functions requires `pdf-parse` or `pdfjs-dist`, both of which have Node.js compatibility issues in the edge runtime. For MVP, users paste award letter text. Phase 3 can add PDF upload with a dedicated Lambda or Edge Function.

### Why Static Scholarship Seed Instead of Bold.org API
Bold.org requires API key registration and the free tier has rate limits. The MVP validates matching quality with 50 curated scholarships. After pilot launch with real student data, we can swap in Bold.org or Fastweb for breadth.

### EFC/SAI Calculation
The PRD mentions "FAFSA aid estimator / Federal Student Aid API" but there is no free public REST API for this. The `net-price.ts` pocket capacity heuristic is a reasonable proxy for Phase 2. Phase 3 should implement the full federal EFC formula (published by finaid.org) using student's income/assets inputs.

### Groq vs Anthropic for Award Letter Parsing
Award letter parsing uses structured prompting with a forced JSON output format — Groq (llama-3.3-70b-versatile) handles this well and is free. If parsing accuracy is insufficient after testing, switch to Anthropic `claude-sonnet-4-6` by uncommenting the Anthropic client in `award-letter-parser.ts` (same pattern as `explanations.ts`).

### Monthly Payment Formula
Using 6.8% federal direct loan rate (standard for undergraduate). This is an estimate — actual rates depend on loan type and year. The UI should include a disclaimer: "Based on current federal direct loan rate. Verify with your financial aid office."

### Confidence Score: 8/10
High confidence because:
- Clear agent-runner pattern established in Phase 1 to mirror
- All financial calculations are deterministic (no LLM risk)
- Schema additions are additive (no breaking changes to existing tables)
- Scholarship matching is pure function (easily testable)
- Email is isolated (lazy init prevents build failure if RESEND_API_KEY not set)

Risks:
- Groq JSON parsing reliability for award letters (mitigated by fallback + strip-markdown)
- `collegeListEntries with: { college: true }` query syntax — verify Drizzle `with` clause works for this relation (it should; discovery agent uses same pattern)
