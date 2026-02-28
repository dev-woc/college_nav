# Feature: Phase 3 — Application Management Agent + FAFSA Guidance + Full Counselor Dashboard

The following plan should be complete, but validate documentation and codebase patterns before starting.
Pay special attention to naming of existing utils, types, and models. Import from the right files.

---

## Feature Description

Phase 3 completes the MVP by adding the **Application Management Agent**, a **FAFSA step-by-step walkthrough**, a **student-to-counselor connection flow**, and a **full-featured Counselor Dashboard** with urgency scoring, FAFSA completion tracking, and cohort outcome stats. Students get a unified application checklist across all schools + FAFSA + CSS Profile, with conflict detection. Counselors get actionable caseload intelligence: which students need human intervention today.

## User Story

As a first-generation high school senior
I want a single unified checklist that tracks every requirement for every college I'm applying to — Common App, supplements, FAFSA, CSS Profile — and tells me when deadlines conflict
So that I never miss a deadline or leave money on the table

As a high school counselor with 450 students
I want to see at a glance which students are most urgently behind — FAFSA not started, deadlines in 7 days, no college list — with a computed urgency score
So that I can focus my limited time on students who most need human intervention

## Problem Statement

Phase 2 gives students financial visibility. But students still have no unified place to track what they need to do and when — application requirements are scattered across portals, FAFSA is intimidating, and counselors lack real-time insight into who's falling behind.

## Solution Statement

