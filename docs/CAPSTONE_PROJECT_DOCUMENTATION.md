# HubTalent — Capstone Project Documentation

**Status as of:** September 22, 2026
**Methodology:** This document was produced by directly auditing the source code (Next.js pages, API route handlers, middleware, and SQL migrations), not by trusting prior planning documents. Two earlier internal docs in this repository — `docs/04_features.md` and `DEVELOPMENT_PLAN.md` — were found to **contradict each other** (one describes the product as feature-complete, the other claims ~40% completion) and both were found to be **out of date** in places. Every claim below is backed by a specific file in the codebase.

---

## 1. Project Overview

### 1.1 Problem statement

Fresh graduates and people switching careers often struggle to demonstrate what they can actually do, and communities (such as university alumni networks) lack a structured way to see the talent inside their own membership. At the same time, project owners and employers struggle to find the right person for a role or a collaboration. **HubTalent** is a web platform designed to close that gap by combining four things in one product:

1. **Talent visibility** — a structured profile system so every member's skills, activities, and experience are captured in a comparable, searchable format (not just a free-text bio).
2. **Community understanding** — a social feed, talent search, and admin tooling so a community (a "cohort," e.g. a university alumni batch) can see who its members are and what they're capable of.
3. **Project growth** — a collaboration hub where members can create projects, recruit collaborators, and track progress.
4. **Matching people to opportunities** — AI-assisted search and recommendation features that match people to projects, and match people to jobs and a personalized learning path to close skill gaps.

### 1.2 Target users

- **Fresh graduates / career switchers** — build a structured profile, search for job opportunities, get an AI skill-gap analysis and learning plan, and build an ATS-friendly CV.
- **Community members (e.g. alumni)** — post updates, search for collaborators, join or create projects, message each other.
- **Community/cohort admins** — manage membership and community-level settings for their group.
- **Platform super-admins** — manage all cohorts and user roles platform-wide.

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| Forms & validation | react-hook-form + Zod (client and server-side validation) |
| Database | PostgreSQL, hosted on Supabase |
| DB access | **Supabase is used only as a hosted Postgres database, not Supabase Auth.** Every route uses `@supabase/ssr` / `@supabase/supabase-js` with the service-role key to run raw `.from(table)` queries, bypassing Row Level Security. No `supabase.auth.*` call exists anywhere in the codebase. |
| Authentication | Fully custom JWT auth (see §3.1) — not a third-party auth provider |
| AI / LLM | Google Gemini (`generativelanguage.googleapis.com`, raw REST calls) — the only LLM provider used anywhere in the codebase. No OpenAI, no DeepSeek, no other providers. |
| Secondary backend | A **separate FastAPI (Python) microservice** (`main.py` at repo root, and a more complete copy at `Alumni AI/alumni_ai/main.py`) that most AI endpoints proxy to. This service holds the actual matching/LLM-prompting logic; the Next.js API routes are thin proxies to it. |
| Bot protection | Cloudflare Turnstile on login/register |

### 2.1 Architectural note (important for grading/defense)

This is **not a single-service app**. The Next.js app under `app/api/ai/*` and `app/api/collaboration-recommendation` mostly forwards requests to a separate Python/FastAPI service via `FASTAPI_URL`, secured with an internal API key. Only one AI route (`app/api/ai/cv-suggest`) calls an LLM directly from the Next.js server. This split should be described explicitly in any architecture diagram for the capstone report — a single Next.js-only diagram would misrepresent the system.

### 2.2 What "AI matching" actually is

The system does **not** currently use vector embeddings / true semantic search. What it actually does:
1. A **keyword/weighted-token matching** function (`cari_alumni_untuk_proyek`, `compute_weighted_match_score` in the FastAPI service) scores candidates against a query.
2. The shortlist is then fed into a **Gemini prompt** that writes a natural-language recommendation/justification.

This is a reasonable and defensible "LLM-assisted matching" design, but it should not be described as "semantic/embedding search" in the capstone write-up, since that claim would not match the implementation.

