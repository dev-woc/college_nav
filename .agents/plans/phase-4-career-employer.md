# Feature: Phase 4 — Career & Employer Layer

The following plan should be complete, but validate documentation and codebase patterns before starting.
Pay special attention to naming of existing utils, types, and models. Import from the right files.

---

## Feature Description

Phase 4 adds the **Career & Employer Layer** to the platform. This phase extends the college navigation journey into post-graduation outcomes — connecting students to occupational wage data, career pathway visualizations, and a curated employer matching engine. Employers can register recruiting preferences (school tiers, majors, role types) and the platform surfaces matched opportunities to students. The agent caches BLS API responses as career snapshots to avoid rate-limit hammering, refreshing every 24 hours.

The BLS integration (`src/lib/integrations/bls.ts`) and career pathways library (`src/lib/career/pathways.ts`) already exist and work. The `GET /api/career` route already fetches live data on demand. Phase 4 layers caching, employer matching, and a full UI page on top of that foundation.

## User Story

As a first-generation college student who has just built my college list
I want to see what careers my intended major leads to — with real salary ranges, job growth data, and companies that recruit students from schools on my list
So that I can make a financially informed major and college choice, and know which employers are actively looking for someone like me

As a talent acquisition manager at a company with campus recruiting
I want to register my employer's recruiting preferences — which school tiers, majors, and role types we target — so that our opportunities appear automatically to matched students

## Problem Statement

Phases 1–3 give students a college list, financial aid transparency, scholarship matches, and application management. But students still have no clear picture of where a given major leads them economically — and no passive connection to employers who want to hire from the schools they are considering. The career data exists (BLS API, pathway mappings) but is only available via an on-demand route that hammers the API on every page load. There is no employer layer at all.

## Solution Statement