1. Add `applicationTasks` and `fafsaProgress` tables + new enums to schema
2. Add `schoolCode` field to `counselorProfiles` for student-to-counselor connection
3. Build Application Management Agent: creates per-student task list from college list (Common App + supplement + school-specific) + FAFSA + CSS Profile, detects conflicts
4. Build FAFSA walkthrough: 12 static steps with per-student progress tracking
5. Build student connection flow: student enters counselor's school code to join caseload
6. Upgrade Counselor Dashboard: urgency score, FAFSA status, scholarship status, cohort stats, student detail view
7. Build student UI: `/student/applications` checklist page + `/student/fafsa` walkthrough page
8. Add dashboard navigation to new student pages

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: DB schema, agent layer, API routes, student UI, counselor UI
**Dependencies**: No new npm packages required (Resend and shadcn already installed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — MUST READ BEFORE IMPLEMENTING

- `src/lib/db/schema.ts` — All table/enum patterns; use same imports (`pgTable`, `pgEnum`, `uuid`, `text`, `boolean`, `integer`, `timestamp`, `real`, `index`, `uniqueIndex`). New enums go after existing enums block. New tables go after `awardLetters`.
- `src/lib/db/index.ts` — Lazy Proxy DB init pattern; do NOT call `neon()` at module load
- `src/lib/agents/financial-aid/index.ts` — **MIRROR THIS EXACTLY** for Application Management Agent runner: insert agentRun → try work → update status → return summary string
- `src/app/api/agents/financial-aid/route.ts` — **MIRROR THIS EXACTLY** for agent trigger route: `export const dynamic = "force-dynamic"` → rate limit → auth → role check → onboarding check → find studentProfile → run agent → 202
- `src/app/api/counselor/caseload/route.ts` — **UPDATE THIS FILE** to add urgency score, FAFSA status, scholarship status, cohort stats. Study the existing student-loop-with-Promise.all pattern carefully.
- `src/app/counselor/dashboard/page.tsx` — **UPDATE THIS FILE**; currently a skeleton; study the fetch + role-check + setStudents pattern
- `src/components/counselor/caseload-table.tsx` — **UPDATE THIS FILE**; add urgency badge column, FAFSA column, scholarship column
- `src/lib/auth/server.ts` — `auth.getSession()` → `{ data: { user: { id } } }` or null; SKIP_AUTH mock pattern
- `src/lib/rate-limit.ts` — `createRateLimiter(maxReq, windowMs)` factory; use pre-exported `apiRateLimiter`
- `src/lib/validations.ts` — Zod schema patterns; use `.safeParse()`, `.refine()`
- `src/types/index.ts` — `InferSelectModel<typeof table>` pattern for all type exports
- `src/app/student/dashboard/page.tsx` — Page auth flow pattern (client-side fetch /api/user → role check → onboarding check → render)
- `src/app/student/financial-aid/page.tsx` — **MIRROR THIS** for `/student/applications` and `/student/fafsa` pages: client component, useCallback fetches, useEffect init, loading state
- `src/lib/agents/scholarships/matching.ts` — Pure scoring function pattern; MIRROR for `computeUrgencyScore()`
- `src/lib/agents/scholarships/__tests__/matching.test.ts` — Vitest unit test pattern with `baseStudent` fixture
- `src/lib/agents/financial-aid/__tests__/net-price.test.ts` — Unit test pattern for pure functions
- `src/lib/agents/discovery/explanations.ts` — Groq LLM call pattern (ONLY if using AI for conflict explanation); `createGroq` + `generateText` from `"ai"`, `maxOutputTokens` NOT `maxTokens`

### New Files to Create

```
src/
├── lib/
│   ├── db/
│   │   └── schema.ts                   UPDATE — add taskTypeEnum, taskStatusEnum enums;
│   │                                           add applicationTasks, fafsaProgress tables;
│   │                                           add schoolCode to counselorProfiles;
│   │                                           add relations for new tables
│   ├── agents/
│   │   └── applications/
│   │       ├── index.ts                NEW — Application Management Agent runner
│   │       ├── task-builder.ts         NEW — builds unified task list + conflict detection (pure fns)
│   │       ├── fafsa-steps.ts          NEW — static FAFSA step definitions (no DB)
│   │       ├── urgency.ts              NEW — computeUrgencyScore() pure function
│   │       └── __tests__/
│   │           ├── task-builder.test.ts  NEW — unit tests for task building + conflict detection
│   │           └── urgency.test.ts       NEW — unit tests for urgency scoring
└── types/
    └── index.ts                        UPDATE — add ApplicationTask, FafsaProgress,
                                                 ApplicationChecklist, StudentMilestoneStatus,
                                                 CohortStats types

src/app/
├── api/
│   ├── agents/
│   │   └── applications/
│   │       └── route.ts               NEW — POST: trigger Application Management Agent
│   ├── applications/
│   │   ├── route.ts                   NEW — GET: unified task checklist for student
│   │   └── tasks/
│   │       └── [taskId]/
│   │           └── route.ts           NEW — PATCH: update task status
│   ├── fafsa/
│   │   ├── route.ts                   NEW — GET: FAFSA steps + student progress
│   │   └── progress/
│   │       └── route.ts               NEW — PATCH: mark FAFSA step complete/incomplete
│   └── counselor/
│       ├── caseload/
│       │   └── route.ts               UPDATE — add FAFSA status, urgency score,
│       │                                       scholarship status, cohortStats
│       ├── connect/
│       │   └── route.ts               NEW — POST: student connects to counselor by schoolCode
│       └── student/
│           └── [studentId]/
│               └── route.ts           NEW — GET: full detail for one student (counselor only)
├── student/
│   ├── applications/
│   │   └── page.tsx                   NEW — unified application checklist page
│   └── fafsa/
│       └── page.tsx                   NEW — FAFSA step-by-step walkthrough page
└── counselor/
    ├── dashboard/
    │   └── page.tsx                   UPDATE — add cohort stats, urgency sort, connect link
    └── student/
        └── [studentId]/
            └── page.tsx               NEW — counselor view of individual student

src/components/
├── student/
│   ├── application-checklist.tsx      NEW — task list sorted by urgency with status toggles
│   └── fafsa-guide.tsx                NEW — step-by-step accordion wizard
└── counselor/
    ├── caseload-table.tsx             UPDATE — add urgency badge, FAFSA column, scholarship col
    └── cohort-stats.tsx               NEW — aggregate metrics bar (FAFSA %, scholarships, etc.)
```

### Relevant Documentation — SHOULD READ BEFORE IMPLEMENTING

- Drizzle ORM relations docs: relations follow the exact pattern already in `schema.ts`; new tables follow same `relations()` export at bottom of file
- Next.js dynamic route segments: `src/app/api/counselor/student/[studentId]/route.ts` uses `{ params }: { params: { studentId: string } }` as second argument
- FAFSA official steps: https://studentaid.gov/h/apply-for-aid/fafsa — 12 major steps; plan includes all
- Federal Student Aid priority deadlines: most schools = December 1 priority, March 1 standard; CSS Profile schools = November 1

### Patterns to Follow

**Agent Runner Pattern** — MIRROR `src/lib/agents/financial-aid/index.ts` exactly:
```typescript
export async function runApplicationAgent(studentProfileId: string): Promise<string> {
  const startedAt = new Date();
  const [run] = await db.insert(agentRuns).values({
    studentProfileId, agentType: "application_management", status: "running", startedAt,
  }).returning();
  try {
    // ... do work ...
    const summary = `Created/updated N application tasks across M colleges`;
    await db.update(agentRuns).set({
      status: "completed", summary,
      durationMs: Date.now() - startedAt.getTime(), completedAt: new Date(),
    }).where(eq(agentRuns.id, run.id));
    return summary;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await db.update(agentRuns).set({
      status: "failed", errorMessage,
      durationMs: Date.now() - startedAt.getTime(), completedAt: new Date(),
    }).where(eq(agentRuns.id, run.id));
    throw error;
  }
}
```

**Agent API Route Pattern** — MIRROR `src/app/api/agents/financial-aid/route.ts` exactly:
```typescript
export const dynamic = "force-dynamic";
// rate limit → auth.getSession() → validate role=student → validate onboarding → find studentProfile → run agent → 202
```

**JSON Array Storage Pattern** (same as scholarships):
```typescript
// Store: JSON.stringify(string[]) in text() column
// Read: JSON.parse(row.field) as string[]
// Use text() NOT jsonb — free Neon tier schema compatibility
```

**Dynamic Route Handler Pattern** (Next.js App Router):
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  // ...
}
```

**Urgency Score Pattern** — pure function, 0–100, deterministic:
```typescript
export function computeUrgencyScore(input: UrgencyInput): number {
  let score = 0;
  // additive, clamped at 100
  return Math.min(100, score);
}
```

**Counselor Caseload Enhancement Pattern** — extend existing Promise.all map:
```typescript
// In existing connections.map(async (conn) => { ... }) block:
// 1. Add fafsaStep query
// 2. Add pending task count / earliest deadline query
// 3. Add scholarship match count query
// 4. Compute urgencyScore from those values
// 5. Return expanded StudentSummary object
```

**FAFSA Steps Pattern** — static array, steps never change per student:
```typescript
export interface FafsaStep {
  step: number;         // 1-12
  title: string;
  description: string;
  documents: string[];  // what to gather
  tips: string[];       // first-gen specific tips
  url?: string;         // external link if applicable
}
export const FAFSA_STEPS: FafsaStep[] = [ /* 12 steps */ ];
```

---

## IMPLEMENTATION PLAN

### Phase 1: Schema + Types Foundation

Extend DB schema with 2 new tables, update `counselorProfiles`, add new enums, update types.

**Tasks:**
- ADD `taskTypeEnum` and `taskStatusEnum` enums to `schema.ts`
- ADD `schoolCode` column to `counselorProfiles` table
- ADD `applicationTasks` table to `schema.ts`
- ADD `fafsaProgress` table to `schema.ts`
- ADD Drizzle relations for new tables
- UPDATE `types/index.ts` with new exported types
- RUN `db:push` to apply schema

### Phase 2: Application Management Agent

Pure logic layer — task builder, urgency scorer, FAFSA steps, agent runner.

**Tasks:**
- CREATE `fafsa-steps.ts` with 12 static FAFSA step definitions
- CREATE `task-builder.ts` with pure functions: `buildTasksForCollegeList()`, `detectConflicts()`, `buildFafsaTask()`
- CREATE `urgency.ts` with `computeUrgencyScore()` pure function
- CREATE `applications/index.ts` agent runner
- WRITE unit tests for task-builder and urgency functions

### Phase 3: Student API Routes

6 new API routes for applications, FAFSA progress, and counselor connection.

**Tasks:**
- CREATE `POST /api/agents/applications` — trigger agent
- CREATE `GET /api/applications` — fetch task list with conflict flags
- CREATE `PATCH /api/applications/tasks/[taskId]` — update task status
- CREATE `GET /api/fafsa` — fetch FAFSA steps merged with student progress
- CREATE `PATCH /api/fafsa/progress` — mark step complete/incomplete
- CREATE `POST /api/counselor/connect` — student connects to counselor by schoolCode

### Phase 4: Counselor API Routes

Enhance caseload route + add student detail route.

**Tasks:**
- UPDATE `GET /api/counselor/caseload` — add FAFSA status, urgency score, scholarship status, cohortStats
- CREATE `GET /api/counselor/student/[studentId]` — full student detail for counselor view

### Phase 5: Student UI

Application checklist page + FAFSA walkthrough page + dashboard nav links.

**Tasks:**
- CREATE `application-checklist.tsx` — task cards sorted by urgency, status toggle button
- CREATE `fafsa-guide.tsx` — accordion steps with completion checkboxes
- CREATE `/student/applications/page.tsx` — full page assembling checklist + run agent if no tasks
- CREATE `/student/fafsa/page.tsx` — FAFSA walkthrough page with progress
- UPDATE `/student/dashboard/page.tsx` — add "My Applications" and "FAFSA Guide" nav cards

### Phase 6: Counselor UI

Full counselor dashboard with urgency indicators, cohort stats, student detail.

**Tasks:**
- CREATE `cohort-stats.tsx` — FAFSA completion rate, avg scholarships applied, avg colleges on list
- UPDATE `caseload-table.tsx` — add urgency score badge (red/yellow/green), FAFSA column, scholarship column
- UPDATE `counselor/dashboard/page.tsx` — add cohort stats, urgency sort, share counselor school code
- CREATE `counselor/student/[studentId]/page.tsx` — counselor reads student's full milestone + agent history

### Phase 7: Final Validation

Full sweep — types, tests, lint, build.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### TASK 1: UPDATE `src/lib/db/schema.ts` — Add enums + columns + tables

**ADD** two new enums after the existing `scholarshipStatusEnum`:
```typescript
export const taskTypeEnum = pgEnum("task_type", [
  "common_app",
  "supplement",
  "fafsa",
  "css_profile",
  "scholarship_app",
  "institutional_app",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);
```

**ADD** `schoolCode` column to `counselorProfiles` table body (after `stateCode`):
```typescript
schoolCode: text("school_code").notNull().default(""),
```
Also add a unique index for `schoolCode` in the table's index array:
```typescript
uniqueIndex("idx_counselor_profiles_school_code").on(table.schoolCode),
```

**ADD** `applicationTasks` table after `awardLetters`:
```typescript
export const applicationTasks = pgTable("application_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "cascade" }),
  collegeName: text("college_name").notNull().default(""),
  taskType: taskTypeEnum("task_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  deadlineDate: timestamp("deadline_date", { withTimezone: true }),
  deadlineLabel: text("deadline_label").notNull().default(""), // e.g. "Regular Decision"
  status: taskStatusEnum("task_status").notNull().default("pending"),
  isConflict: boolean("is_conflict").notNull().default(false),
  conflictNote: text("conflict_note").notNull().default(""),
  agentRunId: uuid("agent_run_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_application_tasks_student").on(table.studentProfileId),
  index("idx_application_tasks_college").on(table.collegeId),
  index("idx_application_tasks_status").on(table.status),
  index("idx_application_tasks_deadline").on(table.deadlineDate),
]);
```

**ADD** `fafsaProgress` table after `applicationTasks`:
```typescript
export const fafsaProgress = pgTable("fafsa_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id")
    .notNull()
    .unique()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  completedSteps: text("completed_steps").notNull().default("[]"), // JSON.stringify(number[]) of step numbers 1-12
  currentStep: integer("current_step").notNull().default(0), // 0 = not started, 12 = complete
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_fafsa_progress_student").on(table.studentProfileId),
]);
```

**ADD** Drizzle relations for new tables at the bottom of the relations section:
```typescript
export const applicationTasksRelations = relations(applicationTasks, ({ one }) => ({
  student: one(studentProfiles, {
    fields: [applicationTasks.studentProfileId],
    references: [studentProfiles.id],
  }),
  college: one(colleges, {
    fields: [applicationTasks.collegeId],
    references: [colleges.id],
  }),
}));