---

## 3. Feature Documentation

Status legend: ✅ Fully implemented · ⚠️ Partially implemented · 🔶 Schema/backend exists but not (fully) wired to UI · ❌ Not implemented

### 3.1 Authentication ✅ Fully implemented
- Custom JWT auth: on login, a signed JWT (via `jose`) is issued and stored in an httpOnly `auth_token` cookie. The token carries `sub`, `email`, `role`, `profile_completed`, `must_change_password`, and `auth_version`.
- `middleware.ts` verifies the JWT on every request, redirects unauthenticated users to `/landing`, redirects logged-in users away from `/login`/`/register`, forces users with an incomplete profile into `/complete-profile`, and forces a password change via `/settings` when required.
- Passwords are hashed with bcrypt. Registration and login are protected by **Cloudflare Turnstile** (captcha), verified server-side.
- **Rate limiting** on `/api/login`, `/api/register`, `/api/forgot-password`, `/api/reset-password`, and AI endpoints — implemented as an **in-memory `Map` in middleware**, which means limits reset on server restart and do not work correctly across multiple server instances (a known limitation for production deployment).
- **Session invalidation**: password changes bump an `auth_session_version` counter in the database; the middleware compares this against the token's claim on every request and force-logs-out stale sessions.
- Password reset uses a real, expiring `password_reset_tokens` table.
- Persistent audit/lockout tables exist and are used: `auth_security_events`, `auth_security_state`, `account_security_audit_logs`.

### 3.2 Onboarding / Complete Profile ✅ Fully implemented
- One long single-page form (not a multi-step wizard, despite some planning docs describing steps) covering ~19+ general questions: name, date of birth, gender, domicile city, phone number, education, skills, languages, certifications, and social links.
- Supports **9 different "activity" (profession) types** via multi-select, each with its own conditional sub-form and its own dedicated database table:
  - Professional/Employee (`alumni_pekerja`)
  - Entrepreneur (`alumni_bisnis`)
  - Social/NGO worker (`alumni_sosial`)
  - Content creator (`alumni_kreatif`)
  - Homemaker (`alumni_rumah_tangga`)
  - Student/fresh graduate (`alumni_mahasiswa`)
  - Informal/freelance worker (`alumni_informal`)
  - Farmer/fisher/rancher (`alumni_agri`)
  - Teacher/educator (`alumni_pendidik`)
- All 9 tables are actively read from and written to — none are unused stubs. This directly contradicts `DEVELOPMENT_PLAN.md`'s claim that 6 of the 9 activity tables are missing; that document is out of date.
- Repeatable education history is supported via a separate `alumni_education_histories` table.
- Submission is server-validated with a matching Zod schema and writes to all relevant tables in one request.

### 3.3 Profile view & edit ✅ Fully implemented
- Public/community profile page at `/profile/[userId]` displays contact info, socials, skills, languages, and activity-specific sections with dedicated iconography per activity type.
- A separate, fully functional edit page (`/profile/edit/[userId]`) reuses the onboarding form logic and submits through the same `/api/complete-profile` endpoint, so edits go through the same validation as onboarding.
- Note: there is no bare `/profile` self-view route — a user views their own profile via their own `[userId]`.

### 3.4 Settings ⚠️ Partially implemented
- Account settings (email/password change) are fully implemented, including current-password verification, session invalidation on password change, and security-event logging.
- A lightweight "quick edit" exists on the settings page for 4 profile fields only (domicile, activity string, skills, languages) — it does **not** reach the 9 activity sub-tables, so full profile edits still require the dedicated `/profile/edit/[userId]` page.
- No notification preferences, 2FA, or account-deletion features exist.

### 3.5 Social feed / posts ✅ Fully implemented
- Create and read posts (`posts` table), like toggling (`post_likes`), and comments (`post_comments`), each updating denormalized counters on the post and firing a notification to the post owner.
- Content is HTML-sanitized server-side before storage.
- Feed is cohort-aware (filtered by community).