1. Add `careerSnapshots`, `employers`, and `employerRecruitingPrefs` tables + `roleTypeEnum` to schema
2. Add new types: `CareerSnapshot`, `Employer`, `EmployerRecruitingPref`, `EmployerMatch`, `CareerPageData`
3. Build Career Agent: runs `findPathwayForMajor` + `fetchOccupationWages` inline, upserts `careerSnapshots`, logs to `agentRuns`
4. Build `matchEmployers()` pure function: tier intersection + major keyword match, returns ranked `EmployerMatch[]`
5. Build seed data: 8–10 realistic employers with recruiting prefs across tech, healthcare, finance, consulting, public sector
6. Build API routes: `POST /api/agents/career`, `GET /api/career/snapshot`, `GET /api/career/employers`, `POST /api/employers`, `POST /api/employers/seed`
7. Build UI components: `career-pathway.tsx` (occupation cards with wages), `employer-list.tsx` (employer cards)
8. Build `/student/career` page: auth check, auto-trigger agent if snapshot missing/stale, render pathway + employers
9. Update `/student/dashboard` page: add 4th nav card "Career Paths" linking to `/student/career`

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: DB schema, agent layer, API routes, student UI
**Dependencies**: No new npm packages required (all dependencies already installed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — MUST READ BEFORE IMPLEMENTING

- `src/lib/db/schema.ts` — All table/enum patterns. New enum `roleTypeEnum` goes after `taskStatusEnum`. New tables go after `fafsaProgress`. Relations follow the existing pattern at the bottom. The `agentType` field in `agentRuns` is `text()` — no enum constraint — so `"career"` is valid immediately.
- `src/lib/db/index.ts` — Lazy Proxy DB init pattern; do NOT call `neon()` at module load
- `src/lib/agents/financial-aid/index.ts` — **MIRROR THIS EXACTLY** for career agent runner: insert agentRun → try work → upsert snapshot → update status → return summary string. Lines 12–77.
- `src/app/api/agents/financial-aid/route.ts` — **MIRROR THIS EXACTLY** for `POST /api/agents/career`: `export const dynamic = "force-dynamic"` → rate limit → `auth.getSession()` → validate `role=student` → validate `onboardingCompleted` → find `studentProfile` → run agent → 202. Lines 1–63.
- `src/app/api/career/route.ts` — Existing career route. The new Career Agent reuses the same `findPathwayForMajor + fetchOccupationWages` logic inline. The snapshot API routes complement (not replace) this route.
- `src/lib/career/pathways.ts` — `CareerPathway`, `CareerOption`, `EducationStep` interfaces; `CAREER_PATHWAYS` array; `findPathwayForMajor(major)` function. Line 520: `findPathwayForMajor` returns `CareerPathway | null`.
- `src/lib/integrations/bls.ts` — `BlsWageData` interface (line 9); `fetchOccupationWages(occupationCode): Promise<Pick<BlsWageData, ...>>` (line 34). Returns `{ medianAnnualWage, entryLevelWage, employmentCount }` — nullable fields.
- `src/lib/auth/server.ts` — `auth.getSession()` → `{ data: { user: { id } } }` or null
- `src/lib/rate-limit.ts` — `apiRateLimiter` pre-exported; use `apiRateLimiter.check(ip)`
- `src/types/index.ts` — `InferSelectModel<typeof table>` pattern for all type exports. `CareerSnapshot`, `Employer`, `EmployerRecruitingPref` will follow the same pattern at lines 29–30.
- `src/app/student/dashboard/page.tsx` — Page auth flow + current nav cards (3 cards at lines 131–151). Add 4th card for Career Paths. Cards use `sm:grid-cols-3` currently → update to `sm:grid-cols-4`.
- `src/app/student/financial-aid/page.tsx` — **MIRROR THIS** for `/student/career/page.tsx`: client component, `useCallback` fetches, `useEffect` init, loading state, auto-trigger pattern at lines 70–83.
- `src/lib/agents/scholarships/matching.ts` — Pure scoring function pattern. MIRROR for `matchEmployers()`.
- `src/lib/agents/discovery/__tests__/scoring.test.ts` — Vitest unit test pattern: `describe/it/expect`, typed fixture objects at lines 13–50.

### New Files to Create

```
src/
├── lib/
│   ├── db/
│   │   └── schema.ts                   UPDATE — add roleTypeEnum enum;
│   │                                           add careerSnapshots, employers,
│   │                                           employerRecruitingPrefs tables;
│   │                                           add relations for new tables
│   ├── agents/
│   │   └── career/
│   │       ├── index.ts                NEW — Career Agent runner (mirrors financial-aid/index.ts)
│   │       ├── employer-matcher.ts     NEW — matchEmployers() pure function
│   │       ├── seed-employers.ts       NEW — 8-10 seed employer records with prefs
│   │       └── __tests__/
│   │           └── employer-matcher.test.ts  NEW — unit tests for matchEmployers()
└── types/
    └── index.ts                        UPDATE — add CareerSnapshot, Employer,
                                                 EmployerRecruitingPref, EmployerMatch,
                                                 CareerPageData types

src/app/
├── api/
│   ├── agents/
│   │   └── career/
│   │       └── route.ts               NEW — POST: trigger Career Agent
│   ├── career/
│   │   ├── snapshot/
│   │   │   └── route.ts               NEW — GET: return cached snapshot (null if stale/missing)
│   │   └── employers/
│   │       └── route.ts               NEW — GET: return EmployerMatch[] for student
│   └── employers/
│       ├── route.ts                   NEW — POST: employer self-registration
│       └── seed/
│           └── route.ts               NEW — POST: dev-only seed route
├── student/
│   └── career/
│       └── page.tsx                   NEW — full career page
│
│   dashboard/
│       └── page.tsx                   UPDATE — add 4th nav card "Career Paths"

src/components/
└── student/
    ├── career-pathway.tsx             NEW — occupation cards with wages, outlook, education steps
    └── employer-list.tsx              NEW — employer match cards
```

### Relevant Documentation — SHOULD READ BEFORE IMPLEMENTING

- BLS API docs: https://www.bls.gov/bls/api_features.htm — no key required for v1
- Drizzle ORM relations: follow exact pattern in `schema.ts` — new `relations()` exports at bottom of file
- Next.js dynamic routes: `GET /api/career/snapshot/route.ts` is a simple file route (no params needed)
- JSON storage pattern: same as scholarships — `text()` column, `JSON.stringify()` on write, `JSON.parse()` on read

### Patterns to Follow

**Agent Runner Pattern** — MIRROR `src/lib/agents/financial-aid/index.ts` exactly:
```typescript
export async function runCareerAgent(studentProfileId: string): Promise<string> {
  const startedAt = new Date();
  const [run] = await db.insert(agentRuns).values({
    studentProfileId, agentType: "career", status: "running", startedAt,
  }).returning();
  try {
    // ... find student → findPathwayForMajor → fetchOccupationWages → upsert snapshot ...
    const summary = `Career snapshot updated for major: ${major}`;
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

**JSON Array/Object Storage Pattern** (same as scholarships and award letters):
```typescript
// Store: JSON.stringify(value) in text() column
// Read: JSON.parse(row.field)
// Use text() NOT jsonb — free Neon tier schema compatibility
```

**Staleness Check Pattern** — 24-hour TTL for career snapshot:
```typescript
function isSnapshotStale(snapshot: CareerSnapshot): boolean {
  const ageMs = Date.now() - new Date(snapshot.lastRefreshedAt).getTime();
  return ageMs > 24 * 60 * 60 * 1000; // 24 hours
}
```

**Auto-trigger Pattern** — mirrors financial-aid page (lines 70–73 of financial-aid/page.tsx):
```typescript
// In useEffect init: if snapshot is null or stale, fire POST /api/agents/career silently
if (!snapshot || isSnapshotStale(snapshot)) {
  fetch("/api/agents/career", { method: "POST" });
}
```

**Employer Matcher Pattern** — pure function, deterministic, sortable:
```typescript
export function matchEmployers(
  employers: (Employer & { recruitingPrefs: EmployerRecruitingPref[] })[],
  studentCollegeTiers: string[],
  studentMajor: string,
): EmployerMatch[]
// Sort: major-match=true first, then alphabetically by employer name
```

---

## IMPLEMENTATION PLAN

### Phase 1: Schema + Types Foundation

Extend DB schema with 3 new tables + 1 new enum, add relations, update types.

**Tasks:**
- ADD `roleTypeEnum` enum to `schema.ts`
- ADD `careerSnapshots` table to `schema.ts`
- ADD `employers` table to `schema.ts`
- ADD `employerRecruitingPrefs` table to `schema.ts`
- ADD Drizzle relations for all new tables
- UPDATE `types/index.ts` with new exported types
- RUN `db:push` to apply schema

### Phase 2: Career Agent

Pure logic + agent runner — career snapshot upsert, employer matcher, seed data.

**Tasks:**
- CREATE `employer-matcher.ts` with pure `matchEmployers()` function
- CREATE `seed-employers.ts` with 8–10 seed employer records
- CREATE `career/index.ts` agent runner (mirrors financial-aid runner)
- WRITE unit tests for `matchEmployers()`

### Phase 3: API Routes

6 new API routes — agent trigger, snapshot fetch, employer match, employer registration, seed.

**Tasks:**
- CREATE `POST /api/agents/career` — trigger agent
- CREATE `GET /api/career/snapshot` — cached snapshot with staleness check
- CREATE `GET /api/career/employers` — EmployerMatch[] for student
- CREATE `POST /api/employers` — employer self-registration (no auth required)
- CREATE `POST /api/employers/seed` — dev-only seed route

### Phase 4: Student UI

Career pathway component, employer list component, full career page, dashboard nav update.

**Tasks:**
- CREATE `career-pathway.tsx` — occupation cards with wages and education steps
- CREATE `employer-list.tsx` — employer match cards with tier/major match badges
- CREATE `/student/career/page.tsx` — full page with auto-trigger logic
- UPDATE `/student/dashboard/page.tsx` — add 4th nav card

### Phase 5: Final Validation

Full sweep — types, tests, lint, build.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### TASK 1: UPDATE `src/lib/db/schema.ts` — Add enum + tables + relations

**ADD** `roleTypeEnum` after `taskStatusEnum` (line 65):
```typescript
export const roleTypeEnum = pgEnum("role_type", ["internship", "full_time", "both"]);
```

**ADD** `careerSnapshots` table after `fafsaProgress` (after line 370):
```typescript
// Career snapshot — caches BLS API response per student (refreshed every 24h)
export const careerSnapshots = pgTable("career_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentProfileId: uuid("student_profile_id").notNull().unique()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  major: text("major").notNull(),
  pathwayJson: text("pathway_json").notNull().default("null"),  // JSON.stringify(CareerPathway | null)
  wageDataJson: text("wage_data_json").notNull().default("{}"), // JSON.stringify(Record<string, BlsWageData>)
  lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_career_snapshots_student").on(table.studentProfileId),
]);
```

**ADD** `employers` table after `careerSnapshots`:
```typescript
// Employers — companies that recruit from colleges on the platform
export const employers = pgTable("employers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default(""),
  description: text("description").notNull().default(""),
  website: text("website").notNull().default(""),
  logoUrl: text("logo_url").notNull().default(""),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**ADD** `employerRecruitingPrefs` table after `employers`:
```typescript
// Employer recruiting preferences — what school tiers, majors, and roles they target
export const employerRecruitingPrefs = pgTable("employer_recruiting_prefs", {
  id: uuid("id").defaultRandom().primaryKey(),
  employerId: uuid("employer_id").notNull()
    .references(() => employers.id, { onDelete: "cascade" }),
  // JSON array of tier strings: JSON.stringify(["reach","match","likely"])
  collegeTiers: text("college_tiers").notNull().default('["reach","match","likely"]'),
  minGpa: text("min_gpa").notNull().default("0.0"),  // stored as text for flexibility
  // JSON array of keywords: JSON.stringify(["computer science","cs","software"])
  majorKeywords: text("major_keywords").notNull().default("[]"),
  roleType: roleTypeEnum("role_type").notNull().default("both"),
  targetGradYear: integer("target_grad_year"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_employer_prefs_employer").on(table.employerId),
]);
```

**ADD** Drizzle relations for new tables at the bottom of the relations section (after `fafsaProgressRelations`):
```typescript
export const careerSnapshotsRelations = relations(careerSnapshots, ({ one }) => ({
  studentProfile: one(studentProfiles, {
    fields: [careerSnapshots.studentProfileId],
    references: [studentProfiles.id],
  }),
}));

export const employersRelations = relations(employers, ({ many }) => ({
  recruitingPrefs: many(employerRecruitingPrefs),
}));

export const employerRecruitingPrefsRelations = relations(employerRecruitingPrefs, ({ one }) => ({
  employer: one(employers, {
    fields: [employerRecruitingPrefs.employerId],
    references: [employers.id],
  }),
}));
```

**ADD** `careerSnapshot` to `studentProfilesRelations` (after `fafsaProgress` on line 399):
```typescript
careerSnapshot: one(careerSnapshots, {
  fields: [studentProfiles.id],
  references: [careerSnapshots.studentProfileId],
}),
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 2: UPDATE `src/types/index.ts` — Add new exported types

**ADD** imports for new schema tables after existing imports (after `fafsaProgress` on line 11):
```typescript
import type { careerSnapshots, employerRecruitingPrefs, employers } from "@/lib/db/schema";
```

**ADD** new model types after `FafsaProgress` (line 30):
```typescript
export type CareerSnapshot = InferSelectModel<typeof careerSnapshots>;
export type Employer = InferSelectModel<typeof employers>;
export type EmployerRecruitingPref = InferSelectModel<typeof employerRecruitingPrefs>;
```

**ADD** new interface types after `CohortStats` (after line 176):
```typescript
export interface EmployerMatch {
  employer: Employer;
  pref: EmployerRecruitingPref;
  matchedTiers: string[];   // which of student's college tiers intersect with pref.collegeTiers
  matchedMajor: boolean;    // true if any majorKeyword appears in student's intendedMajor
}

export interface CareerPageData {
  snapshot: CareerSnapshot | null;
  pathway: import("@/lib/career/pathways").CareerPathway | null;
  wageData: Record<string, import("@/lib/integrations/bls").BlsWageData>;
  employers: EmployerMatch[];
  major: string | null;
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 3: RUN DB migration

```bash
node -e "require('dotenv').config({path: '.env.local'}); const { execSync } = require('child_process'); console.log(execSync('npx drizzle-kit push', { encoding: 'utf8' }));"
```

- Confirm new tables: `career_snapshots`, `employers`, `employer_recruiting_prefs`
- Confirm new enum: `role_type` with values `internship`, `full_time`, `both`
- **VALIDATE**: Migration output shows `[✓] Changes applied`

---

### TASK 4: CREATE `src/lib/agents/career/employer-matcher.ts`

Pure function — no DB, no side effects. Easy to unit test.

```typescript
import type { Employer, EmployerMatch, EmployerRecruitingPref } from "@/types";

/**
 * Match employers against a student's college tiers and intended major.
 * Pure function — no DB calls, deterministic, unit-testable.
 *
 * Matching rules:
 * 1. An employer's active pref must have at least one matching college tier
 * 2. Major match is a bonus: any majorKeyword (case-insensitive) substring of studentMajor
 * 3. Sort: major-match=true first, then alphabetically by employer name
 */
export function matchEmployers(
  employersWithPrefs: (Employer & { recruitingPrefs: EmployerRecruitingPref[] })[],
  studentCollegeTiers: string[],   // e.g. ["reach", "match", "likely"]
  studentMajor: string,
): EmployerMatch[] {
  const results: EmployerMatch[] = [];
  const majorLower = studentMajor.toLowerCase();

  for (const employer of employersWithPrefs) {
    for (const pref of employer.recruitingPrefs) {
      if (!pref.isActive) continue;

      // Parse stored JSON arrays
      const prefTiers: string[] = JSON.parse(pref.collegeTiers);
      const prefKeywords: string[] = JSON.parse(pref.majorKeywords);

      // Tier intersection — student must have at least one tier the employer targets
      const matchedTiers = studentCollegeTiers.filter((t) => prefTiers.includes(t));
      if (matchedTiers.length === 0) continue;

      // Major match — any keyword is a case-insensitive substring of student's major
      const matchedMajor =
        prefKeywords.length === 0 ||
        prefKeywords.some((kw) => majorLower.includes(kw.toLowerCase()));

      results.push({
        employer: {
          id: employer.id,
          name: employer.name,
          industry: employer.industry,
          description: employer.description,
          website: employer.website,
          logoUrl: employer.logoUrl,
          isVerified: employer.isVerified,
          createdAt: employer.createdAt,
          updatedAt: employer.updatedAt,
        },
        pref,
        matchedTiers,
        matchedMajor,
      });
      break; // one match per employer (first active pref that matches)
    }
  }

  // Sort: major match first, then alphabetically
  results.sort((a, b) => {
    if (a.matchedMajor && !b.matchedMajor) return -1;
    if (!a.matchedMajor && b.matchedMajor) return 1;
    return a.employer.name.localeCompare(b.employer.name);
  });

  return results;
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 5: CREATE `src/lib/agents/career/__tests__/employer-matcher.test.ts`

Mirror the scoring test pattern from `src/lib/agents/discovery/__tests__/scoring.test.ts`.

```typescript
import { describe, expect, it } from "vitest";
import type { Employer, EmployerRecruitingPref } from "@/types";
import { matchEmployers } from "../employer-matcher";

// Minimal fixture factories
function makeEmployer(overrides: Partial<Employer> = {}): Employer {
  return {
    id: "emp-uuid-1",
    name: "Acme Corp",
    industry: "Technology",
    description: "",
    website: "https://acme.com",
    logoUrl: "",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePref(overrides: Partial<EmployerRecruitingPref> = {}): EmployerRecruitingPref {
  return {
    id: "pref-uuid-1",
    employerId: "emp-uuid-1",
    collegeTiers: JSON.stringify(["reach", "match", "likely"]),
    minGpa: "3.0",
    majorKeywords: JSON.stringify(["computer science", "software"]),
    roleType: "both",
    targetGradYear: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("matchEmployers", () => {
  it("returns match when student has overlapping tier", () => {
    const emp = { ...makeEmployer(), recruitingPrefs: [makePref()] };
    const results = matchEmployers([emp], ["match"], "Computer Science");
    expect(results).toHaveLength(1);
    expect(results[0].matchedTiers).toContain("match");
  });

  it("returns empty when no tier overlap", () => {
    // Employer only targets reach; student has match + likely
    const pref = makePref({ collegeTiers: JSON.stringify(["reach"]) });
    const emp = { ...makeEmployer(), recruitingPrefs: [pref] };
    const results = matchEmployers([emp], ["match", "likely"], "Computer Science");
    expect(results).toHaveLength(0);
  });

  it("sets matchedMajor true when major keyword is substring of student major", () => {
    const emp = { ...makeEmployer(), recruitingPrefs: [makePref()] };
    const results = matchEmployers([emp], ["reach", "match"], "Computer Science and Engineering");
    expect(results[0].matchedMajor).toBe(true);
  });

  it("sets matchedMajor false when no keyword matches", () => {
    const pref = makePref({ majorKeywords: JSON.stringify(["nursing", "healthcare"]) });
    const emp = { ...makeEmployer(), recruitingPrefs: [pref] });
    const results = matchEmployers([emp], ["match"], "Computer Science");
    expect(results[0].matchedMajor).toBe(false);
  });

  it("sets matchedMajor true when majorKeywords is empty array (all majors welcome)", () => {
    const pref = makePref({ majorKeywords: JSON.stringify([]) });
    const emp = { ...makeEmployer(), recruitingPrefs: [pref] };
    const results = matchEmployers([emp], ["match"], "Anything at All");
    expect(results[0].matchedMajor).toBe(true);
  });

  it("skips inactive prefs", () => {
    const pref = makePref({ isActive: false });
    const emp = { ...makeEmployer(), recruitingPrefs: [pref] };
    const results = matchEmployers([emp], ["match"], "Computer Science");
    expect(results).toHaveLength(0);
  });

  it("sorts major-match employers before non-major-match employers", () => {
    const empA = {
      ...makeEmployer({ id: "emp-a", name: "Zebra Corp" }),
      recruitingPrefs: [makePref({ id: "pref-a", employerId: "emp-a" })],
    };
    const empB = {
      ...makeEmployer({
        id: "emp-b",
        name: "Alpha Inc",
      }),
      recruitingPrefs: [
        makePref({
          id: "pref-b",
          employerId: "emp-b",
          majorKeywords: JSON.stringify(["nursing"]),
        }),
      ],
    };
    // empA matches major (CS), empB does not → empA should come first despite name order
    const results = matchEmployers([empA, empB], ["match"], "Computer Science");
    expect(results[0].employer.name).toBe("Zebra Corp"); // major match wins
    expect(results[1].employer.name).toBe("Alpha Inc");
  });

  it("sorts alphabetically within same matchedMajor tier", () => {
    const empA = {
      ...makeEmployer({ id: "emp-a", name: "Zebra Corp" }),
      recruitingPrefs: [makePref({ id: "pref-a", employerId: "emp-a", majorKeywords: JSON.stringify([]) })],
    };
    const empB = {
      ...makeEmployer({ id: "emp-b", name: "Alpha Inc" }),
      recruitingPrefs: [makePref({ id: "pref-b", employerId: "emp-b", majorKeywords: JSON.stringify([]) })],
    };
    const results = matchEmployers([empA, empB], ["match"], "Computer Science");
    expect(results[0].employer.name).toBe("Alpha Inc");
    expect(results[1].employer.name).toBe("Zebra Corp");
  });

  it("returns one result per employer even with multiple active prefs", () => {
    const pref1 = makePref({ id: "pref-1" });
    const pref2 = makePref({ id: "pref-2", roletype: "full_time" });
    const emp = { ...makeEmployer(), recruitingPrefs: [pref1, pref2] };
    const results = matchEmployers([emp], ["match"], "Computer Science");
    expect(results).toHaveLength(1);
  });
});
```

- **VALIDATE**: `npx vitest run src/lib/agents/career/__tests__/employer-matcher.test.ts`

---

### TASK 6: CREATE `src/lib/agents/career/seed-employers.ts`

Realistic seed data covering tech, healthcare, finance, consulting, and public sector. Matching prefs reflect realistic recruiting patterns.

```typescript
/**
 * Seed employers for the Career & Employer layer.
 * 8-10 well-known employers with realistic recruiting preferences.
 * Used by POST /api/employers/seed (dev-only).
 */
export const SEED_EMPLOYERS: Array<{
  employer: {
    name: string;
    industry: string;
    description: string;
    website: string;
    logoUrl: string;
    isVerified: boolean;
  };
  prefs: {
    collegeTiers: string;      // JSON.stringify(string[])
    minGpa: string;
    majorKeywords: string;     // JSON.stringify(string[])
    roleType: "internship" | "full_time" | "both";
    targetGradYear: number | null;
    isActive: boolean;
  }[];
}> = [
  // ── Technology ──────────────────────────────────────────────────
  {
    employer: {
      name: "Google",
      industry: "Technology",
      description: "Multinational technology company specializing in internet-related services and products, including search, cloud computing, and software.",
      website: "https://careers.google.com",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match"]),
      minGpa: "3.5",
      majorKeywords: JSON.stringify(["computer science", "software engineering", "data science", "electrical engineering", "mathematics"]),
      roleType: "both",
      targetGradYear: null,
      isActive: true,
    }],
  },
  {
    employer: {
      name: "Microsoft",
      industry: "Technology",
      description: "Global technology company developing and supporting software, services, devices, and solutions.",
      website: "https://careers.microsoft.com",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match", "likely"]),
      minGpa: "3.0",
      majorKeywords: JSON.stringify(["computer science", "software", "information technology", "engineering", "data science"]),
      roleType: "both",
      targetGradYear: null,
      isActive: true,
    }],
  },
  // ── Healthcare ───────────────────────────────────────────────────
  {
    employer: {
      name: "Kaiser Permanente",
      industry: "Healthcare",
      description: "Integrated managed care consortium — one of the largest nonprofit health plans in the United States.",
      website: "https://jobs.kaiserpermanente.org",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match", "likely"]),
      minGpa: "3.0",
      majorKeywords: JSON.stringify(["nursing", "healthcare", "health science", "public health", "biology", "pre-med"]),
      roleType: "full_time",
      targetGradYear: null,
      isActive: true,
    }],
  },
  {
    employer: {
      name: "Mayo Clinic",
      industry: "Healthcare",
      description: "Nonprofit academic medical center focused on integrated clinical practice, education, and research.",
      website: "https://jobs.mayoclinic.org",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match"]),
      minGpa: "3.5",
      majorKeywords: JSON.stringify(["nursing", "pre-med", "medical", "health science", "biology", "biochemistry"]),
      roleType: "both",
      targetGradYear: null,
      isActive: true,
    }],
  },
  // ── Finance ──────────────────────────────────────────────────────
  {
    employer: {
      name: "Goldman Sachs",
      industry: "Finance",
      description: "Global investment banking, securities, and investment management firm.",
      website: "https://www.goldmansachs.com/careers",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach"]),
      minGpa: "3.7",
      majorKeywords: JSON.stringify(["finance", "economics", "mathematics", "statistics", "computer science", "accounting"]),
      roleType: "both",
      targetGradYear: null,
      isActive: true,
    }],
  },
  {
    employer: {
      name: "JPMorgan Chase",
      industry: "Finance",
      description: "Global financial services firm and one of the largest banking institutions in the United States.",
      website: "https://careers.jpmorgan.com",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match"]),
      minGpa: "3.3",
      majorKeywords: JSON.stringify(["finance", "economics", "accounting", "business", "mathematics", "computer science"]),
      roleType: "both",
      targetGradYear: null,
      isActive: true,
    }],
  },
  // ── Consulting ───────────────────────────────────────────────────
  {
    employer: {
      name: "McKinsey & Company",
      industry: "Consulting",
      description: "Global management consulting firm serving leading businesses, governments, and nonprofits.",
      website: "https://www.mckinsey.com/careers",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach"]),
      minGpa: "3.7",
      majorKeywords: JSON.stringify([]),  // recruits all majors — empty = any major welcome
      roleType: "both",
      targetGradYear: null,
      isActive: true,
    }],
  },
  {
    employer: {
      name: "Deloitte",
      industry: "Consulting",
      description: "Professional services network providing audit, consulting, financial advisory, risk advisory, and tax services.",
      website: "https://www2.deloitte.com/us/en/careers.html",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match", "likely"]),
      minGpa: "3.0",
      majorKeywords: JSON.stringify([]),  // all majors
      roleType: "both",
      targetGradYear: null,
      isActive: true,
    }],
  },
  // ── Public Sector / Nonprofit ────────────────────────────────────
  {
    employer: {
      name: "Peace Corps",
      industry: "Public Sector / Nonprofit",
      description: "U.S. government program that places volunteers in communities worldwide to work on education, environment, health, and economic development.",
      website: "https://www.peacecorps.gov/volunteer",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match", "likely"]),
      minGpa: "0.0",
      majorKeywords: JSON.stringify([]),  // all majors — Peace Corps accepts any background
      roleType: "full_time",
      targetGradYear: null,
      isActive: true,
    }],
  },
  {
    employer: {
      name: "Teach For America",
      industry: "Public Sector / Nonprofit",
      description: "Nonprofit organization that recruits college graduates and professionals to teach for two years in low-income communities across the U.S.",
      website: "https://www.teachforamerica.org/join-tfa",
      logoUrl: "",
      isVerified: true,
    },
    prefs: [{
      collegeTiers: JSON.stringify(["reach", "match", "likely"]),
      minGpa: "2.5",
      majorKeywords: JSON.stringify([]),  // all majors
      roleType: "full_time",
      targetGradYear: null,
      isActive: true,
    }],
  },
];
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 7: CREATE `src/lib/agents/career/index.ts` — Career Agent runner