export const fafsaProgressRelations = relations(fafsaProgress, ({ one }) => ({
  student: one(studentProfiles, {
    fields: [fafsaProgress.studentProfileId],
    references: [studentProfiles.id],
  }),
}));
```

**ADD** `applicationTasks` and `fafsaProgress` to the `studentProfilesRelations` many list:
```typescript
applicationTasks: many(applicationTasks),
fafsaProgress: one(fafsaProgress, {
  fields: [studentProfiles.id],
  references: [fafsaProgress.studentProfileId],
}),
```

**ADD** `applicationTasks` to `collegesRelations` many list:
```typescript
applicationTasks: many(applicationTasks),
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 2: UPDATE `src/types/index.ts` — Add new exported types

**ADD** imports for new schema tables at top:
```typescript
import type { applicationTasks, fafsaProgress } from "@/lib/db/schema";
```

**ADD** new model types after `AwardLetter`:
```typescript
export type ApplicationTask = InferSelectModel<typeof applicationTasks>;
export type FafsaProgress = InferSelectModel<typeof fafsaProgress>;
```

**ADD** new interface types after `ScholarshipMatch`:
```typescript
export interface ApplicationChecklist {
  tasks: ApplicationTask[];
  conflicts: ApplicationTask[];   // tasks where isConflict = true
  totalTasks: number;
  completedTasks: number;
  nextDeadline: Date | null;      // earliest pending task deadline
}

export interface FafsaStepWithProgress {
  step: number;
  title: string;
  description: string;
  documents: string[];
  tips: string[];
  url?: string;
  isCompleted: boolean;
}

export interface StudentMilestoneStatus {
  id: string;
  displayName: string;
  email: string;
  gradeLevel: number | null;
  isFirstGen: boolean;
  urgencyScore: number;           // 0-100
  flaggedReason: string;          // human-readable reason for high urgency
  milestones: {
    onboarding: "complete" | "not-started";
    collegeList: "complete" | "not-started";
    financialAid: "complete" | "not-started";
    scholarships: "complete" | "not-started";
    fafsa: "not-started" | "in-progress" | "complete";
    applications: "not-started" | "in-progress" | "complete";
  };
  lastAgentRun: Date | string | null;
}

export interface CohortStats {
  totalStudents: number;
  fafsaCompletionRate: number;    // 0.0-1.0
  avgScholarshipsMatched: number;
  avgCollegesOnList: number;
  studentsWithApplicationTasks: number;
  highUrgencyCount: number;       // urgency >= 60
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 3: RUN DB migration

```bash
node -e "require('dotenv').config({path: '.env.local'}); const { execSync } = require('child_process'); console.log(execSync('npx drizzle-kit push', { encoding: 'utf8' }));"
```

- Confirm new tables: `application_tasks`, `fafsa_progress`
- Confirm new enums: `task_type`, `task_status`
- Confirm new column: `counselor_profiles.school_code`
- **VALIDATE**: Migration output shows `[✓] Changes applied`

---

### TASK 4: CREATE `src/lib/agents/applications/fafsa-steps.ts`

Static step definitions — no DB calls, no imports from project files.

```typescript
export interface FafsaStep {
  step: number;       // 1-12
  title: string;
  description: string;
  documents: string[];
  tips: string[];
  url?: string;
}

export const FAFSA_STEPS: FafsaStep[] = [
  {
    step: 1,
    title: "Create Your FSA ID",
    description: "You and one parent (if dependent) each need a separate FSA ID — a username and password that serves as your legal signature.",
    documents: ["Social Security Number", "Email address"],
    tips: ["Each person must have their OWN email address — you cannot share one.", "It can take up to 3 days to verify your SSN. Do this first, before anything else."],
    url: "https://studentaid.gov/fsa-id/create-account/launch",
  },
  {
    step: 2,
    title: "Gather Your Documents",
    description: "Collect everything you'll need before starting the FAFSA form. Having documents ready prevents errors.",
    documents: [
      "Your Social Security Number",
      "Your parent's Social Security Number (if dependent)",
      "Federal tax returns (yours + parents' from 2 years ago)",
      "W-2 forms and records of other income",
      "Bank statements and investment records",
      "Driver's license (optional but helpful)",
    ],
    tips: ["The FAFSA uses tax info from 2 years ago (called 'prior-prior year'). For 2026–27 FAFSA, you'll use 2024 tax returns.", "If your family's situation changed significantly since that tax year, note it — you can appeal for a professional judgment review."],
  },
  {
    step: 3,
    title: "Start Your FAFSA at studentaid.gov",
    description: "Log in with your FSA ID and select 'Start New FAFSA' for the correct award year.",
    documents: [],
    tips: ["Make sure you select the right award year — for fall 2026 enrollment, choose 2026–27.", "Save your progress as you go — the form times out after 45 minutes of inactivity."],
    url: "https://studentaid.gov/h/apply-for-aid/fafsa",
  },
  {
    step: 4,
    title: "Enter Your Student Information",
    description: "Provide your personal information exactly as it appears on your Social Security card.",
    documents: ["Social Security card", "Driver's license or state ID"],
    tips: ["Your name must match your Social Security card exactly — even middle name differences can cause delays.", "If you're not a U.S. citizen, check eligible non-citizen categories carefully."],
  },
  {
    step: 5,
    title: "Determine Your Dependency Status",
    description: "Answer questions to determine if you're a dependent or independent student. Most high school seniors are dependent.",
    documents: [],
    tips: ["If you're under 24, not married, not a veteran, and not emancipated, you're almost certainly dependent.", "Being financially independent from your parents does NOT make you an independent student by FAFSA rules."],
  },
  {
    step: 6,
    title: "Enter Parent Information",
    description: "Provide your parent's or parents' information. Which parent to include depends on your family situation.",
    documents: ["Parent's Social Security Number", "Parent's FSA ID login", "Parent's tax returns and W-2s"],
    tips: ["If your parents are divorced or separated, report info for the parent you lived with most in the past 12 months.", "If your custodial parent remarried, include stepparent's income too.", "A parent who refuses to provide info is not the same as an absent parent — contact your school's financial aid office if this applies."],
  },
  {
    step: 7,
    title: "Link IRS Tax Data (IRS DRT)",
    description: "Use the IRS Direct Data Exchange to pull tax info directly from the IRS — this reduces errors and processing time.",
    documents: [],
    tips: ["Using the IRS DRT significantly speeds up processing and reduces chances of verification.", "If you filed with a tax preparer, the IRS DRT still works — you'll use your FSA ID to authorize it.", "If your family had a major income change (job loss, medical bills), manually enter corrected numbers and explain in the additional info section."],
  },
  {
    step: 8,
    title: "Enter Financial Information",
    description: "Report savings accounts, investments, and other assets. Do NOT include retirement accounts, your primary home, or small businesses with under 100 employees.",
    documents: ["Bank account balances (as of date you sign FAFSA)", "Investment account balances", "529 plan balances"],
    tips: ["529 plans owned by a parent count as a parental asset (assessed at 5.64% max) — not a student asset.", "529 plans owned by a grandparent do NOT need to be reported on the FAFSA.", "Report asset values as of the day you sign, not as of December 31."],
  },
  {
    step: 9,
    title: "Add Your School Codes",
    description: "Enter the Federal School Code for each college you're considering. You can list up to 20 schools.",
    documents: [],
    tips: ["Add ALL schools you're applying to — you can remove them later. Colleges only see their own data.", "Look up school codes at studentaid.gov/fafsa/school-search.", "List your state's flagship university first — some state aid uses the first school listed to determine eligibility."],
    url: "https://studentaid.gov/fafsa/school-search",
  },
  {
    step: 10,
    title: "Sign and Submit",
    description: "You and your parent (if dependent) each sign with your FSA IDs and submit.",
    documents: [],
    tips: ["Both signatures are required — the FAFSA will not submit with only one.", "You'll get an email confirmation with a confirmation number — save it.", "Submission does not mean approval — it starts the processing."],
  },
  {
    step: 11,
    title: "Review Your Student Aid Report (SAR)",
    description: "Within 3–5 days, you'll receive a SAR summarizing your FAFSA. Review it carefully for errors.",
    documents: [],
    tips: ["A 'C flag' on your SAR means a school needs to verify your information — respond promptly.", "Your Expected Family Contribution (now called SAI — Student Aid Index) is not what you'll pay. Schools use it to determine your aid package.", "If you made errors, log back into studentaid.gov and correct them."],
  },
  {
    step: 12,
    title: "Respond to Verification Requests",
    description: "Some students are selected for verification. If asked, submit required documents to your school's financial aid office promptly.",
    documents: [
      "Verification worksheet (from school)",
      "Tax transcripts (IRS.gov)",
      "Identity and statement of educational purpose",
    ],
    tips: ["Verification is not an accusation of fraud — about 30% of students are selected.", "Missing verification deadlines can result in losing all aid — respond within the school's deadline.", "Your financial aid offer is not final until verification is complete."],
  },
];

