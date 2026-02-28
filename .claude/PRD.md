# Product Requirements Document
## College Navigation Platform — Agentic Lifecycle Guidance

**Version:** 1.0
**Date:** February 27, 2026
**Status:** Draft

---

## 1. Executive Summary

The college navigation market is a $110–125 billion opportunity defined by a single structural failure: no product spans the full student lifecycle. Students use Naviance to explore colleges, Common App to apply, Fastweb to search scholarships, DegreeWorks to track degree progress, and Handshake to find jobs — five disconnected tools that share no data, provide no continuity, and offer no proactive guidance. The result is a system that works for students with college-educated parents who can fill in the gaps and fails the 54% of undergraduates who are first-generation.

This platform is an agentic college navigation system that follows a student from high school sophomore through employed graduate. Unlike existing tools — which are passive information repositories requiring students to know what to search for — this platform proactively identifies what a student needs, when they need it, and takes action on their behalf. It is the difference between a library and a personal counselor.

The MVP targets high school students and their counselors, with a focused set of agents covering college discovery, financial aid transparency, and application management. Community colleges, four-year institutions, and employer recruiting represent Phase 2 and 3 expansion. The business model is three-sided: free for students (with premium upsell), B2B SaaS for institutions and counselors, and recruiting fees from employers.

**MVP Goal:** Launch a working agentic platform for high school students that replaces the passive college search with proactive, personalized guidance — demonstrably improving FAFSA completion, college match quality, and application outcomes for first-generation students.

---

## 2. Mission

> Equip every student — regardless of background, income, or whether their parents went to college — with the same quality of guidance that wealthy families pay $16,000 for.

### Core Principles

1. **Proactive over passive.** The platform takes action on behalf of students rather than waiting for them to ask the right question.
2. **First-gen by default.** Every feature is designed for the student who has no one to ask. This produces a better product for everyone.
3. **Full-lifecycle continuity.** A student's context from high school carries forward to college advising and career matching. No data is thrown away at stage transitions.
4. **Plain language always.** Financial aid terminology, admissions jargon, and credential complexity are translated into clear, actionable language.
5. **Equity as a moat.** Serving first-gen and Title I populations is not a CSR initiative — it is the primary go-to-market strategy and the source of the platform's data flywheel advantage.

---

## 3. Target Users

### Primary: High School Student (B2C)
- **Age:** 14–18, grades 9–12
- **Technical comfort:** High on mobile; expects app-like UX, not form-heavy web portals
- **Key pain points:**
  - No access to college counselor (372:1 national ratio; 1 in 5 schools have no counselor)
  - Overwhelmed by college list-building without context on fit, affordability, or outcomes
  - FAFSA confusion — 46% completion rate during 2024–25 rollout
  - Does not understand the difference between sticker price and net price
  - Application deadlines and requirements scattered across 6–7 different portals
- **First-gen subpopulation (54% of market):** No family context for translating process; more likely to rule out colleges on sticker price; 2x more likely to leave after first year

### Secondary: School Counselor (B2B, day-to-day user)
- **Role:** High school guidance counselor, college advisor, TRIO/GEAR UP program coordinator
- **Technical comfort:** Moderate; uses existing SIS tools (Naviance, Scoir, PowerSchool)
- **Key pain points:**
  - 372:1 caseload leaves ~19% of time for college advising
  - No tool to triage which students need human intervention vs. AI-guided support
  - FAFSA completion tracking is manual and reactive
  - Cannot monitor outcomes across their caseload without heavy reporting work
- **Decision-maker for:** District-level B2B license purchases

### Tertiary: College Student / Adult Learner (Phase 2)
- **Age:** 18–25 (traditional), 25–45 (adult learner)
- **Key pain points:**
  - 375:1 advising ratios; only 55% advised on graduation requirements
  - Average 16.5 excess credits costing $5,500–$8,100 per student
  - 30% change majors; 61% would change if they could go back
  - Transfer students lose 43% of credits on average
  - 41.9 million adults with "some college, no degree"

### Quaternary: Employer (Phase 3, revenue contributor)
- **Role:** Talent acquisition teams at companies with campus recruiting programs
- **Key pain points:**
  - Resume/keyword matching doesn't surface career-readiness signals
  - Diversity hiring pipelines are thin and shallow (3–6% Black interns vs. 14% enrollment)
  - Tuition assistance programs have 2% utilization due to lack of employee awareness

