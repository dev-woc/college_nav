# Feature: Phase 5 — Pilot Launch

The following plan should be complete, but validate codebase patterns and task sanity before implementing.

Pay special attention to import paths, zod import style (`"zod"` vs `"zod/v4"`), and the lazy initialization pattern for external services.

## Feature Description

Two deliverables for pilot launch readiness:

1. **Counselor Pilot Onboarding Wizard** — A guided multi-step setup flow for new counselors immediately after signup. Replaces the current abrupt redirect to an empty dashboard. Includes school profile confirmation, school code distribution, and optional email invitations to students with auto-connect links.

2. **Placeholder PostHog Analytics** — Fire-and-forget event tracking throughout the app using posthog-js. No-op if `NEXT_PUBLIC_POSTHOG_KEY` is not set. This instruments all critical funnel events now so that real analytics can be enabled for the pilot by adding one env var.

## User Story

As a new counselor setting up the platform for my school's pilot
I want a guided setup experience that shows me my school code and lets me invite students by email
So that I can get my caseload connected without needing a manual onboarding call.

As the platform operator
I want PostHog event tracking wired into all key user actions
So that I can monitor pilot funnel metrics (onboarding completion, agent usage, FAFSA progress) by adding one env var.

## Problem Statement

- New counselors currently land on an empty dashboard with no guidance — they don't know their school code, how students connect, or what to do next.
- There is no student invitation flow — counselors must manually distribute school codes and students must manually find the signup page.
- Zero analytics instrumentation — the pilot will produce no measurable funnel data.

## Solution Statement

Build a 3-step counselor onboarding wizard at `/counselor/onboarding` that gates first-time counselor dashboard access. Add a student invite endpoint that sends Resend emails with pre-populated signup links including the counselor's school code. Wire PostHog tracking into all key frontend interactions as a no-op wrapper that activates when `NEXT_PUBLIC_POSTHOG_KEY` is set.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium
**Primary Systems Affected**: Counselor onboarding flow, email system, client-side analytics
**Dependencies**: posthog-js (new), Resend (existing), existing auth/db patterns

---

## CONTEXT REFERENCES

### Relevant Codebase Files — READ THESE BEFORE IMPLEMENTING

- `src/app/counselor/dashboard/page.tsx` (lines 46–86) — Why: Contains `/api/user` fetch + role check pattern; add onboarding redirect here
- `src/app/counselor/layout.tsx` — Why: Understand the counselor shell layout the wizard must render inside
- `src/components/student/onboarding-form.tsx` — Why: The multi-step form pattern (step state, step indicators, handleNext/handleSubmit) to mirror
- `src/app/student/onboarding/page.tsx` — Why: Page shell pattern — thin page + Card + component import
- `src/app/api/onboarding/route.ts` — Why: Rate limiter + auth + db upsert + onboardingCompleted update pattern to replicate for counselor
- `src/app/api/counselor/connect/route.ts` — Why: Counselor API pattern; note `import { z } from "zod/v4"` (API routes use `zod/v4`, validations.ts uses `"zod"`)
- `src/lib/email/index.ts` — Why: Resend lazy init pattern + email function signature to follow for `sendStudentInvite`
- `src/lib/db/schema.ts` (lines 72–90, 117–136) — Why: `userProfiles.onboardingCompleted` field (reuse for counselors); `counselorProfiles` fields
- `src/lib/rate-limit.ts` — Why: `apiRateLimiter.check(ip)` usage
- `src/lib/auth/server.ts` — Why: `auth.getSession()` pattern
- `src/app/api/user/route.ts` (lines 57–117) — Why: Shows that `schoolCode = slug` is set on counselor profile creation; the POST handler is the source of truth for initial counselor profile
- `src/lib/validations.ts` — Why: `signupSchema` shows counselor fields collected at signup; add `counselorOnboardingSchema` here
- `src/app/layout.tsx` — Why: Where to add PostHog provider wrapper
- `src/app/(auth)/signup/page.tsx` + `src/components/auth/signup-form.tsx` — Why: Understand the signup flow and where to wire `?code={schoolCode}` param for auto-connect
- `.env.example` — Why: Add new env vars

### New Files to Create