export const TOTAL_FAFSA_STEPS = FAFSA_STEPS.length; // 12
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 5: CREATE `src/lib/agents/applications/urgency.ts`

Pure function — no DB calls, no side effects.

```typescript
export interface UrgencyInput {
  hasCollegeList: boolean;
  hasFinancialAidRun: boolean;
  hasScholarshipMatches: boolean;
  fafsaCurrentStep: number;        // 0 = not started, 12 = complete
  pendingTasks: Array<{ deadlineDate: Date | string | null }>;
  gradeLevel: number | null;
}

const FAFSA_OPEN_MONTH = 9; // October (0-indexed)
const FAFSA_OPEN_DAY = 1;

function daysUntil(date: Date | string): number {
  const target = new Date(date);
  const today = new Date();
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isFafsaOpen(): boolean {
  const today = new Date();
  return today.getMonth() >= FAFSA_OPEN_MONTH && today.getDate() >= FAFSA_OPEN_DAY;
}

export function computeUrgencyScore(input: UrgencyInput): number {
  let score = 0;
  const reasons: string[] = [];

  // No college list built (+15)
  if (!input.hasCollegeList) {
    score += 15;
    reasons.push("no college list built");
  }

  // FAFSA: not started after October 1 (+30), or in-progress (+10)
  if (isFafsaOpen()) {
    if (input.fafsaCurrentStep === 0) {
      score += 30;
      reasons.push("FAFSA not started");
    } else if (input.fafsaCurrentStep < 12) {
      score += 10;
      reasons.push(`FAFSA in progress (step ${input.fafsaCurrentStep}/12)`);
    }
  }

  // No scholarship matching run (+10)
  if (!input.hasScholarshipMatches) {
    score += 10;
    reasons.push("scholarships not matched");
  }

  // Upcoming task deadlines
  const pendingWithDates = input.pendingTasks
    .filter(t => t.deadlineDate !== null)
    .map(t => daysUntil(t.deadlineDate as Date | string));

  if (pendingWithDates.length > 0) {
    const earliest = Math.min(...pendingWithDates);
    if (earliest <= 3) {
      score += 40;
      reasons.push(`deadline in ${earliest} day${earliest === 1 ? "" : "s"}`);
    } else if (earliest <= 7) {
      score += 30;
      reasons.push(`deadline in ${earliest} days`);
    } else if (earliest <= 14) {
      score += 20;
      reasons.push(`deadline in ${earliest} days`);
    } else if (earliest <= 30) {
      score += 10;
      reasons.push(`deadline in ${earliest} days`);
    }
  }

  return Math.min(100, score);
}

export function buildFlaggedReason(input: UrgencyInput): string {
  const parts: string[] = [];

  if (!input.hasCollegeList) parts.push("No college list");
  if (isFafsaOpen() && input.fafsaCurrentStep === 0) parts.push("FAFSA not started");
  if (!input.hasScholarshipMatches) parts.push("Scholarships not matched");

  const pendingWithDates = input.pendingTasks
    .filter(t => t.deadlineDate !== null)
    .map(t => ({ days: daysUntil(t.deadlineDate as Date | string) }))
    .filter(t => t.days <= 30);

  if (pendingWithDates.length > 0) {
    const earliest = Math.min(...pendingWithDates.map(t => t.days));
    parts.push(`Application deadline in ${earliest} days`);
  }

  return parts.join(", ") || "On track";
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 6: CREATE `src/lib/agents/applications/task-builder.ts`

Pure functions — no DB calls. Takes college list entries and student profile, returns tasks to insert.

```typescript
import type { CollegeListEntryWithCollege, StudentProfile } from "@/types";

export interface TaskToInsert {
  studentProfileId: string;
  collegeId: string | null;
  collegeName: string;
  taskType: "common_app" | "supplement" | "fafsa" | "css_profile" | "scholarship_app" | "institutional_app";
  title: string;
  description: string;
  deadlineDate: Date | null;
  deadlineLabel: string;
  isConflict: boolean;
  conflictNote: string;
}

// Default deadlines by tier (used when no school-specific data available)
const TIER_DEADLINES = {
  reach: { month: 0, day: 1, year: +1, label: "Regular Decision" },   // Jan 1 next year
  match: { month: 0, day: 15, year: +1, label: "Regular Decision" },  // Jan 15 next year
  likely: { month: 1, day: 1, year: +1, label: "Regular Decision" },  // Feb 1 next year
} as const;

// Private schools (ownership=2) typically require CSS Profile
const PRIVATE_OWNERSHIP = 2;

function getDeadlineForTier(tier: "reach" | "match" | "likely"): Date {
  const d = TIER_DEADLINES[tier];
  const now = new Date();
  const year = now.getFullYear() + d.year;
  return new Date(year, d.month, d.day);
}

function getFafsaPriorityDeadline(): Date {
  // Standard advice: December 1 of the application year
  const now = new Date();
  const year = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 11, 1); // December 1
}

export function buildTasksForCollegeList(
  entries: CollegeListEntryWithCollege[],
  studentProfileId: string,
): TaskToInsert[] {
  const tasks: TaskToInsert[] = [];

  // FAFSA task — one per student, not per college
  tasks.push({
    studentProfileId,
    collegeId: null,
    collegeName: "",
    taskType: "fafsa",
    title: "Complete FAFSA",
    description: "The Free Application for Federal Student Aid unlocks Pell Grants, subsidized loans, and most institutional aid. Priority deadlines are typically December 1.",
    deadlineDate: getFafsaPriorityDeadline(),
    deadlineLabel: "Priority Deadline",
    isConflict: false,
    conflictNote: "",
  });

  for (const entry of entries) {
    const { college, tier } = entry;
    const admissionDeadline = getDeadlineForTier(tier);

    // Common App task for every school
    tasks.push({
      studentProfileId,
      collegeId: college.id,
      collegeName: college.name,
      taskType: "common_app",
      title: `Common App — ${college.name}`,
      description: `Submit your Common Application for ${college.name}.`,
      deadlineDate: admissionDeadline,
      deadlineLabel: TIER_DEADLINES[tier].label,
      isConflict: false,
      conflictNote: "",
    });

    // Supplement task for reach/match schools
    if (tier === "reach" || tier === "match") {
      const supplementDeadline = new Date(admissionDeadline);
      tasks.push({
        studentProfileId,
        collegeId: college.id,
        collegeName: college.name,
        taskType: "supplement",
        title: `Essays/Supplement — ${college.name}`,
        description: `Complete supplemental essays and school-specific questions for ${college.name}.`,
        deadlineDate: supplementDeadline,
        deadlineLabel: TIER_DEADLINES[tier].label,
        isConflict: false,
        conflictNote: "",
      });
    }

    // CSS Profile for private schools (ownership = 2)
    if (college.ownership === PRIVATE_OWNERSHIP) {
      // CSS Profile is typically due before the admission deadline
      const cssDeadline = new Date(admissionDeadline);
      cssDeadline.setDate(cssDeadline.getDate() - 14); // 2 weeks before

      // Conflict: CSS Profile deadline is before admission deadline
      const isConflict = cssDeadline < admissionDeadline;

      tasks.push({
        studentProfileId,
        collegeId: college.id,
        collegeName: college.name,
        taskType: "css_profile",
        title: `CSS Profile — ${college.name}`,
        description: `${college.name} requires the CSS Profile for institutional aid. Complete it before the admission deadline.`,
        deadlineDate: cssDeadline,
        deadlineLabel: "CSS Profile Deadline",
        isConflict,
        conflictNote: isConflict
          ? `CSS Profile deadline (${cssDeadline.toLocaleDateString()}) is 2 weeks before the admission deadline — complete this first`
          : "",
      });
    }
  }

  return tasks;
}