### 3.6 Direct messaging ✅ Fully implemented
- Real one-to-one chat system: `conversations`, `conversation_participants`, and `messages` tables.
- Find-or-create logic prevents duplicate conversations between the same two users.
- Unread counts and read receipts (`last_read_at`) are tracked.
- The `messages` table is registered with Supabase Realtime (`ALTER PUBLICATION supabase_realtime ADD TABLE public.messages`), indicating the system is built to support live updates, not just polling.

### 3.7 Notifications ✅ Fully implemented
- A `notifications` table backs a real notification bell in the navbar, populated by post likes, comments, and new chat messages.
- Mark-as-read (single and bulk) are implemented, and clicking a notification routes the user to the relevant post, project, or conversation.

### 3.8 Search ✅ Fully implemented (dual-mode)
- Two tabs: a traditional filter-based directory search, and an AI-powered natural-language search that proxies to the FastAPI/Gemini backend described in §2.2.

### 3.9 Projects & Collaboration Hub ⚠️ Partially implemented
- Project creation, applying to join a project, owner review (accept/reject applicants), visibility toggling (public/private), editing a plan/milestones field, and posting progress-update logs are all implemented with real API routes and real database writes.
- **Inconsistency to flag**: the project *listing* page queries Supabase directly from a server component rather than going through `app/api/projects` (which only implements `POST`, not `GET`). This works, but it means not all data access is routed through the API layer — worth noting as a design inconsistency if asked about API design in a defense.
- Several columns/tables the app clearly depends on (`projects.is_public`, `projects.plan`, `projects.milestones`, `project_updates`) are **not present in the tracked migration files** in `database/`, meaning the migration history in the repo is incomplete relative to what's actually deployed. This is a documentation/tracking gap worth fixing before submission.

### 3.10 AI-assisted CV builder ✅ Fully implemented (most production-hardened AI feature)
- Real Google Gemini call rewriting rough job-experience text into STAR/XYZ-style professional bullet points.
- Protected by **three real layers**: per-user auth check, an in-memory per-minute rate limit (5/min), and a **persistent daily quota** (30/day) backed by a real `ai_daily_usage` table and an atomic Postgres RPC (`increment_ai_daily_usage`).
- This daily-quota system (migration `migration_015_ai_daily_usage.sql`, currently untracked/new in git) is **only wired into this one endpoint** — talent search, project recommendation, and learning path do not currently enforce a daily cap, so there is no repo-wide AI cost protection yet.

### 3.11 Jobs portal ⚠️ Partially implemented — data provenance unverified
- Fully real, database-backed listing/search/filter/pagination against a `jobs` table, plus a CV-building flow that auto-populates a default CV from the user's profile if none is saved yet.
- Planning docs claim job listings come from scraping LinkedIn/Kalibrr — **no scraper script exists anywhere in the repository**, and a migration script contains hardcoded local developer file paths, suggesting job data was loaded manually/ad hoc rather than through an automated pipeline. This claim should either be removed from the capstone report or clearly labeled as a future/manual process, not an automated feature.

### 3.12 Learning path ✅ Fully implemented
- Real AI-driven skill-gap analysis: the FastAPI backend scores the user's combined skills against real, currently-active job postings in the `jobs` table (token-weighted matching, not embeddings), then asks Gemini to produce a structured gap analysis, learning path, and checklist grounded in those real postings (falling back to generic advice if no postings match).
- Checklist progress is persisted per user, per target role, in a real `user_checklists` table — not static content.

### 3.13 "Nodes network" relationship visualization ❌ Not implemented
- Described in `docs/04_features.md` as an interactive node-graph visualization page. No such page exists anywhere in `app/(main)`. The closest related artifact, a network **stats** API route (`app/api/stats/network/route.ts`), is currently being **deleted** in the working tree (per `git status`), not built out. This feature should be described as aspirational/future work, not as existing.