---

## 4. MVP Scope

### Core Functionality

| Feature | Status |
|---------|--------|
| ✅ Student onboarding — academic profile, interests, financial situation | In scope |
| ✅ College Discovery Agent — personalized college list with fit, affordability, outcome scoring | In scope |
| ✅ Financial Aid Agent — net price modeling, sticker vs. net price comparison, four-year cost projection | In scope |
| ✅ Scholarship Matching Agent — profile-matched scholarship discovery with deadline tracking | In scope |
| ✅ Application Management Agent — deadline tracker, checklist, FAFSA walkthrough | In scope |
| ✅ Counselor Dashboard — caseload overview, FAFSA completion tracking, student flags | In scope |
| ✅ Student progress timeline — visual journey from discovery through application submission | In scope |
| ✅ Plain-language financial aid explainer — translates award letters into clear grant/loan/work breakdown | In scope |
| ❌ Degree Planning Agent | Phase 2 |
| ❌ Career Pipeline Agent | Phase 2/3 |
| ❌ Transfer credit mapping | Phase 2 |
| ❌ Employer recruiting portal | Phase 3 |
| ❌ Adult learner re-enrollment flow | Phase 2 |

### Technical

| Feature | Status |
|---------|--------|
| ✅ Email/password authentication with student + counselor role separation | In scope |
| ✅ Agent orchestration layer (proactive task queue, event-driven triggers) | In scope |
| ✅ College database with admissions data, net price calculator integration | In scope |
| ✅ Scholarship database with matching engine | In scope |
| ✅ Notification system (email + in-app) for deadline alerts, agent actions | In scope |
| ✅ Mobile-responsive web app | In scope |
| ❌ Native iOS/Android app | Phase 2 |
| ❌ SSO / district LMS integration (Clever, ClassLink) | Phase 2 |
| ❌ Predictive analytics and ML outcome modeling | Phase 2 |

### Integration

| Feature | Status |
|---------|--------|
| ✅ NCES/IPEDS college data integration | In scope |
| ✅ College Scorecard API (net price, outcomes) | In scope |
| ✅ Common App deadline data | In scope |
| ✅ FAFSA aid estimator / Federal Student Aid API | In scope |
| ❌ Common App pre-fill integration | Phase 2 |
| ❌ Naviance/Scoir data import | Phase 2 |
| ❌ Handshake API | Phase 3 |

### Deployment

| Feature | Status |
|---------|--------|
| ✅ Vercel (frontend) + Neon Postgres (database) | In scope |
| ✅ Environment-based configuration | In scope |
| ❌ On-premise/private cloud for district data requirements | Phase 3 |
| ❌ SOC 2 Type II certification | Phase 2 |
| ❌ FERPA-compliant institutional deployment | Phase 2 |

---

## 5. User Stories

### S1 — First-Gen Student: College Discovery
> **As a first-generation high school junior with a 3.4 GPA and a $45,000 family income, I want to see a personalized list of colleges where I am likely to be admitted, can actually afford to attend, and where students with my background succeed — so that I stop ruling out schools I've never heard of and stop wasting time on schools that are beyond my reach.**

**Example:** Maria, whose parents immigrated from Guatemala, has been told by classmates she should apply to "safety schools" but doesn't know what that means. The platform surfaces Arizona State (high acceptance, $14,000 net price after aid for her income bracket, 58% first-gen graduation rate), flags that she qualifies for a likely full-ride at her state's honors college, and explains in plain language why each school appears on her list.

---

### S2 — First-Gen Student: Financial Aid Demystification
> **As a student who just received four different award letters, I want to understand exactly how much each school will actually cost me — not the sticker price — so that I can make a financially informed decision instead of choosing the school with the flashiest brochure.**

**Example:** The platform ingests or parses each award letter, categorizes every line item as "free money (grant/scholarship)," "money you repay (loan)," or "money you earn (work-study)," calculates the true out-of-pocket cost, and projects total four-year debt burden against median earnings for the student's intended major.

---

### S3 — Student: Scholarship Discovery
> **As a high school senior, I want to be automatically matched with scholarships I qualify for as my profile changes — without having to search manually — so that I don't miss deadlines or leave money on the table.**

**Example:** When a student adds a new extracurricular activity or updates their intended major, the Scholarship Agent re-runs matching, surfaces three new opportunities, and sends a notification: "You now qualify for the National Association of Hispanic Journalists scholarship — deadline in 23 days. Your profile is 85% complete for this application."