Mirrors `src/lib/agents/financial-aid/index.ts` (lines 1–77) exactly in structure.

```typescript
import { eq } from "drizzle-orm";
import { findPathwayForMajor } from "@/lib/career/pathways";
import { db } from "@/lib/db";
import { agentRuns, careerSnapshots, studentProfiles, userProfiles } from "@/lib/db/schema";
import { fetchOccupationWages } from "@/lib/integrations/bls";

/**
 * Run the Career Agent for a student.
 * Fetches career pathway + BLS wage data for up to 3 careers,
 * upserts a career_snapshots record, and logs the run.
 * Returns a summary string on success, throws on failure.
 */
export async function runCareerAgent(studentProfileId: string): Promise<string> {
  const startedAt = new Date();

  const [run] = await db
    .insert(agentRuns)
    .values({
      studentProfileId,
      agentType: "career",
      status: "running",
      startedAt,
    })
    .returning();

  try {
    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, studentProfileId),
    });
    if (!student) throw new Error("Student profile not found");
    if (!student.intendedMajor) {
      throw new Error("Student must set an intended major before running the Career Agent");
    }

    const major = student.intendedMajor;
    const pathway = findPathwayForMajor(major);

    // Fetch BLS wage data for up to 3 careers (same cap as GET /api/career)
    const wageData: Record<string, {
      medianAnnualWage: number | null;
      entryLevelWage: number | null;
      employmentCount: number | null;
    }> = {};

    if (pathway) {
      const careersToFetch = pathway.careers.slice(0, 3);
      const wageResults = await Promise.allSettled(
        careersToFetch.map((career) => fetchOccupationWages(career.blsOccupationCode)),
      );
      for (let i = 0; i < careersToFetch.length; i++) {
        const result = wageResults[i];
        wageData[careersToFetch[i].blsOccupationCode] =
          result.status === "fulfilled"
            ? result.value
            : { medianAnnualWage: null, entryLevelWage: null, employmentCount: null };
      }
    }

    // Upsert career snapshot
    await db
      .insert(careerSnapshots)
      .values({
        studentProfileId,
        major,
        pathwayJson: JSON.stringify(pathway),
        wageDataJson: JSON.stringify(wageData),
        lastRefreshedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: careerSnapshots.studentProfileId,
        set: {
          major,
          pathwayJson: JSON.stringify(pathway),
          wageDataJson: JSON.stringify(wageData),
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    const careerCount = pathway ? pathway.careers.length : 0;
    const summary = `Career snapshot updated for major: ${major} — ${careerCount} career options, ${Object.keys(wageData).length} wage datasets cached`;

    await db
      .update(agentRuns)
      .set({
        status: "completed",
        summary,
        durationMs: Date.now() - startedAt.getTime(),
        completedAt: new Date(),
      })
      .where(eq(agentRuns.id, run.id));

    return summary;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    await db
      .update(agentRuns)
      .set({
        status: "failed",
        errorMessage,
        durationMs: Date.now() - startedAt.getTime(),
        completedAt: new Date(),
      })
      .where(eq(agentRuns.id, run.id));

    throw error;
  }
}
```