### 3.14 Super Admin panel ⚠️ Partially implemented — access control weakness
- Functional UI and API for extending a cohort's license by 30 days, suspending/activating/deleting a cohort, and promoting/demoting users to/from `super_admin`.
- **Security gap worth documenting and fixing**: the route-level check grants access if the caller's role is `super_admin` **or** if the request's host contains `localhost`/`127.0.0.1` — and `middleware.ts` does not specially protect the `/super-admin` page route itself, so the only real gate is this one API-level check. This is a good, concrete example of a security finding for the capstone report's "known issues" section.

### 3.15 Cohort Admin panel ⚠️ Partially implemented
- Cohort admins can edit their community's name/description, invite members by email/username, promote/demote member↔admin, and remove members — all backed by real API routes with an ownership/role check.
- The **analytics sub-page is currently misleading**: it fetches the platform-wide `/api/analytics` endpoint without passing a cohort filter, so it displays global statistics rather than the per-community statistics its placement under `/cohort-admin/analytics` implies. This should either be fixed (pass the cohort ID) or clearly labeled as platform-wide in the UI.

### 3.16 Cohorts / community & "licensing" 🔶 Schema + basic CRUD only, no real billing
- Real tables (`cohorts`, `cohort_members`) and real CRUD, and a `subscription_plan`/`subscription_status`/`expires_at` field set.
- There is **no payment integration of any kind**. "Extending a license" is just an admin action that adds 30 days to a date field; a newly created cohort is hardcoded to `premium` status. Expiry is displayed in the UI but is not actually checked anywhere to block usage once a cohort expires. This should be described as a schema/workflow placeholder for a future billing system, not a working subscription system.

### 3.17 Security posture (summary) ✅ Mostly implemented, with caveats
- Turnstile captcha, JWT + session versioning, password hashing, persistent audit/lockout tables, and global security headers (CSP, HSTS, X-Frame-Options) are all genuinely implemented.
- Rate limiting is in-memory only (not distributed) — flagged in §3.1 and worth mentioning as a "known limitation, not a production-ready control" in the report.
- Supabase Row Level Security is bypassed everywhere via the service-role key; all authorization is enforced in application code, not at the database layer. This is a reasonable pattern for a capstone project but should be named explicitly rather than implied, since a grader may ask about defense-in-depth.

---

## 4. Database Schema (ground truth, from migration files)

Tables confirmed via `CREATE TABLE` statements across `database/migration_*.sql`, in addition to the original base tables (`user`, `alumni_db`, `projects`, `project_applications`) created before the migration history began:

| Table | Purpose |
|---|---|
| `alumni_db` | Core profile fields |
| `alumni_pekerja`, `alumni_bisnis`, `alumni_sosial`, `alumni_kreatif`, `alumni_rumah_tangga`, `alumni_mahasiswa`, `alumni_informal`, `alumni_agri`, `alumni_pendidik` | One per activity type, conditional onboarding data |
| `alumni_education_histories` | Repeatable education history entries |
| `projects`, `project_applications` | Project CRUD and applications |
| `posts`, `post_likes`, `post_comments` | Social feed |
| `conversations`, `conversation_participants`, `messages` | Direct messaging |
| `notifications` | In-app notifications |
| `cohorts`, `cohort_members` | Community/cohort grouping and membership roles |
| `password_reset_tokens` | Password reset flow |
| `auth_security_events`, `auth_security_state`, `account_security_audit_logs` | Security audit/lockout tracking |
| `auth_session_versions` | Forces logout of stale JWTs after password change |
| `ai_daily_usage` | Per-user daily AI request quota (currently only used by the CV-suggest endpoint) |
| `user_checklists` | Learning-path checklist progress |
| `ai_recommendations` | Stored AI recommendation results |
| `jobs` | Job postings shown in the Jobs portal |
| `user_cvs` | Saved CV drafts |
| `user_learning_paths` | Saved learning-path results |

---

## 5. Known Limitations & Suggested Future Work

