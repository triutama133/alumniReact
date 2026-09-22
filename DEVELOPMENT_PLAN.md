# HubTalent - Development Plan

**Last updated:** September 22, 2026 (supersedes the June 13, 2026 assessment below)
**Status Project:** Core platform implemented — remaining work is hardening, not building from scratch.

> **Why this document changed:** The original June 2026 version of this plan estimated the project at ~40% complete, with landing page, home feed, edit profile, conditional profile forms, and 6 of 9 activity tables all marked as missing. A source-code audit on September 22, 2026 (cross-checking every page, API route, and database migration) found that **all of those items are actually implemented**. This document has been rewritten to reflect verified reality instead of the earlier estimate. The original phase-by-phase roadmap is kept below (§5) for historical reference, with each item marked against what's actually done.

---

## 📋 Executive Summary

HubTalent is a platform connecting university alumni/community members for talent discovery and project collaboration, combining a LinkedIn-style profile/feed system with AI-assisted matching (talent search, project recommendation, career learning paths, CV writing).

**Verified current state (Sept 22, 2026):**
- ✅ Authentication (custom JWT, bcrypt, Turnstile captcha, session versioning, rate limiting)
- ✅ Landing page
- ✅ Full onboarding profile form — 9 activity types, each with its own conditional sub-form and database table
- ✅ Profile view and edit (both fully functional, not stubs)
- ✅ Home feed with posting, likes, and comments
- ✅ Direct messaging (1-to-1 chat, Realtime-enabled)
- ✅ Notifications (bell UI + backing table, triggered by likes/comments/messages)
- ✅ Talent & project search (traditional filters + AI-assisted)
- ✅ Projects hub (create, apply, review applicants, visibility toggle, plan/milestones, progress updates)
- ✅ Jobs portal (DB-backed listing/search/filter)
- ✅ Learning path (real AI skill-gap analysis grounded in live job postings, persisted checklist)
- ✅ ATS CV builder with AI rewriting (Google Gemini), the most production-hardened AI feature in the repo
- ✅ Super Admin panel (cohort & user management)
- ✅ Cohort Admin panel (member management)
- ❌ Nodes network relationship visualization — not built
- ❌ Saved AI matches / bookmarking — not built
- ⚠️ Several features work but have real gaps (see §2)

For the full per-feature audit with file references, see [`docs/CAPSTONE_PROJECT_DOCUMENTATION.md`](./docs/CAPSTONE_PROJECT_DOCUMENTATION.md).

---

## 🎯 2. What Actually Remains (Verified Gaps)

Unlike the original plan, these are not "build from scratch" items — they are fixes, hardening, or well-scoped additions on top of a working system.

### 2.1 Security & reliability hardening (Priority: HIGH)
- [ ] **Super Admin access control**: currently gated only at the API-handler level, with a condition that allows access when the request host contains `localhost`/`127.0.0.1` — not gated at `middleware.ts`. Tighten this before any real deployment.
- [ ] **Rate limiting** is in-memory (`Map` in `middleware.ts`) — resets on restart and doesn't work across multiple server instances. Move to a shared store (e.g. Redis) for production.
- [ ] **Database migration history is incomplete**: `projects.is_public`, `projects.plan`, `projects.milestones`, and the `project_updates` table are used throughout the app but have no corresponding file in `database/migration_*.sql`. Backfill these so the schema is reproducible from migrations alone.

### 2.2 Feature completion (Priority: MEDIUM)
- [ ] **Cohort-admin analytics page** currently calls `/api/analytics` without a `cohortId` filter, so it shows platform-wide stats instead of the community-scoped stats implied by its placement — pass the cohort ID through.
- [ ] **Project listing bypasses the API layer**: `app/api/projects` only implements `POST`; the `/projects` listing page queries Supabase directly from a server component instead. Either add a `GET` handler for consistency or document this as an intentional pattern.
- [ ] **Cohort licensing has no billing enforcement**: `subscription_plan`/`subscription_status`/`expires_at` exist on `cohorts`, but nothing blocks usage once a cohort's license expires, and there's no payment integration. "Extending a license" just adds 30 days to a date field manually.
- [ ] **AI daily usage quota** (`ai_daily_usage` table, atomic RPC) is only wired into `cv-suggest`. Extend it to `talent-search`, `project-recommendation`, and `learning-path` for repo-wide AI cost protection.

### 2.3 Features described in planning docs but not built (Priority: decide scope before capstone submission)
- [ ] **Nodes network visualization** (`docs/04_features.md` §9): no page exists; the closest artifact (a network-stats API route) is currently being deleted, not built. Decide whether to build a minimal version or drop it from the stated feature set.
- [ ] **Saved AI matches / bookmarking** (`docs/04_features.md` §10): no `saved_matches` table or bookmark UI exists. Either build it or remove the claim from feature docs.
- [ ] **Job data sourcing**: docs claim jobs are scraped from LinkedIn/Kalibrr; no scraper exists in the repo, and job data appears to have been seeded manually (a migration script contains hardcoded local developer paths). If automated scraping is a stated project goal, this is the most concrete remaining build item.