---

### S4 — Student: Application Deadline Management
> **As a high school senior applying to seven colleges with different deadlines, I want a single unified checklist that tracks every requirement — Common App, supplements, FAFSA, CSS Profile, institutional scholarships — so that I never miss a deadline.**

**Example:** The Application Management Agent detects that one school requires both Common App and an institutional scholarship application with a deadline two weeks earlier than the admission deadline, surfaces the conflict, and creates a task for the student to complete the scholarship form first.

---

### S5 — Student: FAFSA Guidance
> **As a first-gen student whose parents are unfamiliar with financial aid, I want step-by-step guidance through the FAFSA — including what documents to gather, what terms mean, and common mistakes to avoid — so that I actually complete it and maximize my aid eligibility.**

**Example:** The FAFSA walkthrough explains the difference between "student assets" and "parent assets," flags that a 529 plan owned by a grandparent needs to be handled differently than one owned by a parent, and sends reminders at school-specific priority deadlines (not just the federal deadline).

---

### S6 — Counselor: Caseload Management
> **As a high school counselor with 450 students, I want to see at a glance which students are behind on key milestones — FAFSA not started, no college list built, application deadlines approaching — so that I can focus my limited time on students who most need human intervention.**

**Example:** The counselor dashboard shows a red/yellow/green status for each student across five milestones, filterable by grade, FAFSA status, first-gen status, and urgency score. The counselor can click into any student's profile, see the agent's activity log, and send a personalized outreach message.

---

### S7 — Counselor: Outcome Tracking
> **As a counselor, I want to see aggregate outcome data for my cohort — FAFSA completion rates, college match quality, scholarship dollars secured — so that I can demonstrate program impact to my district administration and identify systemic gaps.**

**Example:** End-of-year report shows the counselor's class achieved 73% FAFSA completion (vs. 46% national average), $2.3M in scholarships secured, and 68% college match rate. The report is shareable and formatted for district budget presentations.

---

### S8 — Technical: Agent Proactivity
> **As the platform, I want to monitor student profiles for trigger events — a new test score, an approaching deadline, a profile update — and automatically queue agent actions without waiting for the student to log in, so that students receive timely guidance even if they're not actively using the platform.**

