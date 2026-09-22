# HubTalent — Implementation Plan

**Last verified:** September 22, 2026
**Replaces:** `docs/implementation_plan_last.md` and `docs/implementation_plan_NEW.md` (both removed). Those two documents had grown into 1,700+ combined lines covering many overlapping efforts, with "Pending"/"✅ SUDAH DIIMPLEMENTASI" labels that had drifted out of sync with the real code. Every item below was re-verified directly against current source files rather than carried over from those labels.

### How this document relates to the others in `docs/`
- [`CAPSTONE_PROJECT_DOCUMENTATION.md`](./CAPSTONE_PROJECT_DOCUMENTATION.md) — the full feature-by-feature audit (what exists, how it works, file references). Read this for "what is HubTalent today."
- [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) — project status narrative and the previously-tracked gap list (access control, rate limiting, migration backfill, cohort billing, AI quota scope, semantic search upgrade).
- **This document** — the actionable engineering checklist: concrete, file-level tasks to execute next. It absorbs the still-open work from the two removed plans and adds several new findings from this verification pass (CSRF, inconsistent prompt-injection handling, hardcoded widgets, missing media upload, missing env-var documentation). Items already tracked in `DEVELOPMENT_PLAN.md` are cross-referenced rather than repeated here.

---

## 1. Completed Work (verified done, no action needed)

Condensed from the two removed plans — see `CAPSTONE_PROJECT_DOCUMENTATION.md` for full detail on each:

- **Brand & landing overhaul**: real logo image in the landing navbar, `FooterCTA` background changed to neutral dark (no more purple gradient), `FeaturePillars` cleaned of emoji/indigo-violet gradients with its 3 CTAs correctly pointing at `/preview/projects` and `/preview/jobs`, `HowItWorks` heading emoji removed, single `public/logo.png` (no casing conflict).
- **Public preview pages**: `/preview/projects` and `/preview/jobs` both exist as real implementations (not stubs) — they fetch and render actual `projects`/`jobs` data, `/preview` is in `middleware.ts`'s public path list, and `components/preview/PreviewNavbar.tsx` exists and is used by both.
- **Rebranding**: "Indonesia Talent Hub" → "HubTalent" is complete across app UI (login, register, landing, page title) and now across all documentation files too.
- **Transactional email**: forgot-password actually sends a real email via the Brevo API (`lib/email.ts`, `sendPasswordResetEmail()`), with a console-log fallback in non-production environments — this is a real integration, not a stub.
- **Security baseline**: rate limiting, CSP/security headers, input sanitization, and a real (if partial — see §2) prompt-injection guard in the FastAPI learning-path endpoint are all in place.
- **Everything tracked in `DEVELOPMENT_PLAN.md`'s "Verified current state"** — auth, onboarding, profile, feed, messaging, notifications, search, projects, jobs, learning path, CV builder, admin panels — remains accurate as of this verification pass.
- **Gemini-only AI stack**: DeepSeek has been fully removed as a fallback provider (from `app/api/ai/cv-suggest/route.ts` and the FastAPI `call_llm_service` dispatcher in `Alumni AI/alumni_ai/main.py`) — Google Gemini is now the sole LLM provider everywhere, matching the actual product decision.
- **`/api/stats/network` restored**: this route had a pending deletion in the working tree that would have broken the home feed's "Talenta Terpopuler" sidebar widget (which still calls it). It was restored before this batch of changes was pushed, so that widget continues to work as before.

---

## 2. Remaining Work — Actionable Checklist

### 2.1 High priority — active regressions & security gaps