- `src/app/counselor/onboarding/page.tsx` — Wizard page shell
- `src/components/counselor/onboarding-wizard.tsx` — 3-step wizard component
- `src/app/api/counselor/onboarding/route.ts` — POST: mark counselor onboarding complete
- `src/app/api/counselor/invite/route.ts` — POST: send student invite emails
- `src/lib/analytics.ts` — PostHog track() wrapper, no-op if no key
- `src/components/analytics/posthog-provider.tsx` — PostHog init + provider

### Files to Update

- `src/app/counselor/dashboard/page.tsx` — Add redirect if `!onboardingCompleted`
- `src/lib/email/index.ts` — Add `sendStudentInvite` function
- `src/lib/validations.ts` — Add `counselorOnboardingSchema` and `inviteStudentsSchema`
- `src/components/student/onboarding-form.tsx` — Add analytics `track()` calls
- `src/app/counselor/dashboard/page.tsx` — Add analytics `track()` calls
- `src/app/layout.tsx` — Wrap with PostHog provider
- `.env.example` — Add `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `RESEND_API_KEY`

### Patterns to Follow

**API route boilerplate** (every route):
```ts
export const dynamic = "force-dynamic";
import { z } from "zod/v4";  // API routes use "zod/v4" (not "zod")
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { apiRateLimiter } from "@/lib/rate-limit";

const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
const { success } = apiRateLimiter.check(ip);
if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

const { data } = await auth.getSession();
const user = data?.user ?? null;
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**DB update pattern** (from `src/app/api/onboarding/route.ts:131-134`):
```ts
await db
  .update(userProfiles)
  .set({ onboardingCompleted: true, updatedAt: new Date() })
  .where(eq(userProfiles.id, userProfile.id));
```

**Lazy email init** (mirror `src/lib/email/index.ts:1-11`):
- Resend is already lazy-initialized; just add a new exported function to that file.

**Multi-step form pattern** (mirror `src/components/student/onboarding-form.tsx`):
- `type Step = 0 | 1 | 2`
- Step indicator with numbered circles
- `handleNext()` validates current step, advances; `handleSubmit()` on final step
- No external form library — plain React state + controlled inputs

**Client component analytics** (call after key actions):
```ts
import { track } from "@/lib/analytics";
track("counselor_onboarding_completed", { schoolCode });
```

**Zod validation location**:
- Inline schemas in API routes use `import { z } from "zod/v4"`
- Shared schemas in `src/lib/validations.ts` use `import { z } from "zod"` (these are already using the right version — `zod@4.x` works with `"zod"` as the import path)

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — Validation schemas + email function

Add validation schemas and extend the email module before building routes or UI.

**Tasks:**
- Add `counselorOnboardingSchema` and `inviteStudentsSchema` to `src/lib/validations.ts`
- Add `sendStudentInvite` to `src/lib/email/index.ts`
- Update `.env.example` with new env vars

### Phase 2: Backend — Onboarding + Invite API routes

Build the two new API endpoints.

**Tasks:**
- `POST /api/counselor/onboarding` — marks `onboardingCompleted = true`
- `POST /api/counselor/invite` — validates email list, sends invite emails via Resend, returns sent count

### Phase 3: Counselor Onboarding Wizard UI

Build the wizard page and component, then wire the dashboard redirect.

**Tasks:**
- `src/app/counselor/onboarding/page.tsx` — page shell
- `src/components/counselor/onboarding-wizard.tsx` — 3-step wizard
- Update `src/app/counselor/dashboard/page.tsx` — redirect if not onboarded

### Phase 4: Student Auto-Connect via Invite Link

Wire `?code={schoolCode}` through the student signup so invited students are auto-connected to their counselor.

**Tasks:**
- Update `src/components/auth/signup-form.tsx` — read `?code` param from URL, pass to `/api/user` POST
- Update `src/app/api/user/route.ts` — if `code` param in POST body and role=student, after creating student profile call the same connect logic as `/api/counselor/connect`

### Phase 5: Analytics Placeholder

Install posthog-js, create the analytics module, add the provider to layout, and instrument key events.

**Tasks:**
- Install posthog-js
- Create `src/lib/analytics.ts`
- Create `src/components/analytics/posthog-provider.tsx`
- Update `src/app/layout.tsx`
- Add `track()` calls to key components

---

## STEP-BY-STEP TASKS

### UPDATE `src/lib/validations.ts`