export function detectConflicts(tasks: TaskToInsert[]): TaskToInsert[] {
  // Mark tasks where an earlier deadline exists for the same college
  return tasks.map(task => {
    if (task.taskType === "common_app" || task.taskType === "supplement") {
      // Check if css_profile for same college is due after the common_app
      const cssTask = tasks.find(
        t => t.collegeId === task.collegeId && t.taskType === "css_profile"
      );
      if (cssTask && cssTask.deadlineDate && task.deadlineDate) {
        if (new Date(cssTask.deadlineDate) < new Date(task.deadlineDate)) {
          return {
            ...task,
            isConflict: true,
            conflictNote: `Complete CSS Profile (due ${new Date(cssTask.deadlineDate).toLocaleDateString()}) before this deadline`,
          };
        }
      }
    }
    return task;
  });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 7: CREATE `src/lib/agents/applications/__tests__/task-builder.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { buildTasksForCollegeList, detectConflicts } from "../task-builder";

const baseCollege = {
  id: "col-1",
  scorecardId: 123,
  name: "State University",
  city: "Phoenix",
  state: "AZ",
  ownership: 1, // public
  admissionRate: 0.7,
  netPrice0_30k: 12000, netPrice30_48k: 16000,
  netPrice48_75k: 20000, netPrice75_110k: 25000, netPrice110kPlus: 35000,
  completionRate: 0.6, medianEarnings10yr: 50000, studentSize: 40000,
  costOfAttendance: 28000, tuitionInState: 12000, tuitionOutOfState: 28000,
  cachedAt: new Date(),
};

const baseEntry = {
  id: "entry-1",
  studentProfileId: "sp-1",
  collegeId: "col-1",
  tier: "match" as const,
  admissionScore: 70, netPriceScore: 65, outcomeScore: 60, compositeScore: 65,
  explanation: "", applicationStatus: "saved" as const, agentRunId: null,
  createdAt: new Date(), updatedAt: new Date(),
  college: baseCollege,
};

describe("buildTasksForCollegeList", () => {
  it("always creates a FAFSA task", () => {
    const tasks = buildTasksForCollegeList([baseEntry], "sp-1");
    const fafsaTask = tasks.find(t => t.taskType === "fafsa");
    expect(fafsaTask).toBeDefined();
    expect(fafsaTask?.collegeId).toBeNull();
  });

  it("creates a common_app task for each college", () => {
    const tasks = buildTasksForCollegeList([baseEntry], "sp-1");
    const commonApp = tasks.filter(t => t.taskType === "common_app");
    expect(commonApp).toHaveLength(1);
    expect(commonApp[0].collegeName).toBe("State University");
  });

  it("creates supplement task for reach and match, not likely", () => {
    const reachEntry = { ...baseEntry, tier: "reach" as const };
    const likelyEntry = { ...baseEntry, id: "entry-2", tier: "likely" as const, college: { ...baseCollege, id: "col-2" }, collegeId: "col-2" };
    const tasks = buildTasksForCollegeList([reachEntry, likelyEntry], "sp-1");
    const supplements = tasks.filter(t => t.taskType === "supplement");
    expect(supplements).toHaveLength(1); // only reach
    expect(supplements[0].collegeName).toBe("State University");
  });

  it("creates CSS Profile task for private schools (ownership=2)", () => {
    const privateCollege = { ...baseCollege, ownership: 2 };
    const privateEntry = { ...baseEntry, college: privateCollege };
    const tasks = buildTasksForCollegeList([privateEntry], "sp-1");
    const css = tasks.find(t => t.taskType === "css_profile");
    expect(css).toBeDefined();
  });

  it("does NOT create CSS Profile for public schools (ownership=1)", () => {
    const tasks = buildTasksForCollegeList([baseEntry], "sp-1");
    const css = tasks.find(t => t.taskType === "css_profile");
    expect(css).toBeUndefined();
  });
});

describe("detectConflicts", () => {
  it("marks css_profile task as conflict when due before common_app", () => {
    const privateCollege = { ...baseCollege, ownership: 2 };
    const privateEntry = { ...baseEntry, college: privateCollege };
    const tasks = buildTasksForCollegeList([privateEntry], "sp-1");
    const detected = detectConflicts(tasks);
    const cssTask = detected.find(t => t.taskType === "css_profile");
    expect(cssTask?.isConflict).toBe(true);
  });
});
```

- **VALIDATE**: `npx vitest run src/lib/agents/applications/__tests__/task-builder.test.ts`

---

### TASK 8: CREATE `src/lib/agents/applications/__tests__/urgency.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { computeUrgencyScore } from "../urgency";

const baseInput = {
  hasCollegeList: true,
  hasFinancialAidRun: true,
  hasScholarshipMatches: true,
  fafsaCurrentStep: 12, // complete
  pendingTasks: [],
  gradeLevel: 12,
};

describe("computeUrgencyScore", () => {
  it("returns 0 for fully complete student", () => {
    expect(computeUrgencyScore(baseInput)).toBe(0);
  });

  it("adds 15 when no college list", () => {
    const score = computeUrgencyScore({ ...baseInput, hasCollegeList: false });
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it("adds 10 when no scholarship matches", () => {
    const score = computeUrgencyScore({ ...baseInput, hasScholarshipMatches: false });
    expect(score).toBeGreaterThanOrEqual(10);
  });

  it("returns at most 100", () => {
    const worstCase = {
      hasCollegeList: false, hasFinancialAidRun: false, hasScholarshipMatches: false,
      fafsaCurrentStep: 0, gradeLevel: 12,
      pendingTasks: [{ deadlineDate: new Date(Date.now() + 86400000) }], // tomorrow
    };
    expect(computeUrgencyScore(worstCase)).toBeLessThanOrEqual(100);
  });

  it("adds urgency for imminent deadlines", () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const score = computeUrgencyScore({
      ...baseInput,
      pendingTasks: [{ deadlineDate: tomorrow }],
    });
    expect(score).toBeGreaterThan(30);
  });
});
```

- **VALIDATE**: `npx vitest run src/lib/agents/applications/__tests__/urgency.test.ts`

---

### TASK 9: CREATE `src/lib/agents/applications/index.ts`

MIRROR `src/lib/agents/financial-aid/index.ts` exactly. The Application Management Agent:
1. Fetches student's college list with college data
2. Builds tasks using `buildTasksForCollegeList()` and `detectConflicts()`
3. Deletes all existing `applicationTasks` for this student (full refresh on re-run)
4. Inserts new tasks
5. Returns summary

```typescript
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentRuns, applicationTasks, collegeListEntries, studentProfiles } from "@/lib/db/schema";
import { buildTasksForCollegeList, detectConflicts } from "./task-builder";

export async function runApplicationAgent(studentProfileId: string): Promise<string> {
  const startedAt = new Date();
  const [run] = await db.insert(agentRuns).values({
    studentProfileId,
    agentType: "application_management",
    status: "running",
    startedAt,
  }).returning();

  try {
    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, studentProfileId),
    });
    if (!student) throw new Error("Student profile not found");

    const listEntries = await db.query.collegeListEntries.findMany({
      where: eq(collegeListEntries.studentProfileId, studentProfileId),
      with: { college: true },
    });

    if (listEntries.length === 0) {
      throw new Error("No colleges on list. Run the Discovery Agent first.");
    }

    const rawTasks = buildTasksForCollegeList(listEntries, studentProfileId);
    const tasksWithConflicts = detectConflicts(rawTasks);

    // Full refresh — delete old tasks and re-insert
    await db.delete(applicationTasks)
      .where(eq(applicationTasks.studentProfileId, studentProfileId));

    await db.insert(applicationTasks).values(
      tasksWithConflicts.map(t => ({ ...t, agentRunId: run.id }))
    );

    const conflictCount = tasksWithConflicts.filter(t => t.isConflict).length;
    const summary = `Created ${tasksWithConflicts.length} application tasks for ${listEntries.length} colleges${conflictCount > 0 ? ` (${conflictCount} deadline conflicts detected)` : ""}`;

    await db.update(agentRuns).set({
      status: "completed",
      summary,
      durationMs: Date.now() - startedAt.getTime(),
      completedAt: new Date(),
    }).where(eq(agentRuns.id, run.id));

    return summary;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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

### TASK 10: CREATE `src/app/api/agents/applications/route.ts`

MIRROR `src/app/api/agents/financial-aid/route.ts` exactly. Change:
- Import `runApplicationAgent` from `@/lib/agents/applications`
- Error messages reference "application management agent"

- **ADD** `export const dynamic = "force-dynamic"` at top
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 11: CREATE `src/app/api/applications/route.ts`

GET endpoint returning the student's unified task checklist.