- [ ] **Add real CSRF protection.** A repo-wide search found zero CSRF handling anywhere — no token, no double-submit cookie, no custom header check. All state-changing POST/PUT routes (including account settings and super-admin actions) rely only on `sameSite=lax` cookies, which is a partial mitigation, not real CSRF protection. Add a per-session anti-CSRF token, at minimum for admin and account-mutating endpoints.
- [ ] **Make prompt-injection sanitization consistent across AI endpoints.** Only the FastAPI learning-path endpoint sanitizes input (`sanitize_ai_input()` in `Alumni AI/alumni_ai/main.py`). `app/api/ai/cv-suggest/route.ts` interpolates raw user text directly into the Gemini prompt with no sanitization, and the Next.js `talent-search`/`project-recommendation` proxies pass the raw prompt through untouched. Apply the same sanitization function (or equivalent) uniformly before any user text reaches an LLM prompt.
- [ ] **Super Admin access-gating weakness** — already tracked in `DEVELOPMENT_PLAN.md` §2.1 (localhost bypass, not enforced at `middleware.ts`). Carried over here as still open; fix alongside the CSRF work since both touch privileged-action security.

### 2.2 Medium priority — features that are visibly real but not actually wired up

- [ ] **"Asisten Karir AI" card on the home feed is fully hardcoded** (`HomeFeedClient.tsx` ~line 1096-1132): a fixed "Skor Kesiapan CV: 82/100" and static boilerplate text, with no `fetch`/API call backing it. This sits right next to the genuinely AI-powered collaboration-recommendation widget, so it currently misrepresents itself as live AI output. Either wire it to a real endpoint or relabel it clearly as a preview/coming-soon element.
- [ ] **"Lowongan Kerja Terpilih" sidebar card is a single hardcoded job entry**, not a real query against the `jobs` table. Wire it to actual data (even a simple top-match query) or remove it.
- [ ] **Two small leftovers from the UI cleanup effort**: an emoji (`🚀 Proyek Aktif`) still in `HomeFeedClient.tsx` (~line 705), and `indigo-*` classes still in `components/layout/Navbar.tsx` (notification dropdown/badge, ~lines 380-406) — the rest of that cleanup is done; these two spots were missed.
- [ ] **No real media upload.** No `supabase.storage` usage, no upload API route, no `<input type="file">` anywhere in the app. Post "media" is just a pasted external URL field. If profile photos or real image uploads are a stated goal, this needs building from scratch (Supabase Storage bucket + upload route + UI).
- [ ] **Document required environment variables.** There's no `.env.example` and no env-var list in `README.md` (which is still unmodified Next.js boilerplate). Add a documented list of required variables (`GEMINI_API_KEY`, `BREVO_API_KEY`, `FROM_EMAIL`, `FASTAPI_URL`, `INTERNAL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Turnstile keys, etc.) so the app can be set up from a clean checkout without spelunking through the code.
- [ ] Remaining items already tracked in `DEVELOPMENT_PLAN.md` §2.2 (not repeated in full here): cohort-admin analytics page not actually cohort-scoped, project listing bypassing the API layer, cohort licensing with no billing enforcement, AI daily usage quota only enforced on `cv-suggest`.
- [ ] **Onboarding form is missing 3 specific fields from the original blueprint brief** and the entire ">5 years auto-skip" conditional-logic requirement — see [`../BLUEPRINT.md`](../BLUEPRINT.md) Part 2 for the exact field names and evidence (not repeated here).

### 2.3 Low priority — cleanup / nice-to-have

- [ ] Two stray logo files at the repo root (`Logo.png`, `logo_only_clean.png`, tracked in git) are unused by the app (which serves `/logo.png` from `public/`) but are clutter worth removing.
- [ ] `DEVELOPMENT_PLAN.md` §2.4 (AI matching upgrade to embedding-based semantic search) remains the main architectural "future work" item — no change from the prior assessment.

---

## 3. Suggested Execution Order

1. Security pass together: CSRF protection, uniform prompt-injection sanitization, and the Super Admin gating fix — these are related (all privileged-action / input-trust boundaries) and worth doing as one hardening sprint.
2. Replace the two hardcoded home-feed widgets with real data, or relabel them — quick wins for honesty/consistency of the UI.
3. Documentation and cleanup items (env vars, stray logo files) — low effort, do whenever convenient.
4. Media upload and the broader `DEVELOPMENT_PLAN.md` gaps (billing enforcement, embeddings) are larger scoped efforts — treat as separate future milestones, not part of this cleanup pass.