- **ADD** `counselorOnboardingSchema`:
  ```ts
  export const counselorOnboardingSchema = z.object({
    schoolName: z.string().min(1).max(100),
    district: z.string().max(100).default(""),
    stateCode: z.string().length(2),
  });
  ```
- **ADD** `inviteStudentsSchema`:
  ```ts
  export const inviteStudentsSchema = z.object({
    emails: z.array(z.string().email()).min(1).max(100),
  });
  ```
- **IMPORTS**: No change needed — `"zod"` is already imported at top
- **VALIDATE**: `npm run lint`

---

### UPDATE `src/lib/email/index.ts`

- **ADD** `sendStudentInvite` function after existing `sendScholarshipReminder`:
  ```ts
  export async function sendStudentInvite({
    to,
    counselorName,
    schoolName,
    signupUrl,
  }: {
    to: string;
    counselorName: string;
    schoolName: string;
    signupUrl: string;
  }) {
    const resend = getResend();
    await resend.emails.send({
      from: "College Navigator <notifications@yourcollege.app>",
      to,
      subject: `${counselorName} invited you to College Navigator`,
      html: `
        <h2>You've been invited to College Navigator</h2>
        <p><strong>${counselorName}</strong> at <strong>${schoolName}</strong> has invited you to use College Navigator — your free personal college counselor.</p>
        <p>Get a personalized college list, real net prices, scholarship matches, and step-by-step FAFSA guidance.</p>
        <p><a href="${signupUrl}" style="background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Create Your Free Account →</a></p>
        <p style="color:#6b7280;font-size:12px">You'll be automatically connected to your counselor when you sign up.</p>
      `,
    });
  }
  ```
- **PATTERN**: Mirror `sendScholarshipReminder` exactly — use existing `getResend()` helper
- **VALIDATE**: `npm run lint`

---

### UPDATE `.env.example`

- **ADD** these lines:
  ```
  RESEND_API_KEY=                  # Resend API key for transactional email
  NEXT_PUBLIC_POSTHOG_KEY=         # PostHog project API key (optional — analytics disabled if not set)
  NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # PostHog host
  ```
- **VALIDATE**: Confirm no duplicate keys

---

### CREATE `src/app/api/counselor/onboarding/route.ts`

- **IMPLEMENT**: POST handler that:
  1. Rate limit + auth check (standard pattern)
  2. Fetch userProfile by userId; verify role === "counselor"
  3. Parse body with `counselorOnboardingSchema` (imported from `@/lib/validations`)
  4. Update `counselorProfiles` with schoolName, district, stateCode (upsert on `userProfileId`)
  5. Update `userProfiles.onboardingCompleted = true`
  6. Return `{ success: true }`
- **PATTERN**: Mirror `src/app/api/onboarding/route.ts` exactly
- **IMPORTS**: `import { z } from "zod/v4"` — NOTE: inline schema is not needed here since we import from validations, but use `"zod/v4"` if you need z directly in this file
- **GOTCHA**: `counselorOnboardingSchema` is in `src/lib/validations.ts` which uses `"zod"` — you can still use it from the API route without re-importing zod
- **VALIDATE**: `npx tsc --noEmit`

Full implementation:
```ts
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { counselorProfiles, userProfiles } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { counselorOnboardingSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = apiRateLimiter.check(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!userProfile || userProfile.role !== "counselor") {
    return NextResponse.json({ error: "Only counselors can complete counselor onboarding" }, { status: 403 });
  }

  const body = await request.json();
  const result = counselorOnboardingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  await db
    .update(counselorProfiles)
    .set({
      schoolName: result.data.schoolName,
      district: result.data.district,
      stateCode: result.data.stateCode,
    })
    .where(eq(counselorProfiles.userProfileId, userProfile.id));

  await db
    .update(userProfiles)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(userProfiles.id, userProfile.id));

  return NextResponse.json({ success: true });
}
```

---

### CREATE `src/app/api/counselor/invite/route.ts`

- **IMPLEMENT**: POST handler that:
  1. Rate limit + auth check
  2. Verify counselor role
  3. Fetch counselorProfile with userProfile join (need schoolCode, schoolName)
  4. Parse body with `inviteStudentsSchema`
  5. Send invite email to each address via `sendStudentInvite`
  6. Return `{ sent: number }`