Note: `onConflictDoUpdate` uses `target: careerSnapshots.studentProfileId` because the column has a `.unique()` constraint. This is the same upsert pattern used by `studentScholarships` — check that Drizzle version (0.45.1) supports this syntax (it does).

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 8: CREATE `src/app/api/agents/career/route.ts`

Mirrors `src/app/api/agents/financial-aid/route.ts` (lines 1–63) exactly.

```typescript
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { runCareerAgent } from "@/lib/agents/career";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { studentProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";

async function getUser() {
  const { data } = await auth.getSession();
  return data?.user ?? null;
}

// POST /api/agents/career — trigger the Career Agent for the current student
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = apiRateLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!userProfile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }
  if (userProfile.role !== "student") {
    return NextResponse.json(
      { error: "Only students can run the career agent" },
      { status: 403 },
    );
  }

  if (!userProfile.onboardingCompleted) {
    return NextResponse.json(
      { error: "Complete onboarding before running the career agent" },
      { status: 400 },
    );
  }

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userProfileId, userProfile.id),
  });
  if (!studentProfile) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  try {
    const summary = await runCareerAgent(studentProfile.id);
    return NextResponse.json({ summary }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 9: CREATE `src/app/api/career/snapshot/route.ts`

Returns the cached snapshot for the authenticated student. Returns `{ snapshot: null }` if missing or stale (>24h) so the page auto-triggers the agent.

```typescript
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { careerSnapshots, studentProfiles, userProfiles } from "@/lib/db/schema";