```typescript
export const dynamic = "force-dynamic";
import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { applicationTasks, studentProfiles, userProfiles } from "@/lib/db/schema";
import type { ApplicationChecklist } from "@/types";

export async function GET() {
  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userProfile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) });
  if (!userProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userProfileId, userProfile.id),
  });
  if (!studentProfile) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const tasks = await db.query.applicationTasks.findMany({
    where: eq(applicationTasks.studentProfileId, studentProfile.id),
    orderBy: [asc(applicationTasks.deadlineDate)],
  });

  const pending = tasks.filter(t => t.status !== "completed" && t.status !== "skipped");
  const completed = tasks.filter(t => t.status === "completed");
  const conflicts = tasks.filter(t => t.isConflict);
  const nextDeadline = pending.find(t => t.deadlineDate !== null)?.deadlineDate ?? null;

  const checklist: ApplicationChecklist = {
    tasks,
    conflicts,
    totalTasks: tasks.length,
    completedTasks: completed.length,
    nextDeadline,
  };

  return NextResponse.json(checklist);
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 12: CREATE `src/app/api/applications/tasks/[taskId]/route.ts`

PATCH endpoint to update task status.

```typescript
export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { applicationTasks, studentProfiles, userProfiles } from "@/lib/db/schema";

const updateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  // Verify task belongs to authenticated student
  const userProfile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) });
  if (!userProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userProfileId, userProfile.id),
  });
  if (!studentProfile) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const task = await db.query.applicationTasks.findFirst({
    where: eq(applicationTasks.id, taskId),
  });
  if (!task || task.studentProfileId !== studentProfile.id) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const completedAt = parsed.data.status === "completed" ? new Date() : null;

  await db.update(applicationTasks)
    .set({ status: parsed.data.status, completedAt, updatedAt: new Date() })
    .where(eq(applicationTasks.id, taskId));

  return NextResponse.json({ success: true });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 13: CREATE `src/app/api/fafsa/route.ts`

GET endpoint returning FAFSA steps merged with student's progress.

```typescript
export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { FAFSA_STEPS } from "@/lib/agents/applications/fafsa-steps";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { fafsaProgress, studentProfiles, userProfiles } from "@/lib/db/schema";
import type { FafsaStepWithProgress } from "@/types";

export async function GET() {
  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userProfile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id) });
  if (!userProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userProfileId, userProfile.id),
  });
  if (!studentProfile) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const progress = await db.query.fafsaProgress.findFirst({
    where: eq(fafsaProgress.studentProfileId, studentProfile.id),
  });

  const completedSteps = progress ? (JSON.parse(progress.completedSteps) as number[]) : [];
  const currentStep = progress?.currentStep ?? 0;

  const stepsWithProgress: FafsaStepWithProgress[] = FAFSA_STEPS.map(s => ({
    ...s,
    isCompleted: completedSteps.includes(s.step),
  }));

  return NextResponse.json({ steps: stepsWithProgress, currentStep, completedCount: completedSteps.length, totalSteps: FAFSA_STEPS.length });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 14: CREATE `src/app/api/fafsa/progress/route.ts`

PATCH endpoint to mark a FAFSA step complete or incomplete.

```typescript
export const dynamic = "force-dynamic";
// PATCH: { step: number (1-12), completed: boolean }
// Logic:
//   1. Auth check
//   2. Find or create fafsaProgress record for student
//   3. Parse completedSteps JSON array
//   4. Add or remove step number from array
//   5. Recompute currentStep = max completed step (or 0 if none)
//   6. Upsert fafsaProgress record
//   7. Return updated progress
```

- **GOTCHA**: Use `db.insert(fafsaProgress).values({...}).onConflictDoUpdate({ target: fafsaProgress.studentProfileId, set: { completedSteps, currentStep, updatedAt } })` for upsert
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 15: CREATE `src/app/api/counselor/connect/route.ts`

POST endpoint for student to connect to their counselor by school code.

```typescript
export const dynamic = "force-dynamic";
// POST: { schoolCode: string }
// Auth: must be student role
// Logic:
//   1. Auth check → role must be "student"
//   2. Validate { schoolCode } with Zod (non-empty string)
//   3. Find counselorProfile where schoolCode matches
//   4. If not found: return 404 { error: "No counselor found with that school code" }
//   5. Check counselorStudents for existing connection — if exists, return 200 { alreadyConnected: true }
//   6. Insert into counselorStudents (counselorProfileId, studentProfileId)
//   7. Return 201 { connected: true, counselorName: string, schoolName: string }
```

- **GOTCHA**: `counselorProfiles` doesn't have a direct user name — must join with `userProfiles` to get `displayName`. Query: `db.query.counselorProfiles.findFirst({ where: eq(counselorProfiles.schoolCode, code), with: { userProfile: true } })`
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 16: UPDATE `src/app/api/counselor/caseload/route.ts`

This is the most significant backend update. Enhance the existing student-loop to compute urgency scores and return cohort stats.

In the `connections.map(async (conn) => { ... })` block, ADD:

```typescript
// Fetch FAFSA progress
const fafsa = await db.query.fafsaProgress.findFirst({
  where: eq(fafsaProgress.studentProfileId, sp.id),
  columns: { currentStep: true },
});

// Count scholarship matches
const scholarshipMatches = await db.query.studentScholarships.findMany({
  where: eq(studentScholarships.studentProfileId, sp.id),
  columns: { id: true },
});

// Fetch pending application tasks
const pendingTasks = await db.query.applicationTasks.findMany({
  where: and(
    eq(applicationTasks.studentProfileId, sp.id),
    // status not completed — use notEq or sql filter
  ),
  columns: { deadlineDate: true },
});

// Compute urgency
const { computeUrgencyScore, buildFlaggedReason } = await import("@/lib/agents/applications/urgency");
const urgencyInput = {
  hasCollegeList: listEntries.length > 0,
  hasFinancialAidRun: false, // simplification for MVP
  hasScholarshipMatches: scholarshipMatches.length > 0,
  fafsaCurrentStep: fafsa?.currentStep ?? 0,
  pendingTasks: pendingTasks.map(t => ({ deadlineDate: t.deadlineDate })),
  gradeLevel: sp.gradeLevel,
};
const urgencyScore = computeUrgencyScore(urgencyInput);
const flaggedReason = buildFlaggedReason(urgencyInput);
```

Update the returned object to include:
```typescript
{
  ...existingFields,
  urgencyScore,
  flaggedReason,
  milestones: {
    onboarding: up?.onboardingCompleted ? "complete" : "not-started",
    collegeList: listEntries.length > 0 ? "complete" : "not-started",
    scholarships: scholarshipMatches.length > 0 ? "complete" : "not-started",
    fafsa: fafsa?.currentStep === 12 ? "complete" : fafsa?.currentStep > 0 ? "in-progress" : "not-started",
    applications: (await db.query.applicationTasks.findFirst({ where: eq(applicationTasks.studentProfileId, sp.id) })) ? "in-progress" : "not-started",
    lastAgentRun: latestRun?.completedAt ?? null,
  },
}
```

Add `cohortStats` to the final response (computed after Promise.all resolves):
```typescript
const cohortStats: CohortStats = {
  totalStudents: studentSummaries.length,
  fafsaCompletionRate: studentSummaries.filter(s => s.milestones.fafsa === "complete").length / Math.max(1, studentSummaries.length),
  avgScholarshipsMatched: 0, // populated from data above
  avgCollegesOnList: 0,      // populated from data above
  studentsWithApplicationTasks: studentSummaries.filter(s => s.milestones.applications !== "not-started").length,
  highUrgencyCount: studentSummaries.filter(s => s.urgencyScore >= 60).length,
};
return NextResponse.json({ students: studentSummaries, cohortStats, total: studentSummaries.length });
```

- **GOTCHA**: Import `fafsaProgress`, `studentScholarships`, `applicationTasks` at top of file
- **GOTCHA**: Import `and`, `ne` from `"drizzle-orm"` for filtering non-completed tasks: `and(eq(applicationTasks.studentProfileId, sp.id), ne(applicationTasks.status, "completed"))`
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 17: CREATE `src/app/api/counselor/student/[studentId]/route.ts`

GET endpoint for counselor to view full detail of one student.

```typescript
export const dynamic = "force-dynamic";
// GET: returns full student milestone detail + agent run history
// Auth: must be counselor role
// Validate: student must be in counselor's caseload (check counselorStudents junction)
// Returns: StudentProfile, UserProfile, college list count, FAFSA progress,
//          scholarship count, application tasks, last 10 agent runs
```

- **GOTCHA**: Verify ownership via `counselorStudents` — do NOT skip this check or a counselor could read any student's data
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 18: CREATE `src/components/student/application-checklist.tsx`

Client component. Receives `ApplicationChecklist` as prop.

Layout:
```
[Conflict Alert Banner — if any conflicts exist]