### 2.4 Upgrade path (Priority: LOW — good "future work" material for a capstone defense)
- [ ] **AI matching is keyword-weighted + LLM narration, not embedding-based semantic search.** A genuine next step is adding vector embeddings (e.g. `pgvector`) for real semantic retrieval, positioned as a stated improvement rather than something to claim is already done.

---

## 🗄️ 3. Database Schema (verified ground truth)

Tables confirmed via migration files in `database/`, in addition to base tables created before the migration history began (`user`, `alumni_db`, `projects`, `project_applications`):

| Table | Purpose |
|---|---|
| `alumni_db` | Core profile fields |
| `alumni_pekerja`, `alumni_bisnis`, `alumni_sosial`, `alumni_kreatif`, `alumni_rumah_tangga`, `alumni_mahasiswa`, `alumni_informal`, `alumni_agri`, `alumni_pendidik` | One per activity type — **all 9 exist and are actively used**, contradicting the June 2026 plan's claim that 6 were missing |
| `alumni_education_histories` | Repeatable education history entries |
| `projects`, `project_applications` | Project CRUD and applications |
| `posts`, `post_likes`, `post_comments` | Social feed |
| `conversations`, `conversation_participants`, `messages` | Direct messaging |
| `notifications` | In-app notifications |
| `cohorts`, `cohort_members` | Community/cohort grouping and membership roles |
| `password_reset_tokens` | Password reset flow |
| `auth_security_events`, `auth_security_state`, `account_security_audit_logs` | Security audit/lockout tracking |
| `auth_session_versions` | Forces logout of stale JWTs after password change |
| `ai_daily_usage` | Per-user daily AI request quota (currently only enforced on `cv-suggest`) |
| `user_checklists` | Learning-path checklist progress |
| `ai_recommendations` | Stored AI recommendation results |
| `jobs` | Job postings shown in the Jobs portal |
| `user_cvs` | Saved CV drafts |
| `user_learning_paths` | Saved learning-path results |

---

## 🏗️ 4. Architecture Notes

- **Auth**: fully custom JWT (via `jose`), httpOnly cookie, bcrypt password hashing — **not** Supabase Auth.
- **Database access**: Supabase is used purely as a hosted Postgres client (service-role key, raw `.from(table)` queries), bypassing Row Level Security. All authorization is enforced in application code.
- **AI**: most AI endpoints (`talent-search`, `project-recommendation`, most of `collaboration-recommendation`, `learning-path`) proxy to a **separate FastAPI (Python) microservice** (`main.py` at repo root, and a more complete copy at `Alumni AI/alumni_ai/main.py`), which calls **Google Gemini** directly via REST. `cv-suggest` also calls Gemini directly from the Next.js server. **Google Gemini is the only LLM provider used anywhere in the codebase** — no OpenAI, no DeepSeek, no other providers.

---

## 📜 5. Original Roadmap (June 2026) — Reconciled Against Reality

The phases below are kept for historical/process documentation. Each is now marked against what was actually verified as built by September 2026.

| Phase | Original Status (June 2026) | Verified Status (Sept 2026) |
|---|---|---|
| Phase 1: Database & Backend Foundation | Not started | ✅ Done — all 9 activity tables + supporting tables exist and are used |
| Phase 2: Complete Profile Form Rebuild | Not started | ✅ Done — single long-page form (not the planned multi-step wizard), all conditional sections work |
| Phase 3: Landing Page & Navigation | Not started | ✅ Done |
| Phase 4: Profile View & Edit | Not started | ✅ Done — both fully functional |
| Phase 5: Home Feed & Social Features | Not started | ✅ Done — posts, likes, comments, plus messaging and notifications (not originally scoped in this phase, but built) |
| Phase 6: Search Enhancement | Not started | ✅ Done — dual-mode (filters + AI) |
| Phase 7: AI Features Integration | Partial | ✅ Mostly done — collaboration recommendation, project matching, talent search, learning path, and CV suggestion all call real AI; see §2.4 for the one architectural upgrade still open (embeddings) |
| Phase 8: Polish & Production Ready | Not started | ⚠️ Partial — see §2.1 for the concrete remaining hardening items (rate limiting, access control, migration backfill) |

---

## 🔗 References

- Verified feature-by-feature audit: [`docs/CAPSTONE_PROJECT_DOCUMENTATION.md`](./docs/CAPSTONE_PROJECT_DOCUMENTATION.md)
- Feature specification (corrected in place against source code): [`docs/04_features.md`](./docs/04_features.md)
- Current Codebase: `/Users/triutama/Documents/Project/TalentHubIndonesia/talent-hub-v2`
- Supabase Documentation: https://supabase.com/docs
- Next.js 15 Documentation: https://nextjs.org/docs