const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isStale(lastRefreshedAt: Date): boolean {
  return Date.now() - new Date(lastRefreshedAt).getTime() > SNAPSHOT_TTL_MS;
}

// GET /api/career/snapshot — return cached career snapshot; null if missing or stale
export async function GET() {
  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!userProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userProfileId, userProfile.id),
  });
  if (!studentProfile) {
    return NextResponse.json({ snapshot: null });
  }

  const snapshot = await db.query.careerSnapshots.findFirst({
    where: eq(careerSnapshots.studentProfileId, studentProfile.id),
  });

  if (!snapshot || isStale(snapshot.lastRefreshedAt)) {
    return NextResponse.json({ snapshot: null });
  }

  return NextResponse.json({ snapshot });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 10: CREATE `src/app/api/career/employers/route.ts`

Returns `EmployerMatch[]` for the authenticated student. Reads the student's college list tiers and intended major from the DB, then runs `matchEmployers()`.

```typescript
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { matchEmployers } from "@/lib/agents/career/employer-matcher";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { collegeListEntries, employers, studentProfiles, userProfiles } from "@/lib/db/schema";

// GET /api/career/employers — return employer matches for student's college tiers + major
export async function GET() {
  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!userProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userProfileId, userProfile.id),
  });
  if (!studentProfile) {
    return NextResponse.json({ employers: [] });
  }

  // Get student's college list to determine which tiers they have
  const listEntries = await db.query.collegeListEntries.findMany({
    where: eq(collegeListEntries.studentProfileId, studentProfile.id),
  });

  // Deduplicate tiers (a student may have multiple colleges in each tier)
  const studentTiers = [...new Set(listEntries.map((e) => e.tier))];

  // Fall back to all tiers if no college list yet
  const tiersToMatch = studentTiers.length > 0 ? studentTiers : ["reach", "match", "likely"];

  const major = studentProfile.intendedMajor ?? "";

  // Fetch all verified, active employers with their recruiting prefs
  const employersWithPrefs = await db.query.employers.findMany({
    where: eq(employers.isVerified, true),
    with: {
      recruitingPrefs: true,
    },
  });

  const matches = matchEmployers(employersWithPrefs, tiersToMatch, major);

  return NextResponse.json({ employers: matches });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 11: CREATE `src/app/api/employers/route.ts`

Employer self-registration. No auth required (sets `isVerified: false`). Uses Zod for input validation.

```typescript
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { employerRecruitingPrefs, employers } from "@/lib/db/schema";

const EmployerSchema = z.object({
  name: z.string().min(2).max(200),
  industry: z.string().min(2).max(100),
  description: z.string().max(1000).default(""),
  website: z.string().url(),
  // Recruiting preferences
  collegeTiers: z.array(z.enum(["reach", "match", "likely"])).min(1),
  minGpa: z.string().regex(/^\d\.\d$/).default("0.0"),
  majorKeywords: z.array(z.string()).default([]),
  roleType: z.enum(["internship", "full_time", "both"]).default("both"),
  targetGradYear: z.number().int().min(2025).max(2035).nullable().default(null),
});