For the capstone report's "limitations" / "future work" section:

1. **In-memory rate limiting** does not persist across server restarts and would not work correctly in a multi-instance/horizontally-scaled deployment — should move to a shared store (e.g. Redis) before production use.
2. **Super-admin access control** has a localhost bypass and is not enforced at the middleware/route-protection layer, only inside the API handler — should be tightened.
3. **Cohort licensing has no real billing** — subscription fields exist but nothing enforces expiry or processes payment. A real payment integration (e.g. Midtrans/Stripe) plus expiry enforcement is a natural next milestone.
4. **AI usage quota** (daily cap) is only wired into the CV-suggest endpoint; the other AI-proxying endpoints (talent search, project recommendation, learning path) have no repo-wide cost protection yet.
5. **AI matching is keyword-weighted + LLM summarization, not embedding-based semantic search** — a real next step (and a good "future work" item for a capstone) would be adding vector embeddings (e.g. pgvector) for genuine semantic retrieval.
6. **Job listings' data source is unverified** — no scraper exists; job data appears to have been seeded manually. If a scraping pipeline is a stated project goal, that is the most concrete remaining gap to build.
7. **The "nodes network" relationship visualization** described in early planning docs does not exist and should either be built or removed from the project's stated feature list.
8. **Database migration history is incomplete** relative to the deployed schema — several columns/tables the application code depends on (e.g. `projects.is_public`, `projects.plan`, `projects.milestones`, `project_updates`) have no corresponding tracked migration file. Backfilling these migrations would make the schema auditable and reproducible.
9. **Cohort-admin analytics page currently shows platform-wide data**, not cohort-scoped data, despite its placement in the UI — a quick, low-effort fix.

---

## 6. Feature Status Matrix (quick reference)

| Feature area | Status |
|---|---|
| Authentication (login/register/reset, captcha, JWT, session versioning) | ✅ Fully implemented |
| Onboarding profile (9 activity types, conditional forms) | ✅ Fully implemented |
| Profile view & edit | ✅ Fully implemented |
| Account settings | ⚠️ Partial (password/email only; full profile edit lives elsewhere) |
| Social feed (posts, likes, comments) | ✅ Fully implemented |
| Direct messaging | ✅ Fully implemented |
| Notifications | ✅ Fully implemented |
| Talent/project search (filters + AI) | ✅ Fully implemented |
| Projects hub (create, apply, review, visibility, updates) | ⚠️ Partial (works, but inconsistent API/data-access pattern; some DB columns undocumented) |
| AI CV builder | ✅ Fully implemented, most hardened |
| Jobs portal | ⚠️ Partial (real DB-backed, but sourcing pipeline unverified) |
| Learning path (AI skill-gap + checklist) | ✅ Fully implemented |
| Nodes network visualization | ❌ Not implemented |
| Super Admin panel | ⚠️ Partial (functional, weak access gating) |
| Cohort Admin panel | ⚠️ Partial (functional; analytics page not cohort-scoped) |
| Cohort licensing/subscriptions | 🔶 Schema + CRUD only, no real billing |
| Security hardening (headers, captcha, audit logs) | ✅ Mostly implemented (rate limiting not production-grade) |

---

## 7. Recommended framing for the capstone submission

When writing the report/defense narrative, it's accurate and defensible to say:

- The platform has a **working end-to-end user journey**: register → verify → complete a rich, activity-conditional profile → search for talent/projects → apply/collaborate → message → get AI-assisted career guidance and a CV.
- The **AI layer is real** (Google Gemini via a dedicated FastAPI microservice, plus a direct integration for CV writing) but should be described precisely as **keyword-weighted candidate retrieval + LLM-generated natural-language recommendations**, not as vector/embedding semantic search.
- The **admin/governance layer (cohorts, super-admin, cohort-admin)** is functional for day-to-day moderation but intentionally not production-hardened for billing or strict access control yet — a good, honest "future work" section rather than a weakness to hide.