Progress: 3 / 12 tasks complete ████░░░░ 25%

FAFSA (December 1)     [pending]        [Mark Complete]
Common App — MIT (Jan 1)  [in_progress] [Mark Complete]
CSS Profile — MIT (Dec 18) ⚠️ Due FIRST [pending]    [Mark Complete]
```

- Use shadcn `Badge` for status (gray=pending, blue=in_progress, green=completed)
- Red warning badge for `isConflict=true` tasks: "⚠️ Deadline conflict"
- "Mark Complete" button calls `PATCH /api/applications/tasks/[taskId]` with `{ status: "completed" }`
- Optimistic UI: toggle status immediately, revert on error
- Sort order: pending tasks by deadline ASC, then completed tasks at bottom
- Empty state: "Running your application checklist..." skeleton
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 19: CREATE `src/components/student/fafsa-guide.tsx`

Client component. Receives `FafsaStepWithProgress[]` as prop.

Layout — accordion style:
```
FAFSA Progress: 4/12 steps complete

✅ Step 1: Create Your FSA ID
✅ Step 2: Gather Your Documents
▶ Step 3: Start Your FAFSA [active]
   Description...
   Documents needed: ...
   First-gen tips: ...
   [Mark Step Complete]  [Go to studentaid.gov →]
○ Step 4: Enter Your Student Information
...
```

- Clicking a step expands it (accordion — use `useState` for `activeStep`)
- Completed steps show ✅, current step shows ▶, future steps show ○
- "Mark Step Complete" calls `PATCH /api/fafsa/progress` with `{ step, completed: true }`
- External links open in `_blank`
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 20: CREATE `src/app/student/applications/page.tsx`

Client page. Auth flow MIRRORS `src/app/student/financial-aid/page.tsx` exactly.

```
<h1>My Applications</h1>
<p className="text-muted-foreground">Track every deadline, all in one place.</p>

{checklist.conflicts.length > 0 && <ConflictAlert conflicts={checklist.conflicts} />}

<ApplicationChecklist checklist={checklist} onTaskUpdated={refetchChecklist} />
```

- If `totalTasks === 0`: auto-trigger `POST /api/agents/applications`, show loading state "Building your application checklist..."
- After agent completes: re-fetch and render tasks
- Link to `/student/fafsa` from a "FAFSA Guide →" button
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 21: CREATE `src/app/student/fafsa/page.tsx`

Client page. Auth flow MIRRORS `src/app/student/financial-aid/page.tsx`.

```
<h1>FAFSA Walkthrough</h1>
<p className="text-muted-foreground">12 steps to unlock your federal aid. Take them one at a time.</p>

<FafsaGuide steps={steps} currentStep={currentStep} onStepToggled={refetch} />
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 22: UPDATE `src/app/student/dashboard/page.tsx`

**ADD** two new navigation cards after the existing "Financial Aid →" link:

```tsx
<Link href="/student/applications">
  <div className="rounded-xl border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
    <h3 className="font-semibold">My Applications</h3>
    <p className="text-sm text-muted-foreground">Track deadlines and requirements</p>
  </div>
</Link>
<Link href="/student/fafsa">
  <div className="rounded-xl border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
    <h3 className="font-semibold">FAFSA Guide</h3>
    <p className="text-sm text-muted-foreground">Step-by-step walkthrough</p>
  </div>
</Link>
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 23: CREATE `src/components/counselor/cohort-stats.tsx`

Client component. Receives `CohortStats` as prop.

```
┌──────────────────────────────────────────────────────────────┐
│  61% FAFSA complete  │  4.2 scholarships avg  │  ⚠️ 8 urgent  │
└──────────────────────────────────────────────────────────────┘
```

- Three stat cards in a responsive 3-column grid
- FAFSA completion % with a color indicator (green ≥ 70%, yellow ≥ 40%, red < 40%)
- High urgency count in red if > 0
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 24: UPDATE `src/components/counselor/caseload-table.tsx`

Add columns for urgency score, FAFSA status, and scholarships. Update the `StudentSummary` interface to include the new `StudentMilestoneStatus` fields.

New columns after existing columns:
- **Urgency** — colored badge: red (≥60), yellow (30-59), green (<30)
- **FAFSA** — "Complete" (green), "In Progress" (blue), "Not Started" (gray)
- **Scholarships** — "Matched" (green checkmark) or "—"

Make student name a link to `/counselor/student/[studentId]` for drill-down view.

- **GOTCHA**: The `StudentSummary` interface is defined locally in `caseload-table.tsx` AND in `counselor/dashboard/page.tsx` — update both to match `StudentMilestoneStatus` from `types/index.ts`. Export `StudentMilestoneStatus` from types and import it in both files.
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 25: UPDATE `src/app/counselor/dashboard/page.tsx`

Add cohort stats display and urgency sort. Update `StudentSummary` type to `StudentMilestoneStatus`.

```tsx
// After fetching caseload:
const { students, cohortStats } = await res.json();

// Render:
<CohortStats stats={cohortStats} />
<div className="flex items-center justify-between">
  <h2 className="text-lg font-semibold">Your Students</h2>
  <button onClick={sortByUrgency}>Sort by Urgency ↓</button>
</div>
<CaseloadTable students={sortedStudents} />

// Also add "Share your school code" section:
<div className="rounded-xl border p-4">
  <p className="text-sm text-muted-foreground">
    Your school code: <code className="font-mono font-bold">{counselorProfile.schoolCode}</code>
  </p>
  <p className="text-xs text-muted-foreground">Share this with students to add them to your caseload</p>
</div>
```

- **GOTCHA**: The dashboard page doesn't currently have access to `counselorProfile.schoolCode`. Fetch it from `GET /api/user` which returns `UserWithProfile` including `counselorProfile`. The `counselorProfile` in `types/index.ts` now has `schoolCode`.
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 26: CREATE `src/app/counselor/student/[studentId]/page.tsx`

Counselor-only view of a single student's full profile.

```
<h1>Maria G. — Grade 12 | First-Gen</h1>

## Milestone Summary
[urgency badge] [FAFSA: In Progress 4/12] [Scholarships: 8 matched] [College List: 9 schools]

## Application Tasks
[application-checklist.tsx — read-only view, no edit buttons]

## FAFSA Progress
[fafsa-guide.tsx — read-only view, no edit buttons]

## Agent Activity Log
[last 10 agent runs in a timeline: agent type, status, date, summary]
```

- Auth check: must be counselor role
- Ownership check: fetch `/api/counselor/student/[studentId]` — returns 403 if student not in caseload
- Read-only props to existing components (or create `readOnly` prop variant)
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 27: GENERATE school codes for existing counselors

School codes need to be populated for existing counselor records (currently all default to `""`). Add a dev API route to backfill:

- CREATE `src/app/api/dev/backfill-school-codes/route.ts` — POST: only in SKIP_AUTH mode; generates a unique 6-char alphanumeric code for each counselor where `schoolCode === ""`
- Pattern: `Math.random().toString(36).substring(2, 8).toUpperCase()`
- Use `db.update(counselorProfiles).set({ schoolCode: code }).where(eq(counselorProfiles.id, id))`
- Check uniqueness before inserting (retry if collision)
- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 28: Final validation sweep

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests pass (expect 90+ tests after new additions)
- `npm run lint` — exit 0
- `nvm use 20 && npm run build` — successful build, all new routes appear in output
- `node -e "require('dotenv').config({path:'.env.local'}); ..." npx drizzle-kit push` — no errors

---

## TESTING STRATEGY

### Unit Tests

- `src/lib/agents/applications/__tests__/task-builder.test.ts` — `buildTasksForCollegeList()`: FAFSA task always created, Common App per college, supplement for reach/match only, CSS Profile for private schools only; `detectConflicts()`: CSS Profile marked as conflict when due before Common App
- `src/lib/agents/applications/__tests__/urgency.test.ts` — `computeUrgencyScore()`: 0 for complete student, +15 for no college list, +30 for no FAFSA after October, urgency scales with deadline proximity, max 100

### Integration Tests (manual, dev flow)

After implementation:
1. Trigger application agent: `curl -X POST http://localhost:3000/api/agents/applications` (with session cookie)
2. Fetch checklist: `curl http://localhost:3000/api/applications` (with session cookie)
3. Mark task complete: `curl -X PATCH http://localhost:3000/api/applications/tasks/{id} -d '{"status":"completed"}'`
4. Fetch FAFSA: `curl http://localhost:3000/api/fafsa`
5. Mark FAFSA step: `curl -X PATCH http://localhost:3000/api/fafsa/progress -d '{"step":1,"completed":true}'`
6. Connect student to counselor: `curl -X POST http://localhost:3000/api/counselor/connect -d '{"schoolCode":"ABC123"}'`
7. Fetch enhanced caseload: `curl http://localhost:3000/api/counselor/caseload` (as counselor)