// POST /api/employers — employer self-registration (no auth; isVerified defaults to false)
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EmployerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const {
    name, industry, description, website,
    collegeTiers, minGpa, majorKeywords, roleType, targetGradYear,
  } = parsed.data;

  const [employer] = await db
    .insert(employers)
    .values({
      name,
      industry,
      description,
      website,
      isVerified: false, // admin must verify before it appears in matches
    })
    .returning();

  await db.insert(employerRecruitingPrefs).values({
    employerId: employer.id,
    collegeTiers: JSON.stringify(collegeTiers),
    minGpa,
    majorKeywords: JSON.stringify(majorKeywords),
    roleType,
    targetGradYear,
    isActive: true,
  });

  return NextResponse.json({ employer }, { status: 201 });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 12: CREATE `src/app/api/employers/seed/route.ts`

Dev-only seed route. Inserts all `SEED_EMPLOYERS` and sets `isVerified: true` so they appear immediately in student matches.

```typescript
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { SEED_EMPLOYERS } from "@/lib/agents/career/seed-employers";
import { db } from "@/lib/db";
import { employerRecruitingPrefs, employers } from "@/lib/db/schema";

// POST /api/employers/seed — dev-only: insert seed employer records
// Guard: only runs in non-production environments
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed endpoint disabled in production" }, { status: 403 });
  }

  const inserted: string[] = [];

  for (const seed of SEED_EMPLOYERS) {
    const [employer] = await db
      .insert(employers)
      .values({
        ...seed.employer,
        isVerified: true, // seed data is pre-verified
      })
      .onConflictDoNothing()
      .returning();

    if (employer) {
      for (const pref of seed.prefs) {
        await db
          .insert(employerRecruitingPrefs)
          .values({ ...pref, employerId: employer.id })
          .onConflictDoNothing();
      }
      inserted.push(employer.name);
    }
  }

  return NextResponse.json({
    message: `Seeded ${inserted.length} employers`,
    employers: inserted,
  });
}
```

Note: `onConflictDoNothing()` requires a unique constraint. Because `employers` has no unique column other than `id`, this will insert duplicates on repeated calls. To prevent duplicates in a real seed scenario, add a unique index on `employers.name` in the schema (optional — seed is dev-only).

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 13: CREATE `src/components/student/career-pathway.tsx`

Displays the career pathway for a student's major: field title, occupation cards with wages, job outlook, education steps. No shadcn/ui components that require extra install — use existing `Badge` and `Skeleton` if available.

```typescript
"use client";

import type { CareerPathway, CareerOption } from "@/lib/career/pathways";
import type { BlsWageData } from "@/lib/integrations/bls";

interface CareerPathwayProps {
  pathway: CareerPathway;
  wageData: Record<string, Partial<BlsWageData>>;
}

function formatSalary(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `$${(amount / 1000).toFixed(0)}k`;
}

function outlookLabel(outlook: CareerOption["jobOutlook"]): string {
  const labels: Record<CareerOption["jobOutlook"], string> = {
    much_faster: "Much faster than average",
    faster: "Faster than average",
    average: "Average growth",
    slower: "Slower than average",
    declining: "Declining",
  };
  return labels[outlook];
}

function outlookColor(outlook: CareerOption["jobOutlook"]): string {
  if (outlook === "much_faster" || outlook === "faster") return "text-green-600";
  if (outlook === "average") return "text-yellow-600";
  return "text-red-500";
}

export function CareerPathwayDisplay({ pathway, wageData }: CareerPathwayProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{pathway.fieldTitle}</h2>
      <p className="text-sm text-muted-foreground mb-6">{pathway.fieldDescription}</p>

      {pathway.firstGenNote && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">First-gen tip: </span>
            {pathway.firstGenNote}
          </p>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-3">Career Options</h3>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {pathway.careers.map((career) => {
          const wages = wageData[career.blsOccupationCode];
          return (
            <div key={career.blsOccupationCode} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm">{career.title}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                  {career.entryRequirement.replace("_", ".")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{career.description}</p>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Median: </span>
                  <span className="font-medium">
                    {wages?.medianAnnualWage != null
                      ? `$${wages.medianAnnualWage.toLocaleString()}`
                      : formatSalary(career.typicalSalaryRange.median)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entry: </span>
                  <span className="font-medium">
                    {wages?.entryLevelWage != null
                      ? `$${wages.entryLevelWage.toLocaleString()}`
                      : formatSalary(career.typicalSalaryRange.low)}
                  </span>
                </div>
                <div className={outlookColor(career.jobOutlook)}>
                  +{career.outlookPercent}% / 10yr
                </div>
              </div>

              {career.jobOutlook !== "average" && (
                <p className={`text-xs mt-1 ${outlookColor(career.jobOutlook)}`}>
                  {outlookLabel(career.jobOutlook)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="text-lg font-semibold mb-3">Education Pathways</h3>
      <div className="space-y-4 mb-8">
        {pathway.educationSteps.map((step) => (
          <div key={step.type} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
              </span>
              <h4 className="font-semibold text-sm">{step.label}</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
            {step.avgStartingSalary && (
              <p className="text-xs">
                <span className="text-muted-foreground">Starting salary: </span>
                <span className="font-medium">${step.avgStartingSalary.toLocaleString()}/yr</span>
              </p>
            )}
            {step.examplePrograms.length > 0 && (
              <div className="mt-2 space-y-1">
                {step.examplePrograms.slice(0, 2).map((prog) => (
                  <a
                    key={prog.url}
                    href={prog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {prog.school} — {prog.programName} ({prog.state})
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {pathway.transferTip && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Transfer tip: </span>
            {pathway.transferTip}
          </p>
        </div>
      )}
    </div>
  );
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 14: CREATE `src/components/student/employer-list.tsx`

Displays matched employers as cards. Shows industry, role type, major match indicator, and college tiers they recruit from.

```typescript
"use client";

import type { EmployerMatch } from "@/types";

interface EmployerListProps {
  matches: EmployerMatch[];
}

function roleTypeLabel(roleType: string): string {
  const labels: Record<string, string> = {
    internship: "Internships",
    full_time: "Full-time",
    both: "Internships & Full-time",
  };
  return labels[roleType] ?? roleType;
}

function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    reach: "Reach schools",
    match: "Match schools",
    likely: "Likely schools",
  };
  return labels[tier] ?? tier;
}