**Example:** When FAFSA opens in December, every student who has not completed it receives a personalized push notification with their estimated EFC/SAI pre-calculated from their profile data, a link to the step-by-step walkthrough, and their priority deadline for the school at the top of their list.

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Layer                    │
│   Student Dashboard │ Counselor Dashboard │ Public Pages │
└──────────────────────────────┬──────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│                    Agent Orchestration Layer              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │  Discovery   │ │  Financial   │ │   Application    │ │
│  │    Agent     │ │  Aid Agent   │ │  Mgmt Agent      │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│  ┌──────────────┐                                        │
│  │ Scholarship  │                                        │
│  │    Agent     │                                        │
│  └──────────────┘                                        │
│  Task Queue (event-driven triggers, scheduled jobs)      │
└──────────────────────────────┬──────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────┐
│                    Data & Integration Layer               │
│   Neon Postgres │ Claude API │ External Data APIs        │
│   IPEDS/Scorecard │ FAFSA API │ Scholarship DB           │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/
│   ├── (auth)/               # Login, signup, onboarding
│   ├── (student)/            # Student dashboard, profile, agents
│   ├── (counselor)/          # Counselor dashboard, caseload
│   └── api/
│       ├── agents/           # Agent trigger endpoints
│       ├── colleges/         # College search + detail
│       ├── scholarships/     # Scholarship matching
│       ├── financial-aid/    # Net price + award letter parsing
│       └── applications/     # Deadline tracking
├── agents/
│   ├── discovery/            # College Discovery Agent logic
│   ├── financial-aid/        # Financial Aid Agent logic
│   ├── scholarships/         # Scholarship Matching Agent logic
│   ├── applications/         # Application Management Agent logic
│   └── orchestrator.ts       # Event-driven task queue
├── components/
│   ├── student/              # Student-facing UI components
│   ├── counselor/            # Counselor dashboard components
│   ├── agents/               # Agent action cards, timelines
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── db/                   # Drizzle schema + connection
│   ├── integrations/         # IPEDS, Scorecard, FAFSA API clients
│   ├── ai/                   # Claude API client + prompt templates
│   └── validations/          # Zod schemas
└── types/                    # Shared TypeScript types
```

### Key Design Patterns

- **Agent-as-service:** Each agent is a standalone module with a `run(studentId, context)` interface, invokable from the task queue, API routes, or direct triggers.
- **Event-driven proactivity:** Profile updates, date triggers (deadlines approaching), and external events (FAFSA opening, test score release) enqueue agent runs.
- **Explain-your-work:** Every agent action surfaces a plain-language explanation of why it acted — critical for first-gen users who need to understand, not just receive recommendations.
- **Optimistic UI:** Agent results are streamed to the client as they are computed; the UI shows partial results with a loading state rather than blocking.
- **Counselor observability:** Every agent action is logged to a counselor-visible activity feed with human-readable summaries.

---

## 7. Agent Specifications

### 7.1 College Discovery Agent

**Purpose:** Replace passive college search with proactive, personalized college list building that accounts for admission probability, true cost, and career outcomes.

**Triggers:**
- Initial profile completion
- GPA or test score update
- Financial information update
- Student adds/removes a college from their list

**Operations:**
1. Query IPEDS/Scorecard for institutions matching student's major interest, geographic preferences, and institution type preferences
2. Score each institution on three dimensions: admission probability (using historical acceptance rates by GPA/test score band), net price (using net price calculator data for the student's income bracket), and outcome quality (earnings data, completion rates for first-gen students)
3. Rank and cluster into Reach / Match / Likely tiers
4. Generate plain-language explanation for each recommendation
5. Flag scholarship opportunities at each institution

**Key features:**
- Explains *why* each school appears on the list (not just a score)
- Dynamically updates as student profile changes
- Surfaces schools the student would not have found via traditional search (e.g., honors programs at state schools with strong merit aid)
- First-gen flag: highlights schools with dedicated first-gen support programs

---

### 7.2 Financial Aid Agent

**Purpose:** Translate the opaque financial aid system into clear cost comparisons and debt projections.

**Triggers:**
- College added to student's list
- Award letter uploaded or entered
- Financial profile updated

**Operations:**
1. Fetch net price data from College Scorecard for the student's income bracket at each school on their list
2. Model four-year total cost (tuition + fees + room + board + books + travel - grants - scholarships)
3. Project post-graduation debt burden and monthly payment against median earnings for the student's intended major
4. Parse award letters (if uploaded) and categorize each line item: grant, scholarship, subsidized loan, unsubsidized loan, PLUS loan, work-study
5. Flag award letters that contain loan amounts without using the word "loan"

**Key features:**
- Side-by-side cost comparison across schools on the student's list
- "True cost" view that strips loans and work-study from "total aid" figures
- ROI calculator: debt burden vs. lifetime earnings premium by major and institution
- Plain-language award letter decoder with tooltips for every term

---

### 7.3 Scholarship Matching Agent

**Purpose:** Continuously match student profile against scholarship opportunities and proactively surface deadlines.

**Triggers:**
- Profile updates (new activities, awards, demographic info, major change)
- Scheduled weekly re-match scan
- Deadline approaching (7-day, 3-day, 1-day notifications)

**Operations:**
1. Match student profile against scholarship database using attribute overlap scoring
2. Surface new matches since last scan
3. Estimate application completion percentage based on required materials the student has already provided
4. Queue deadline reminders for matched scholarships

**Key features:**
- Match score with explanation ("You qualify because you are a first-generation student pursuing STEM in Arizona")
- Auto-populate scholarship applications with existing profile data where possible
- Distinguish between scholarships requiring essays and those that are auto-applied
- Track total scholarship dollars applied for and secured

---

### 7.4 Application Management Agent

**Purpose:** Unify all application requirements across every school and external application (FAFSA, CSS Profile) into a single, prioritized task list.

**Triggers:**
- College added to list
- Deadline milestone reached (90/60/30/14/7/3/1 days)
- Student marks a task complete
- FAFSA opens (October 1 annually)

**Operations:**
1. Fetch deadline and requirements data for each school on the student's list
2. Build a unified task list ordered by urgency (earliest hard deadline first)
3. Detect conflicts (institutional scholarship deadline earlier than admission deadline)
4. Generate FAFSA walkthrough steps personalized to student's financial situation
5. Send notifications for approaching deadlines

**Key features:**
- Single unified checklist across all schools, FAFSA, CSS Profile, and scholarships
- Conflict detection (surfacing hidden earlier deadlines)
- FAFSA step-by-step guide with document checklist (FSA ID, tax returns, bank statements)
- Progress percentage per application
- Counselor-visible completion status

---

## 8. Technology Stack

### Frontend/Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x (App Router) | Full-stack framework, SSR, API routes |
| React | 19.x | UI component layer |
| Tailwind CSS | v4 | Utility-first styling |
| shadcn/ui | latest | Component primitives |
| Recharts | 3.x | Analytics charts (counselor dashboard) |

### Backend/Data
| Technology | Version | Purpose |
|------------|---------|---------|
| Neon Postgres | serverless | Primary database |
| Drizzle ORM | 0.45+ | Type-safe DB queries |
| Zod | 4.x | Input validation |

### AI/Agents
| Technology | Version | Purpose |
|------------|---------|---------|
| Anthropic Claude API | claude-sonnet-4-6 | Agent reasoning, text generation, award letter parsing |
| Vercel AI SDK | latest | Streaming responses, tool use |

### Auth
| Technology | Purpose |
|------------|---------|
| Neon Auth | Email/password + Google OAuth |

### External Data APIs
| API | Purpose |
|-----|---------|
| IPEDS Data API (NCES) | Institutional characteristics, graduation rates |
| College Scorecard API (Dept of Ed) | Net price by income, earnings outcomes, completion rates |
| Federal Student Aid API | FAFSA aid estimator, EFC/SAI calculation |
| Common Data Set sources | Admissions statistics (scraped/aggregated) |

### Tooling
| Technology | Purpose |
|------------|---------|
| Biome | Linting + formatting |
| Vitest | Unit testing |
| dnd-kit | Drag-and-drop (college list reordering) |
| Sonner | Toast notifications |

---

## 9. Security & Configuration

### Authentication & Authorization
- Email/password and Google OAuth via Neon Auth
- Role-based access: `student`, `counselor`, `admin`
- Middleware-enforced route protection: `/dashboard/*` requires auth, `/counselor/*` requires counselor role
- Students can only access their own profile data; counselors can access profiles of students in their caseload

### Configuration (Environment Variables)
```bash
# Database
DATABASE_URL=                    # Neon Postgres connection string
AUTH_SECRET=                     # Session cookie secret

# AI
ANTHROPIC_API_KEY=               # Claude API key

# External Data
COLLEGE_SCORECARD_API_KEY=       # Dept of Education Scorecard API

# App
NEXT_PUBLIC_APP_URL=             # Canonical URL
```

### Security Scope — In Scope (MVP)
- ✅ HTTPS-only (enforced by Vercel)
- ✅ Input validation on all API routes (Zod)
- ✅ Rate limiting on auth and agent endpoints
- ✅ SQL injection prevention (Drizzle parameterized queries)
- ✅ XSS prevention (React escaping, no dangerouslySetInnerHTML)
- ✅ CSRF protection (Next.js built-in)
- ✅ Secure session cookies (httpOnly, sameSite)

### Security Scope — Out of Scope (MVP)
- ❌ FERPA-compliant institutional deployment (required for Phase 2 B2B)
- ❌ SOC 2 Type II (required for Phase 2/3 district contracts)
- ❌ PII encryption at rest (beyond Neon's default)
- ❌ Audit logging for FERPA compliance

### Privacy Considerations
- Students under 18 require parental consent per COPPA
- Student data is never sold or used for advertising targeting
- Counselors can only view profiles of students who have connected their account to that counselor's caseload
- AI processing of student data uses Anthropic's API — data handling terms apply

---

## 10. API Specification

### Authentication
All authenticated endpoints require a valid session cookie. Roles are enforced per endpoint.

---

### `POST /api/agents/discovery/run`
Trigger the College Discovery Agent for the authenticated student.

**Request:**
```json
{
  "forceRefresh": true
}
```

**Response (streamed):**
```json
{
  "status": "running",
  "colleges": [
    {
      "unitId": "196097",
      "name": "Arizona State University",
      "tier": "match",
      "admissionProbability": 0.87,
      "netPrice": 14200,
      "fourYearCost": 62800,
      "firstGenGradRate": 0.58,
      "explanation": "Strong match for your 3.4 GPA. Net price of $14,200/year for your income bracket after Pell Grant. 58% graduation rate for first-gen students — above national average.",
      "scholarships": [
        { "name": "ASU New American University Scholarship", "amount": 4000, "renewable": true }
      ]
    }
  ]
}
```

---

### `GET /api/colleges/search`
Search college database with filters.

**Query params:** `q`, `state`, `type` (public|private|community), `maxNetPrice`, `minGradRate`, `majorId`

**Response:**
```json
{
  "results": [
    {
      "unitId": "196097",
      "name": "Arizona State University",
      "city": "Tempe",
      "state": "AZ",
      "type": "public",
      "acceptanceRate": 0.88,
      "netPrice": { "0-30k": 12400, "30-48k": 16200, "48-75k": 21800, "75-110k": 28500, "110k+": 38000 },
      "medianEarnings10yr": 52400,
      "firstGenGradRate": 0.58
    }
  ],
  "total": 142
}
```

---

### `POST /api/financial-aid/award-letter`
Parse an uploaded award letter and categorize aid components.

**Request:** `multipart/form-data` with `file` (PDF or image)

**Response:**
```json
{
  "institution": "University of Arizona",
  "academicYear": "2026-27",
  "components": [
    { "name": "Pell Grant", "amount": 7395, "category": "grant", "renewable": true },
    { "name": "UA Excellence Scholarship", "amount": 6000, "category": "scholarship", "renewable": true },
    { "name": "Federal Work-Study", "amount": 2500, "category": "work-study" },
    { "name": "Federal Subsidized Loan", "amount": 3500, "category": "loan", "mustRepay": true },
    { "name": "Federal Unsubsidized Loan", "amount": 2000, "category": "loan", "mustRepay": true }
  ],
  "summary": {
    "freeMoneyTotal": 13395,
    "loanTotal": 5500,
    "workStudyTotal": 2500,
    "outOfPocket": 8105
  }
}
```

---

### `GET /api/counselor/caseload`
Returns counselor's student list with milestone status. Requires `counselor` role.

**Response:**
```json
{
  "students": [
    {
      "id": "uuid",
      "displayName": "Maria G.",
      "grade": 12,
      "isFirstGen": true,
      "milestones": {
        "collegeList": "complete",
        "fafsa": "in-progress",
        "applications": "not-started",
        "scholarships": "complete"
      },
      "urgencyScore": 82,
      "flaggedReason": "3 application deadlines in next 14 days, FAFSA incomplete"
    }
  ],
  "cohortStats": {
    "fafsaCompletionRate": 0.61,
    "avgScholarshipsApplied": 4.2,
    "avgCollegesOnList": 6.8
  }
}
```

---

## 11. Success Criteria

### MVP Success Definition
A successful MVP demonstrates that the platform can meaningfully improve college planning outcomes for first-gen students in a controlled pilot of at least one school or TRIO program.

### Functional Requirements
- ✅ Student can complete onboarding and receive a personalized college list within 5 minutes
- ✅ Financial aid comparison shows net price (not sticker) for all colleges on student's list
- ✅ Scholarship agent surfaces at least 5 matched scholarships per student with eligibility explanation
- ✅ Application checklist captures all deadlines for all schools + FAFSA + CSS Profile
- ✅ FAFSA walkthrough completes end-to-end with a test student profile
- ✅ Counselor can view caseload milestone status and identify high-urgency students
- ✅ Agent notifications are delivered via email within 30 minutes of trigger event
- ✅ Award letter upload correctly categorizes grants vs. loans in >90% of test cases
- ✅ Platform loads under 2 seconds on mobile (LCP < 2.5s)
- ✅ All forms pass accessibility audit (WCAG 2.1 AA)

### Quality Indicators
- Zero data leakage between student accounts (security audit required before pilot launch)
- College data accuracy within 5% of published net price calculator values
- Agent explanations rated "clear" or "very clear" by >80% of first-gen test users
- Counselor dashboard loads caseload of 500 students in <3 seconds

### User Experience Goals
- First-gen student with no prior knowledge of college process can complete onboarding unaided
- Counselor can triage their full caseload in under 10 minutes
- No feature requires prior knowledge of financial aid or admissions terminology
- Platform works on a $200 Android phone on a school WiFi connection

---

## 12. Implementation Phases

### Phase 1: Foundation + College Discovery (Weeks 1–6)
**Goal:** Working student onboarding, college database, and Discovery Agent with counselor dashboard skeleton.

**Deliverables:**
- ✅ Database schema: students, profiles, college_list, agent_actions, counselor_caseload
- ✅ Authentication: email/password + Google OAuth, role separation (student/counselor)
- ✅ Student onboarding flow: academic profile, interests, financial situation, first-gen flag
- ✅ IPEDS/Scorecard integration: college search and detailed data
- ✅ College Discovery Agent: scoring engine, tier classification, plain-language explanations
- ✅ Student dashboard: college list view, agent action cards
- ✅ Counselor dashboard skeleton: student list with basic milestone tracking

**Validation:** Discovery Agent returns a college list within 10 seconds of profile completion. Counselor can see their students' college lists.

---

### Phase 2: Financial Aid + Scholarships (Weeks 5–10)
**Goal:** Net price modeling, award letter parsing, scholarship matching engine.

**Deliverables:**
- ✅ Financial Aid Agent: net price by income bracket, four-year cost model, debt/earnings projection
- ✅ Award letter upload + Claude-powered parsing (grant/loan/work-study categorization)
- ✅ Plain-language award letter decoder UI
- ✅ Scholarship database integration (Fastweb-style data or equivalent open dataset)
- ✅ Scholarship Matching Agent: profile-based matching, deadline tracking, notification queue
- ✅ Side-by-side financial comparison view across all colleges on list
- ✅ Email notification system for scholarship deadlines

**Validation:** Award letter parsing correctly categorizes 90%+ of components in a test set of 50 real award letters. Scholarship agent surfaces >5 matches for 80%+ of test student profiles.

---

### Phase 3: Application Management + FAFSA Guidance (Weeks 9–14)
**Goal:** Unified application checklist, FAFSA walkthrough, counselor milestone tracking.

**Deliverables:**
- ✅ Application Management Agent: deadline aggregation across all schools, FAFSA, CSS Profile
- ✅ Conflict detection: surfaces hidden earlier deadlines (institutional scholarships, priority FAFSA)
- ✅ FAFSA step-by-step walkthrough with document checklist
- ✅ Task completion UI with urgency ordering
- ✅ Counselor dashboard: FAFSA completion rate, flagged students, urgency scoring
- ✅ Student-to-counselor connection flow (students add their counselor's school code)
- ✅ Counselor outcome report (end-of-year cohort stats)

**Validation:** Test counselor with 50 mock students can identify top-5 urgency students in <2 minutes. FAFSA walkthrough tested with 10 first-gen students (moderated usability test).

---

### Phase 4: Pilot Launch + Iteration (Weeks 13–20)
**Goal:** Controlled pilot with 1–3 schools or TRIO programs; collect outcome data.

**Deliverables:**
- ✅ Onboarding for pilot partner counselors + school setup flow
- ✅ Data export for counselors (CSV of caseload milestones)
- ✅ Bug fixes and performance optimization from pilot feedback
- ✅ Privacy review and security audit before launch
- ✅ Analytics instrumentation (Posthog or similar) for funnel analysis
- ✅ Feedback collection (in-app NPS, post-session survey)

**Validation:** Pilot schools show measurable improvement in FAFSA completion rate vs. control. Student NPS > 40. Counselor NPS > 50. No P0 security issues identified in audit.

---

## 13. Future Considerations

### Phase 2 Post-MVP
- **Degree Planning Agent:** Credit tracking, major-change impact modeling, transfer credit pre-mapping, excess credit alerts
- **Native mobile app:** Push notifications are more effective than email for the target demographic
- **SSO / LMS integration:** Clever and ClassLink district authentication for frictionless school adoption
- **Adult learner re-enrollment flow:** Dedicated onboarding for the 41.9M "some college, no degree" population; Credit for Prior Learning (CPL) awareness module
- **FERPA compliance + SOC 2:** Required for district contracts and four-year institution sales

### Phase 3 Expansion
- **Career Pipeline Agent:** Internship matching, career profile building, first-gen networking support
- **Employer recruiting portal:** Deep student profiles sold to employers; replaces Handshake for the pre-graduation pipeline
- **Community college advising product:** Degree mapping with 2-to-4 year transfer pathway optimization; 43% credit loss prevention
- **Four-year institution B2B:** Enterprise license for retention and advising augmentation

### Platform Intelligence (Ongoing)
- **Outcome data flywheel:** Track enrolled students' degree completion, transfer success, and earnings to improve recommendation models
- **First-gen cohort benchmarking:** Internal benchmarks vs. national first-gen graduation rates; surface to institutional partners as a retention ROI story
- **Predictive risk modeling:** Identify students at risk of stopping out before they do; surface to counselors for proactive intervention
- **Multi-language support:** Spanish-language interface is a high priority given the 1.5M+ Hispanic/Latino first-gen population

---

## 14. Risks & Mitigations

### Risk 1: Data Quality — College and Financial Aid Data
**Risk:** IPEDS and Scorecard data is often lagging by 1–2 years; net price by income bracket data is self-reported and inconsistent across institutions.
**Mitigation:** Layer in supplemental data sources (Common Data Set, institution websites). Flag data freshness in the UI. Build agent prompts to caveat estimates as "based on 2023–24 data" and recommend students verify with the net price calculator on each institution's website.

### Risk 2: First-Gen User Trust
**Risk:** First-gen students may distrust algorithmic recommendations, particularly around finances, if they don't understand the basis.
**Mitigation:** Every recommendation surfaces a plain-language explanation. Users can expand to see the underlying data (acceptance rates, net price source, earnings data source). Build a "how we calculated this" modal for every financial estimate.

### Risk 3: COPPA Compliance for Under-18 Users
**Risk:** Students under 13 require verifiable parental consent; students 13–17 require parental awareness. School-based deployment (FERPA) provides an exception.
**Mitigation:** For Phase 1 (direct B2C), require date-of-birth at signup and gate under-13 accounts. Implement parental consent flow for 13–17. For Phase 2 (school B2B), structure as a school-operated service under FERPA's school official exception.

### Risk 4: Agent Accuracy and Hallucination
**Risk:** Claude may generate inaccurate financial aid estimates or scholarship eligibility claims, leading to student decisions based on bad information.
**Mitigation:** Ground agent outputs in structured data queries (not free-form generation) wherever possible. Use Claude only for natural language explanation of structured results, not for numerical calculations. Implement a human-review step for award letter parsing edge cases. Add prominent disclaimers that all estimates should be verified with the institution.

### Risk 5: B2B Sales Cycle Length
**Risk:** School district purchasing decisions are annual (July 1 fiscal year), involve multiple stakeholders, and can take 6–18 months. A B2B-dependent revenue model may not generate revenue quickly enough.
**Mitigation:** Launch with a freemium B2C model that does not require district adoption. Build measurable outcome data (FAFSA completion rates, scholarships secured) from B2C pilots that can be used as evidence in B2B sales. Pursue Title I and TRIO programs that have discretionary budgets and faster procurement timelines.

---

## 15. Appendix

### Key Market Data Sources
- National Center for Education Statistics (NCES) / IPEDS
- Department of Education College Scorecard: `collegescorecard.ed.gov/data`
- American School Counselor Association (ASCA) annual ratio data
- National Student Clearinghouse Research Center
- Complete College America

### Competitive Benchmarks
| Company | Revenue | Users | Key Metric |
|---------|---------|-------|------------|
| Naviance (PowerSchool) | ~$500M+ (PowerSchool total) | 10M students, 40% HS market | Dominant HS platform, aging UX |
| EAB Navigate | ~$350M est. | 850+ institutions | 95% renewal, $278K/yr avg contract |
| Handshake | ~$270M ($190M core + $80M AI) | 20M students | Every Fortune 500 |
| Scoir | ~$20M est. | 2,200 schools | 40-50% YoY growth |
| CollegeVine | undisclosed | 100+ institutions (B2B) | Pivoted to AI agents in 2024 |

### Go-to-Market Priority States (Counselor Ratio Crisis)
| State | Student:Counselor Ratio | Priority |
|-------|------------------------|---------|
| Arizona | 570:1 | Highest |
| California | 464:1 | High |
| Michigan | ~420:1 | High |
| Texas | ~400:1 | High |
| Minnesota | ~390:1 | Medium |

### Repository Structure (Current)
```
college_nav/
├── PRD.md                    # This document
├── README.md                 # Technical setup
├── src/                      # Application source
├── drizzle/                  # Database migrations
├── tests/                    # Unit + E2E tests
└── package.json
```

### Related Documents
- Market research: `compass_artifact_wf-ae684989-2d9a-4371-9b2a-2bf660b88c7f_text_markdown.md`