### Edge Cases

- Student with no college list (agent should throw "Run Discovery Agent first")
- Student in multiple counselors' caseloads (valid — `counselorStudents` allows it)
- FAFSA step marked complete out of order (allowed — no sequential enforcement)
- Counselor with `schoolCode = ""` before backfill (connect API returns 404 — "No counselor with that code")
- Application tasks re-run (agent deletes old tasks and re-inserts — completed tasks lost; caveat in UI)
- Urgency scoring before October 1 (FAFSA not open, no FAFSA urgency added)
- Private school with `ownership = null` (treat as non-private, skip CSS Profile)
- Student accessing `/counselor/student/[id]` (redirect to student dashboard)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
npx tsc --noEmit
npm run lint
```

### Level 2: Unit Tests
```bash
npx vitest run src/lib/agents/applications/__tests__/task-builder.test.ts
npx vitest run src/lib/agents/applications/__tests__/urgency.test.ts
npx vitest run
```

### Level 3: DB Migration
```bash
node -e "require('dotenv').config({path:'.env.local'}); const {execSync}=require('child_process'); console.log(execSync('npx drizzle-kit push',{encoding:'utf8'}));"
```

### Level 4: Manual Validation
```bash
# All commands require a valid session cookie from http://localhost:3000

# Trigger application agent
curl -X POST http://localhost:3000/api/agents/applications \
  -H "Cookie: <session-cookie>"

# Fetch application checklist
curl http://localhost:3000/api/applications \
  -H "Cookie: <session-cookie>"

# Mark first task complete (replace {taskId} with real UUID from above)
curl -X PATCH http://localhost:3000/api/applications/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"status":"completed"}'

# Fetch FAFSA steps
curl http://localhost:3000/api/fafsa \
  -H "Cookie: <session-cookie>"

# Mark FAFSA step 1 complete
curl -X PATCH http://localhost:3000/api/fafsa/progress \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"step":1,"completed":true}'

# Connect student to counselor (run as student with counselor's school code)
curl -X POST http://localhost:3000/api/counselor/connect \
  -H "Content-Type: application/json" \
  -H "Cookie: <student-session-cookie>" \
  -d '{"schoolCode":"ABC123"}'

# Fetch enhanced caseload (run as counselor)
curl http://localhost:3000/api/counselor/caseload \
  -H "Cookie: <counselor-session-cookie>"
```

### Level 5: Build Validation
```bash
source ~/.nvm/nvm.sh && nvm use 20 && npm run build
```

Expected new routes in build output:
- `/student/applications`
- `/student/fafsa`
- `/counselor/student/[studentId]`
- `/api/agents/applications`
- `/api/applications`
- `/api/applications/tasks/[taskId]`
- `/api/fafsa`
- `/api/fafsa/progress`
- `/api/counselor/connect`
- `/api/counselor/student/[studentId]`

---

## ACCEPTANCE CRITERIA

- [ ] Application Management Agent runs without error for a student with a college list
- [ ] `GET /api/applications` returns tasks sorted by deadline, with `isConflict=true` on CSS Profile tasks for private schools
- [ ] `PATCH /api/applications/tasks/[taskId]` correctly updates task status and sets `completedAt`
- [ ] `GET /api/fafsa` returns all 12 steps with correct `isCompleted` field based on progress
- [ ] `PATCH /api/fafsa/progress` persists step completion and updates `currentStep`
- [ ] `POST /api/counselor/connect` creates a `counselorStudents` record and returns counselor name
- [ ] `GET /api/counselor/caseload` returns `urgencyScore`, `flaggedReason`, full `milestones`, and `cohortStats`
- [ ] `/student/applications` page loads, shows task list, auto-triggers agent if no tasks
- [ ] `/student/fafsa` page loads, shows all 12 steps with progress tracking
- [ ] Counselor dashboard shows cohort stats bar and urgency badge per student
- [ ] Student name in caseload table links to `/counselor/student/[studentId]`
- [ ] All unit tests pass (`npx vitest run`) — expect 90+ total tests
- [ ] TypeScript check passes (`npx tsc --noEmit`)
- [ ] Biome lint passes (`npm run lint` exits 0)
- [ ] Build succeeds with all new routes (`npm run build`)

---

## COMPLETION CHECKLIST

- [ ] All 28 tasks completed in order
- [ ] Each task validation passed immediately after implementation
- [ ] DB migration applied successfully
- [ ] `npx vitest run` — all tests pass
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — exit 0
- [ ] `nvm use 20 && npm run build` — successful, all new routes in output
- [ ] Student can see application checklist from dashboard
- [ ] Student can complete FAFSA steps with progress saved
- [ ] Counselor dashboard shows urgency scores and cohort stats
- [ ] Counselor can drill into individual student via name link
- [ ] Student-to-counselor connection works via school code
- [ ] No regressions: Discovery Agent, Financial Aid Agent, Scholarship Agent still work
- [ ] Ready for `/commit`

---

## NOTES

### Why Static FAFSA Steps (Not DB-driven)

The 12 FAFSA steps are federally defined and do not change per student. Only the student's progress through them changes. This keeps the data model simple: one static definition file + one `fafsaProgress` row per student.

### Why Default Deadlines Instead of Scraped Data

Application deadlines per school would require scraping Common App, individual school websites, or purchasing a data API. For MVP, default deadlines by tier (reach=Jan 1, match=Jan 15, likely=Feb 1) give students actionable urgency without requiring a complex data pipeline. Students can mentally adjust ±2 weeks. Phase 4 can add a school deadline seed table.

### Why Full-Refresh on Application Agent Re-Run

The agent deletes and re-inserts all tasks to avoid stale data as the student's college list changes. Trade-off: manually-set `completedAt` timestamps are lost on re-run. Mitigation: the UI shows a toast "Re-running will reset uncompleted tasks" before triggering a re-run. Completed status is preserved via the `completedAt` timestamp approach — if a task existed with `completed` status before deletion, re-insert with the same status (improved version: fetch existing completed task IDs before deletion and re-apply statuses after insert).

### Urgency Score: October 1 Gate

The `isFafsaOpen()` check prevents adding FAFSA urgency before October 1. For students in summer/early fall, the score is based only on college list and scholarship completeness. This avoids false urgency for rising seniors who haven't started the process yet.

### Counselor School Code Generation

`counselorProfiles.schoolCode` defaults to `""`. A dev endpoint (`/api/dev/backfill-school-codes`) generates codes on demand. For new counselor signups in production, generate the school code in the onboarding API route when creating the `counselorProfiles` record. This is not retroactive — only applies to new signups unless the backfill route is called.

### CSS Profile Conflict Detection

The conflict detection logic (CSS Profile due before Common App) is the most valuable conflict to surface for first-gen students, who often miss that private schools require a separate form on a different deadline. The `isConflict=true` flag + red UI badge makes this unmissable.

### Confidence Score: 8.5/10

High confidence because:
- Clear agent-runner pattern from Phase 2 to mirror exactly
- All financial calculations are pure functions (easy to test and verify)
- Schema additions are additive (no breaking changes to existing tables)
- FAFSA steps are static (no LLM risk, no external API dependency)
- Urgency scoring is deterministic (easily testable)
- Student-to-counselor connection is a simple junction table insert

Risks:
- `counselorStudents` relation query in caseload route uses `with: { student: { with: { userProfile: true } } }` — verify this nested `with` clause works in Drizzle (it should; discovery agent uses similar pattern)
- Dynamic route params in Next.js 15 App Router use `Promise<{ param: string }>` — must `await params` before destructuring (see TASK 12 pattern)
- The caseload enhancement in TASK 16 adds N+4 DB queries per student (FAFSA, scholarships, tasks, agent runs) — for 500 students this is 2500+ queries. Phase 4 optimization: batch these into single queries using `in()` operator before the map.