- **GOTCHA**: `RESEND_API_KEY` may not be set in dev — wrap in try/catch per email, don't fail entire request if one email fails
- **GOTCHA**: `NEXT_PUBLIC_APP_URL` env var is the base URL for the signup link. Use `process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`
- **SIGNUP URL format**: `/signup?code={schoolCode}` (the code is the counselor's slug)

```ts
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { counselorProfiles, userProfiles } from "@/lib/db/schema";
import { sendStudentInvite } from "@/lib/email";
import { apiRateLimiter } from "@/lib/rate-limit";
import { inviteStudentsSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = apiRateLimiter.check(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { data } = await auth.getSession();
  const user = data?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });
  if (!userProfile || userProfile.role !== "counselor") {
    return NextResponse.json({ error: "Only counselors can invite students" }, { status: 403 });
  }

  const counselorProfile = await db.query.counselorProfiles.findFirst({
    where: eq(counselorProfiles.userProfileId, userProfile.id),
  });
  if (!counselorProfile) {
    return NextResponse.json({ error: "Counselor profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const result = inviteStudentsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const signupUrl = `${baseUrl}/signup?code=${counselorProfile.schoolCode}`;
  let sent = 0;

  for (const email of result.data.emails) {
    try {
      await sendStudentInvite({
        to: email,
        counselorName: userProfile.displayName,
        schoolName: counselorProfile.schoolName,
        signupUrl,
      });
      sent++;
    } catch {
      // Log but don't fail the entire request for one bad email
      console.error(`Failed to send invite to ${email}`);
    }
  }

  return NextResponse.json({ sent });
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### CREATE `src/app/counselor/onboarding/page.tsx`

- **IMPLEMENT**: Thin page shell — Card + CounselorOnboardingWizard, mirrors `src/app/student/onboarding/page.tsx` exactly
- **PATTERN**: Mirror `src/app/student/onboarding/page.tsx` — no client-side code in page
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CounselorOnboardingWizard } from "@/components/counselor/onboarding-wizard";

export default function CounselorOnboardingPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set up your school</CardTitle>
            <CardDescription>
              This takes 2 minutes. You'll get a school code your students use to connect to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CounselorOnboardingWizard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```
- **VALIDATE**: `npx tsc --noEmit`

---

### CREATE `src/components/counselor/onboarding-wizard.tsx`

- **IMPLEMENT**: `"use client"` multi-step wizard with 3 steps:

**Step 0: Confirm School Profile**
- Editable fields: School Name (required), District (optional), State (2-letter select)
- Prefetch current counselor data from `GET /api/user` on mount to pre-populate fields
- CTA: "Confirm School Details →"

**Step 1: Your School Code**
- Large display of `schoolCode` (fetched from `/api/user` → `counselorProfile.schoolCode`)
- Copy-to-clipboard button (uses `navigator.clipboard.writeText`)
- Shareable signup link: `{NEXT_PUBLIC_APP_URL}/signup?code={schoolCode}` displayed as copyable text
- Instruction: "Share this code with students. They enter it during signup to connect to your caseload."
- CTA: "Next: Invite Students →" + "Skip →" (both advance)

**Step 2: Invite Students by Email**
- Textarea for email addresses (one per line or comma-separated)
- Parse and validate emails client-side before submit
- POST to `/api/counselor/invite` with `{ emails: string[] }`
- Show success: "Sent X invitations"
- CTA: "Send Invitations" + "Skip for now →" (both complete wizard)
- On complete: POST `/api/counselor/onboarding` with school data from step 0, then `router.push("/counselor/dashboard")`

- **PATTERN**: Mirror `src/components/student/onboarding-form.tsx` step-by-step structure (step state as number, step indicator dots, handleNext, handleSubmit)
- **GOTCHA**: Step 0 form data is used in the final POST to `/api/counselor/onboarding` — hold the step 0 data in state throughout
- **GOTCHA**: Don't use `navigator.clipboard.writeText` without a fallback try/catch — it requires HTTPS or localhost
- **IMPORTS**: Button, Input, Label from `@/components/ui/...`; useRouter from `next/navigation`; track from `@/lib/analytics`
- **VALIDATE**: `npx tsc --noEmit`

---

### UPDATE `src/app/counselor/dashboard/page.tsx`

- **ADD** redirect logic after role check:
  ```ts
  // After: if (userData.userProfile?.role !== "counselor") { ... }
  // Add:
  if (!userData.userProfile?.onboardingCompleted) {
    router.push("/counselor/onboarding");
    return;
  }
  ```
- **WHERE**: Insert after line 64 (`router.push("/student/dashboard")`) in the `fetchCaseload` function
- **GOTCHA**: This is inside an async `fetchCaseload()` — the existing `return` pattern is already used (line 56)
- **VALIDATE**: `npx tsc --noEmit`

---

### UPDATE `src/components/auth/signup-form.tsx`

- **ADD**: Read `?code` search param alongside existing `?role` param
  ```ts
  const codeParam = searchParams.get("code");
  ```
- **ADD**: Pass `inviteCode: codeParam || undefined` to the `/api/user` POST body when role is student
- **PATTERN**: `codeParam` is read the same way as `roleParam` — `useSearchParams()` is already imported
- **VALIDATE**: `npx tsc --noEmit`

---

### UPDATE `src/app/api/user/route.ts`

- **ADD** `inviteCode` field to `signupSchema` usage OR inline: read it from the parsed body after profile creation
- **IMPLEMENT** auto-connect logic for students with an invite code:
  ```ts
  // After student profile is created (role === "student" path):
  const inviteCode = body.inviteCode as string | undefined;
  if (inviteCode) {
    const counselorProfile = await db.query.counselorProfiles.findFirst({
      where: eq(counselorProfiles.schoolCode, inviteCode),
    });
    if (counselorProfile && studentProfile) {
      // Insert into counselorStudents (ignore conflict — student may already be connected)
      await db
        .insert(counselorStudents)
        .values({
          counselorProfileId: counselorProfile.id,
          studentProfileId: studentProfile.id,
        })
        .onConflictDoNothing();
    }
  }
  ```
- **IMPORTS**: Add `counselorStudents` to the import from `@/lib/db/schema`; need `onConflictDoNothing` from drizzle-orm (it's `import { ..., sql } from "drizzle-orm"` — actually for onConflictDoNothing it's a drizzle query builder method, not an import. Check drizzle docs: `.onConflictDoNothing()` is a method on the insert query builder in drizzle-orm.)
- **GOTCHA**: The `signupSchema` in `src/lib/validations.ts` doesn't include `inviteCode`. Parse `inviteCode` separately from the body after the schema parse, since it's not a validated field — just grab it from the raw body. Do NOT add it to `signupSchema` (students who sign up organically won't have it).
- **GOTCHA**: `studentProfile` from the insert `.returning()` must be stored to get its id. Check that the existing POST handler stores the returned student profile — it doesn't currently create a `studentProfiles` row (that happens at onboarding). So skip the auto-connect here. Instead, handle auto-connect at the onboarding step.

  **REVISED APPROACH**: Store the invite code in the user profile as a temporary field, OR pass it through the onboarding POST. The simplest path: add `inviteCode?: string` to `onboardingSchema` in `src/lib/validations.ts`, pass it from the student onboarding form (pre-populated from URL param `?code`), and do the auto-connect in `POST /api/onboarding` after creating the student profile.

  **Updated plan for auto-connect**:
  1. Student clicks invite link: `/signup?code={schoolCode}`
  2. Signup form reads `?code` param, stores in state, passes to `/api/user` POST (ignored there — just profile creation)
  3. After signup, student is redirected to `/student/onboarding` — BUT we need to preserve the code. Use: `/student/onboarding?code={schoolCode}`
  4. Onboarding form reads `?code` from URL, includes it in POST to `/api/onboarding`
  5. `/api/onboarding` after creating student profile: if `inviteCode` is present, look up counselor by schoolCode and insert into `counselorStudents`

- **VALIDATE**: `npx tsc --noEmit`

---

### REVISE: Update `src/components/auth/signup-form.tsx` (auto-connect flow)

- **ADD**: Read `?code` param
- **CHANGE**: Redirect after counselor signup → `/student/onboarding?code=${codeParam}` instead of `/student/onboarding` when code is present:
  ```ts
  router.push(isCounselor ? "/counselor/dashboard" : `/student/onboarding${codeParam ? `?code=${codeParam}` : ""}`);
  ```
- **VALIDATE**: `npx tsc --noEmit`

---

### UPDATE `src/lib/validations.ts` (add inviteCode to onboarding schema)

- **ADD** `inviteCode` to `onboardingSchema`:
  ```ts
  inviteCode: z.string().optional(),
  ```
- **VALIDATE**: `npm run test:run`

---

### UPDATE `src/components/student/onboarding-form.tsx`

- **ADD**: Read `?code` from URL using `useSearchParams` at top of component
- **ADD**: Include `inviteCode: codeParam ?? undefined` in the data object passed to POST `/api/onboarding`
- **IMPORTS**: Add `useSearchParams` from `next/navigation`
- **VALIDATE**: `npx tsc --noEmit`

---

### UPDATE `src/app/api/onboarding/route.ts`

- **ADD** auto-connect logic after creating/updating student profile:
  ```ts
  const inviteCode = data.inviteCode;
  if (inviteCode && studentProfile) {
    const counselorProfile = await db.query.counselorProfiles.findFirst({
      where: eq(counselorProfiles.schoolCode, inviteCode),
    });
    if (counselorProfile) {
      await db
        .insert(counselorStudents)
        .values({
          counselorProfileId: counselorProfile.id,
          studentProfileId: studentProfile.id,
        })
        .onConflictDoNothing();
    }
  }
  ```
- **IMPORTS**: Add `counselorProfiles`, `counselorStudents` to schema imports
- **GOTCHA**: `onConflictDoNothing()` is a drizzle-orm query builder method — no additional import needed. Syntax: `db.insert(table).values({...}).onConflictDoNothing()`
- **VALIDATE**: `npx tsc --noEmit`, `npm run test:run`

---

### INSTALL posthog-js

- **RUN**: `npm install posthog-js --legacy-peer-deps`
- **VALIDATE**: Check `package.json` has `"posthog-js"` in dependencies

---

### CREATE `src/lib/analytics.ts`

```ts
/**
 * Fire-and-forget analytics wrapper.
 * No-op if NEXT_PUBLIC_POSTHOG_KEY is not set.
 * Only works in browser (client components).
 */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  // Lazy import to avoid SSR issues
  import("posthog-js").then(({ default: posthog }) => {
    posthog.capture(event, properties);
  }).catch(() => {
    // Silently ignore — analytics should never break the app
  });
}
```

- **GOTCHA**: This is a fire-and-forget function — never await it. The dynamic import ensures posthog-js doesn't execute on the server.
- **VALIDATE**: `npx tsc --noEmit`

---

### CREATE `src/components/analytics/posthog-provider.tsx`

```tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // We'll capture manually
      capture_pageleave: true,
    });
  }, []);

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

- **GOTCHA**: `posthog-js/react` exports `PostHogProvider` — check that the import path is correct for the installed version of posthog-js
- **VALIDATE**: `npx tsc --noEmit`

---

### UPDATE `src/app/layout.tsx`

- **ADD** PostHog provider wrapper around `{children}`:
  ```tsx
  import { PostHogProvider } from "@/components/analytics/posthog-provider";
  // ...
  <PostHogProvider>{children}</PostHogProvider>
  ```
- **PATTERN**: Read the existing layout first — wrap innermost children, outside of Suspense but inside body
- **VALIDATE**: `npx tsc --noEmit`, `npm run build`

---

### ADD analytics track() calls to key components

Add fire-and-forget `track()` calls at the critical funnel events. These never await and never block rendering.

**`src/components/student/onboarding-form.tsx`:**
- After redirect in `handleSubmit`: `track("student_onboarding_completed", { isFirstGen, incomeBracket, gradeLevel })`
- On step advance in `handleNext` when step is 0: `track("student_onboarding_step_completed", { step: 0 })`

**`src/components/counselor/onboarding-wizard.tsx`:**
- After wizard complete + redirect: `track("counselor_onboarding_completed", { schoolCode })`
- After successful invite POST: `track("student_invites_sent", { count: sent })`

**`src/app/student/dashboard/page.tsx`:**
- Read the existing file first. After agent run trigger: `track("agent_run_triggered", { agentType: "discovery" })`

**`src/app/student/fafsa/page.tsx`:**
- Read the existing file first. On step completion: `track("fafsa_step_completed", { step })`

- **PATTERN**: Always call `track()` after the action succeeds, not before; never in SSR code; always in `"use client"` components
- **VALIDATE**: `npm run lint`, `npx tsc --noEmit`

---

## TESTING STRATEGY

### Unit Tests

No new pure-logic functions — skip unit tests for this feature. Existing test coverage is unaffected.

### Manual Integration Tests (Required)

**Counselor onboarding flow:**
1. Create a new counselor account at `/signup?role=counselor`
2. Confirm redirect to `/counselor/onboarding` (not dashboard)
3. Complete Step 1 (confirm school info) → Step 2 (verify school code displays) → Step 3 (skip invites)
4. Confirm redirect to `/counselor/dashboard` with caseload visible
5. Refresh `/counselor/dashboard` — confirm no redirect back to onboarding

**Student invite + auto-connect:**
1. On Step 2 of counselor onboarding, note the school code
2. Open the shareable signup link: `/signup?code={schoolCode}`
3. Create a student account
4. Complete student onboarding
5. Check counselor dashboard — student should appear in caseload

**Analytics (no-op mode):**
6. Confirm app works with `NEXT_PUBLIC_POSTHOG_KEY` unset — no console errors
7. (Optional) Set a real PostHog key → verify events appear in PostHog dashboard

**Existing counselor re-login:**
8. An existing counselor (already onboarded) logs in
9. Confirm they go directly to `/counselor/dashboard` without redirect loop

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
npm run lint
```

### Level 2: Type Check
```bash
npx tsc --noEmit
```

### Level 3: Unit Tests
```bash
npm run test:run
```
(No new unit tests — verify existing 49 tests still pass)

### Level 4: Build
```bash
nvm use 20 && npm run build
```
(Must complete with zero errors)

### Level 5: Manual Validation
See Manual Integration Tests above — run through the full counselor onboarding and student invite flows.

---

## ACCEPTANCE CRITERIA

- [ ] New counselors are redirected to `/counselor/onboarding` on first login (never see empty dashboard)
- [ ] Counselor wizard collects/confirms school details in Step 1
- [ ] School code is prominently displayed with copy button in Step 2
- [ ] Shareable invite link format is `/signup?code={schoolCode}`
- [ ] Invite emails are sent via Resend with counselor name and school in subject
- [ ] Students who sign up from an invite link are automatically connected to the counselor's caseload after completing onboarding
- [ ] Existing counselors (onboardingCompleted = true) are NOT redirected to the wizard
- [ ] `track()` function is a true no-op (no errors, no network calls) when `NEXT_PUBLIC_POSTHOG_KEY` is not set
- [ ] PostHog provider initializes only when key is present
- [ ] Key funnel events are instrumented: `student_onboarding_completed`, `counselor_onboarding_completed`, `student_invites_sent`, `agent_run_triggered`, `fafsa_step_completed`
- [ ] All validation commands pass: lint, tsc, test:run, build
- [ ] No regressions in existing student or counselor flows

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run test:run` — all 49 tests pass
- [ ] `npm run build` succeeds
- [ ] Counselor onboarding flow manually tested end-to-end
- [ ] Student invite + auto-connect manually tested
- [ ] Analytics no-op behavior verified
- [ ] Acceptance criteria all met

---

## NOTES

**schoolCode = counselor slug**: The counselor's `schoolCode` is set to their slug at account creation (`src/app/api/user/route.ts:113`). This is already unique. No change needed to how school codes work — just expose it clearly in the onboarding wizard.

**onboardingCompleted reuse**: The `userProfiles.onboardingCompleted` field is reused for counselors rather than adding a new column. Students: set to `true` in `POST /api/onboarding`. Counselors: set to `true` in `POST /api/counselor/onboarding`. No migration required.

**Auto-connect timing**: Auto-connect happens at the end of student onboarding (POST /api/onboarding), not at signup — because the `studentProfiles` row doesn't exist until onboarding is complete. The invite code must survive from the signup URL through to the onboarding form via URL params.

**PostHog lazy import**: `track()` uses a dynamic `import("posthog-js")` so posthog-js is never executed server-side, even if the function is imported into a file that runs on both client and server.

**Email "from" domain**: `notifications@yourcollege.app` is hardcoded in the email module — consistent with the existing scholarship reminder. Update this when the production domain is confirmed.

**Confidence Score: 8/10** — The main risk area is the auto-connect chain (URL param surviving signup → onboarding), which has more moving parts than the other tasks. The counselor wizard and analytics placeholder are straightforward.