export function EmployerList({ matches }: EmployerListProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No employers matched yet. Build your college list to see which companies recruit from your schools.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {matches.map(({ employer, pref, matchedTiers, matchedMajor }) => (
        <div key={employer.id} className="rounded-xl border p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold">{employer.name}</h4>
            {matchedMajor && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                Major match
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {employer.industry}
          </p>

          {employer.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {employer.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            {matchedTiers.map((tier) => (
              <span
                key={tier}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tierLabel(tier)}
              </span>
            ))}
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {roleTypeLabel(pref.roleType)}
            </span>
          </div>

          {parseFloat(pref.minGpa) > 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              Min GPA: {pref.minGpa}
            </p>
          )}

          {employer.website && (
            <a
              href={employer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              View careers →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 15: CREATE `src/app/student/career/page.tsx`

Mirrors `src/app/student/financial-aid/page.tsx` exactly in structure. Auto-triggers Career Agent if snapshot is missing or stale. Renders `CareerPathwayDisplay` and `EmployerList`.

```typescript
"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CareerPathwayDisplay } from "@/components/student/career-pathway";
import { EmployerList } from "@/components/student/employer-list";
import type { CareerSnapshot, EmployerMatch, UserWithProfile } from "@/types";
import type { CareerPathway } from "@/lib/career/pathways";
import type { BlsWageData } from "@/lib/integrations/bls";

const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;

function isSnapshotStale(snapshot: CareerSnapshot): boolean {
  return Date.now() - new Date(snapshot.lastRefreshedAt).getTime() > SNAPSHOT_TTL_MS;
}

export default function CareerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pathway, setPathway] = useState<CareerPathway | null>(null);
  const [wageData, setWageData] = useState<Record<string, Partial<BlsWageData>>>({});
  const [employers, setEmployers] = useState<EmployerMatch[]>([]);
  const [major, setMajor] = useState<string | null>(null);
  const [agentTriggered, setAgentTriggered] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    const res = await fetch("/api/career/snapshot");
    if (!res.ok) return null;
    const data: { snapshot: CareerSnapshot | null } = await res.json();
    return data.snapshot;
  }, []);

  const fetchLiveCareer = useCallback(async () => {
    const res = await fetch("/api/career");
    if (!res.ok) return;
    const data: {
      pathway: CareerPathway | null;
      wageData: Record<string, Partial<BlsWageData>>;
      major: string;
    } = await res.json();
    if (data.pathway) setPathway(data.pathway);
    setWageData(data.wageData ?? {});
    if (data.major) setMajor(data.major);
  }, []);

  const fetchEmployers = useCallback(async () => {
    const res = await fetch("/api/career/employers");
    if (res.ok) {
      const data: { employers: EmployerMatch[] } = await res.json();
      setEmployers(data.employers);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);

      // Auth check
      const userRes = await fetch("/api/user");
      if (!userRes.ok) {
        if (userRes.status === 401) {
          router.push("/login");
          return;
        }
        setIsLoading(false);
        return;
      }
      const userData: UserWithProfile = await userRes.json();

      if (userData.userProfile?.role === "counselor") {
        router.push("/counselor/dashboard");
        return;
      }

      if (!userData.userProfile?.onboardingCompleted) {
        router.push("/student/onboarding");
        return;
      }

      // Try to load cached snapshot first (fast path)
      const snapshot = await fetchSnapshot();

      if (snapshot && !isSnapshotStale(snapshot)) {
        // Use cached data
        const cachedPathway = JSON.parse(snapshot.pathwayJson) as CareerPathway | null;
        const cachedWageData = JSON.parse(snapshot.wageDataJson) as Record<string, Partial<BlsWageData>>;
        setPathway(cachedPathway);
        setWageData(cachedWageData);
        setMajor(snapshot.major);
      } else {
        // Snapshot is missing or stale — trigger agent silently, fetch live data immediately
        if (!agentTriggered) {
          setAgentTriggered(true);
          fetch("/api/agents/career", { method: "POST" });
        }
        // Fetch live data while agent runs in background
        await fetchLiveCareer();
      }

      await fetchEmployers();
      setIsLoading(false);
    }

    init();
  }, [router, fetchSnapshot, fetchLiveCareer, fetchEmployers, agentTriggered]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading career data...</p>
      </div>
    );
  }

  if (!pathway && !major) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Career Paths</h1>
        <p className="text-muted-foreground mb-8">
          Set your intended major in your profile to see career options and salary data.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Career Paths</h1>
      {major && (
        <p className="text-muted-foreground mb-8">
          Career options and salary data for <span className="font-medium">{major}</span>.
        </p>
      )}

      {pathway ? (
        <section className="mb-10">
          <CareerPathwayDisplay pathway={pathway} wageData={wageData} />
        </section>
      ) : (
        <section className="mb-10">
          <p className="text-muted-foreground text-sm">
            No career pathway found for your major. We support Computer Science, Business, Healthcare, Civil Engineering, and more. Try updating your intended major.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Employers Recruiting From Your Schools</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Companies that actively recruit from schools on your college list.
        </p>
        <EmployerList matches={employers} />
      </section>
    </div>
  );
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 16: UPDATE `src/app/student/dashboard/page.tsx` — Add "Career Paths" nav card

The current dashboard has 3 nav cards in a `sm:grid-cols-3` grid (lines 131–151). Add a 4th card for Career Paths and update the grid to `sm:grid-cols-4`.

**FIND** this block (lines 131–152):
```typescript
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Link href="/student/financial-aid">
          ...
        </Link>
        <Link href="/student/applications">
          ...
        </Link>
        <Link href="/student/fafsa">
          ...
        </Link>
      </div>
```

**REPLACE WITH** (change `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4`; add 4th card):
```typescript
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/student/financial-aid">
          <div className="rounded-xl border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <h3 className="font-semibold">Financial Aid &amp; Scholarships</h3>
            <p className="text-sm text-muted-foreground mt-1">
              See net costs and find scholarships
            </p>
          </div>
        </Link>
        <Link href="/student/applications">
          <div className="rounded-xl border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <h3 className="font-semibold">My Applications</h3>
            <p className="text-sm text-muted-foreground mt-1">Track deadlines and requirements</p>
          </div>
        </Link>
        <Link href="/student/fafsa">
          <div className="rounded-xl border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <h3 className="font-semibold">FAFSA Guide</h3>
            <p className="text-sm text-muted-foreground mt-1">Step-by-step walkthrough</p>
          </div>
        </Link>
        <Link href="/student/career">
          <div className="rounded-xl border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <h3 className="font-semibold">Career Paths</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Salaries, outlook, and employers
            </p>
          </div>
        </Link>
      </div>
```

- **VALIDATE**: `npx tsc --noEmit`

---

### TASK 17: RUN `POST /api/employers/seed` to populate employers table

After the dev server is running locally:
```bash
curl -X POST http://localhost:3000/api/employers/seed
```

Expected response:
```json
{ "message": "Seeded 10 employers", "employers": ["Google", "Microsoft", ...] }
```

- **VALIDATE**: Response contains all 10 employer names. DB shows 10 rows in `employers` table and 10 rows in `employer_recruiting_prefs`.

---

### TASK 18: WRITE unit tests — `src/lib/agents/career/__tests__/employer-matcher.test.ts`

This was already defined in TASK 5. If not yet executed, run now.

- **VALIDATE**: `npx vitest run src/lib/agents/career/__tests__/employer-matcher.test.ts`

---

### TASK 19: FULL VALIDATION SWEEP

Run all checks in order:

```bash
# 1. TypeScript
npx tsc --noEmit

# 2. All unit tests (must pass 49+ existing + new career agent tests)
npx vitest run

# 3. Lint
npm run lint

# 4. Production build (Node 20 required)
source ~/.nvm/nvm.sh && nvm use 20 && npm run build
```

All four must pass with zero errors before the phase is considered complete.

- **VALIDATE**: All four commands exit 0. Test count increases by at least 8 (new employer-matcher tests).

---

## SCHEMA QUICK REFERENCE

### New enum (add after `taskStatusEnum` at line 65):
```typescript
export const roleTypeEnum = pgEnum("role_type", ["internship", "full_time", "both"]);
```

### New tables (add after `fafsaProgress` at line 370):
```typescript
export const careerSnapshots = pgTable("career_snapshots", { ... });  // per-student BLS cache
export const employers = pgTable("employers", { ... });                // company records
export const employerRecruitingPrefs = pgTable("employer_recruiting_prefs", { ... }); // per-company prefs
```

### New relations (add after `fafsaProgressRelations`):
```typescript
export const careerSnapshotsRelations = relations(careerSnapshots, ({ one }) => ({ ... }));
export const employersRelations = relations(employers, ({ many }) => ({ ... }));
export const employerRecruitingPrefsRelations = relations(employerRecruitingPrefs, ({ one }) => ({ ... }));
```

### Updated `studentProfilesRelations` (add after `fafsaProgress` relation at line 399):
```typescript
careerSnapshot: one(careerSnapshots, {
  fields: [studentProfiles.id],
  references: [careerSnapshots.studentProfileId],
}),
```

---

## FILE MAP (all files touched or created)

| File | Action | Description |
|------|--------|-------------|
| `src/lib/db/schema.ts` | UPDATE | Add `roleTypeEnum`, `careerSnapshots`, `employers`, `employerRecruitingPrefs`, relations |
| `src/types/index.ts` | UPDATE | Add `CareerSnapshot`, `Employer`, `EmployerRecruitingPref`, `EmployerMatch`, `CareerPageData` |
| `src/lib/agents/career/index.ts` | CREATE | Career Agent runner (mirrors financial-aid runner) |
| `src/lib/agents/career/employer-matcher.ts` | CREATE | Pure `matchEmployers()` function |
| `src/lib/agents/career/seed-employers.ts` | CREATE | 10 seed employer records |
| `src/lib/agents/career/__tests__/employer-matcher.test.ts` | CREATE | Unit tests for `matchEmployers()` |
| `src/app/api/agents/career/route.ts` | CREATE | `POST /api/agents/career` — trigger agent |
| `src/app/api/career/snapshot/route.ts` | CREATE | `GET /api/career/snapshot` — cached data with staleness check |
| `src/app/api/career/employers/route.ts` | CREATE | `GET /api/career/employers` — EmployerMatch[] |
| `src/app/api/employers/route.ts` | CREATE | `POST /api/employers` — self-registration |
| `src/app/api/employers/seed/route.ts` | CREATE | `POST /api/employers/seed` — dev seed |
| `src/components/student/career-pathway.tsx` | CREATE | Occupation + education step cards |
| `src/components/student/employer-list.tsx` | CREATE | Employer match cards |
| `src/app/student/career/page.tsx` | CREATE | Full career page with auto-trigger |
| `src/app/student/dashboard/page.tsx` | UPDATE | Add 4th nav card, expand grid |

---

## KEY DECISIONS & GOTCHAS

### 1. `agentType: "career"` is valid without schema change
`agentRuns.agentType` is `text("agent_type").notNull()` — no enum constraint. Any string value works. No schema change needed.

### 2. Upsert pattern for `careerSnapshots`
Use Drizzle's `.onConflictDoUpdate({ target: careerSnapshots.studentProfileId, set: { ... } })`. The `.unique()` constraint on `studentProfileId` makes this valid. Do NOT use `.onConflictDoNothing()` — you need the update path.

### 3. `GET /api/career` still exists alongside snapshot routes
The existing `GET /api/career` route (live BLS fetch) remains untouched. The snapshot routes are an additive layer. The career page uses snapshot as a fast path, falling back to live fetch when stale.

### 4. Employer `isVerified` gating
`GET /api/career/employers` filters `where: eq(employers.isVerified, true)`. Seed data inserts with `isVerified: true`. Self-registered employers via `POST /api/employers` start with `isVerified: false` and will not appear in student matches until an admin sets the flag.

### 5. `collegeTiers` on `employerRecruitingPrefs` is JSON text
Stored as `text()` not `jsonb` — consistent with scholarships' `eligibleStates`, `eligibleMajors`, and `demographicTags` pattern. Parse on read with `JSON.parse(pref.collegeTiers) as string[]`.

### 6. `matchEmployers()` returns one result per employer
Even if an employer has multiple active prefs, only the first matching pref generates an `EmployerMatch`. This prevents duplicate cards in the UI.

### 7. Dashboard grid layout
Changing from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4` ensures the 4th card doesn't cause overflow on small screens — two rows of two on mobile/tablet, one row of four on large screens.

### 8. Career page handles `pathway: null` gracefully
If `findPathwayForMajor(major)` returns `null` (major not in `CAREER_PATHWAYS`), the page renders a "no pathway found" message with a suggestion to update the major. Employer matching still runs independently.

### 9. No new npm packages required
All dependencies (`zod`, `drizzle-orm`, `next`, `react`, `lucide-react`) are already in `package.json`. No `npm install` step needed.

### 10. `BlsWageData` vs. the returned type from `fetchOccupationWages`
`fetchOccupationWages` returns `Promise<Pick<BlsWageData, "medianAnnualWage" | "entryLevelWage" | "employmentCount">>` — not the full `BlsWageData` (which also has `occupationCode`, `occupationTitle`, `experiencedWage`). Store and pass the returned partial type; the UI safely handles missing fields with null checks.

---

## VALIDATION COMMANDS SUMMARY

| Task | Command |
|------|---------|
| 1 (schema) | `npx tsc --noEmit` |
| 2 (types) | `npx tsc --noEmit` |
| 3 (migration) | `npx drizzle-kit push` |
| 4 (employer-matcher.ts) | `npx tsc --noEmit` |
| 5 (tests) | `npx vitest run src/lib/agents/career/__tests__/employer-matcher.test.ts` |
| 6 (seed-employers.ts) | `npx tsc --noEmit` |
| 7 (career/index.ts) | `npx tsc --noEmit` |
| 8 (POST /api/agents/career) | `npx tsc --noEmit` |
| 9 (GET /api/career/snapshot) | `npx tsc --noEmit` |
| 10 (GET /api/career/employers) | `npx tsc --noEmit` |
| 11 (POST /api/employers) | `npx tsc --noEmit` |
| 12 (POST /api/employers/seed) | `npx tsc --noEmit` |
| 13 (career-pathway.tsx) | `npx tsc --noEmit` |
| 14 (employer-list.tsx) | `npx tsc --noEmit` |
| 15 (/student/career/page.tsx) | `npx tsc --noEmit` |
| 16 (dashboard update) | `npx tsc --noEmit` |
| 17 (seed employers) | `curl -X POST http://localhost:3000/api/employers/seed` |
| 18 (run tests) | `npx vitest run` |
| 19 (full sweep) | `npx tsc --noEmit && npx vitest run && npm run lint && source ~/.nvm/nvm.sh && nvm use 20 && npm run build` |

---

## CONFIDENCE SCORE

**9/10**

Deductions:
- **-0.5**: `onConflictDoUpdate` syntax for Drizzle 0.45.1 with a `.unique()` constraint — confirmed valid in Drizzle docs but the exact `target` syntax (column ref vs. constraint name) should be verified against the installed version at implementation time. If it fails, the fallback is a delete + insert pattern.
- **-0.5**: The career page imports `BlsWageData` from `@/lib/integrations/bls` as a type. Since `fetchOccupationWages` returns only a `Pick<BlsWageData, ...>` subset, the `wageData` record type in `CareerPageData` is declared as `Record<string, BlsWageData>` in the prompt but should more accurately be `Record<string, Partial<BlsWageData>>` or `Record<string, Pick<BlsWageData, "medianAnnualWage" | "entryLevelWage" | "employmentCount">>`. Implementation should use the more precise type to avoid TypeScript errors when accessing `occupationTitle` or `experiencedWage`.

High confidence because:
- All referenced files were read and patterns are verified against actual source code
- Agent runner pattern mirrors an existing, tested implementation line-by-line
- API route pattern mirrors an existing, tested implementation line-by-line
- `matchEmployers()` is a pure function with no external dependencies — trivially testable
- No new npm packages required — zero dependency risk
- Schema additions are purely additive — no existing tables or columns are modified
- The BLS integration and career pathways library are already proven to work in production via `GET /api/career`
