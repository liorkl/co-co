# MVP Gap Analysis – November 21, 2025

Purpose: document what “good enough for MVP launch” means, evaluate the current FounderFinder build, and surface the gaps the team must close (product, dev, QA) to support the company’s primary goal of **user acquisition**.

---

## 1. MVP Success Criteria (User Acquisition Focus)

| Funnel Stage | Must-Have Outcomes | Notes |
| --- | --- | --- |
| Awareness → Signup | Prospects understand value prop in <10s, can request a magic link with <2 inputs, and receive it fast enough to stay engaged. | Track submission/verification rate, capture source (ads/referrals). |
| Onboarding | CEO/CTO completes role-specific flow in <5 minutes, with progressive disclosure, validation, and contextual guidance. | Broker trust with social proof and privacy statement; capture monetization intent (willingness to pay). |
| Matching | First curated list of 3–5 high-signal matches, each with rationale, readiness signals, and next-step CTA/contact guardrails. | Need “quality bar” definition (score ≥0.6, profile completeness ≥80%). |
| Engagement Loop | Users can refine preferences, bookmark matches, and trigger “intro request”; system notifies counterpart + ops team. | Basic CRM/ops tooling sufficient; full messaging optional post-MVP. |
| Learning & Monetization | Analytics on drop-off, match acceptance, and LTV signals; at least one experiment surface (pricing beta or waitlist deposit). | Instrument Mixpanel/Amplitude (or PostHog) + Stripe/placeholder checkout. |

Non-functional guardrails: ≥95% success rate for happy-path tests, cold-start data seeding for both roles, CI/CD green, hooks enforcing branch/commit hygiene, and telemetry for error budgets.

---

## 2. Current Implementation Snapshot

### User Experience & Product Surface
- **Authentication & role selection**: Magic-link test endpoint exists; production flow relies on `/api/test/signin` and `/app/auth` stack but lacks branded landing and lead capture.
- **Onboarding forms**: CEO/CTO flows are single-page text inputs with no validation, helper copy, or progress indicators (`app/onboarding/ceo/page.tsx`, `app/onboarding/cto/page.tsx`). No autosave, field-level hints, or “save & resume”.
- **Matches view**: `app/matches/page.tsx` renders AI score, rationale, startup & tech background details with friendly empty state. Missing filters, bookmarking, contact CTA, or feedback loop.
- **Content/Trust**: No FAQs, testimonials, TOS/Privacy surfaces in the main flow; limited messaging around data handling.

### Data & AI Platform
- Prisma schema supports users, interviews, summaries, embeddings, matches; embeddings only created when OpenAI key present.
- Matching logic (`lib/match.ts`) provides semantic scoring but lacks diversification or decay for stale data.
- Test helpers seed deterministic data for e2e/matching but no real cold-start dataset beyond manual scripts.

### Tooling & Quality
- Extensive hooks enforce branch/commit discipline and run lint/type/unit/e2e smoke before push.
- Vitest + Playwright suites now cover env validation, AI helpers, rate limits, interview APIs, onboarding journeys; still missing instrumentation tests and monetization paths.
- CI (GitHub Actions) provisions Postgres, runs build + Playwright smoke, ensuring parity with local script.

---

## 3. Gap Assessment

| Area | Gap | Impact | Owner |
| --- | --- | --- | --- |
| Product/UX | Landing page lacks differentiated messaging, visual hierarchy, testimonials, pricing teaser, and mobile polish. | Low top-of-funnel conversion. | Product Manager + Design |
| Product/UX | Onboarding forms are barebones text fields without validation, guidance, or autosave; no preview/confirmation step. | High drop-off, low-quality data. | Product Manager + Dev |
| Product/UX | Matching page lacks CTA (“Request Intro”), filters, or ability to share feedback/refine preferences. | Users can’t progress beyond passive viewing. | Product + Dev |
| Product/UX | No monetization hooks (pricing survey, credits, waitlist deposit) or mention of value exchange. | Zero signal on willingness to pay. | Product + BizOps |
| Product/Data | No analytics events (page views, conversion metrics, match interactions). | Cannot optimize acquisition funnel. | Product + Data |
| Product/Data | No cohort/role balance dashboard to monitor supply/demand or quality of embeddings. | Risk of lopsided marketplace. | Product + Dev |
| Dev Platform | Matching service lacks batching, decay, or fallback when OpenAI unavailable (functions silently skip embeddings). | Potentially stale matches; silent failures. | Dev Manager |
| Dev Platform | API lacks rate-limit telemetry (only console warns) and error budget tracking. | Hard to detect abuse/perf regressions. | Dev Manager |
| Dev Platform | No background jobs for refreshing matches, sending notifications, or cleaning verification tokens. | Manual operations bottleneck. | Dev Manager |
| DevOps | CI lacks synthetic monitoring or load smoke; environment secrets rely on fallbacks that mask misconfig. | Production risk undetected until outage. | Dev Manager |
| Quality | Playwright suite covers onboarding but not negative paths, mobile viewport, or monetization experiments. | Bugs escape around validation, billing. | Quality Manager |
| Quality | No chaos/latency testing for external deps (Resend, OpenAI). | MVP reliability uncertain under real traffic. | Quality Manager |

---

## 4. Prioritized Backlog

### Sprint 1 (1–2 weeks)
1. **Landing revamp + lead capture**: Hero copy, segmented CTAs (CEO vs CTO), testimonial strip, rapid-value bullet list, plus tracking events.
2. **Guided onboarding**: Convert CEO/CTO forms into multi-step flows with validation, helper copy, progress bar, and autosave; add “quality of match guarantee” messaging.
3. **Analytics foundation**: Instrument key events (auth start, link verified, onboarding step, match view, CTA click) via PostHog or Segment; wire to dashboard.
4. **Match actions**: Add `Request intro` CTA with light moderation queue (e.g., create `intro_requests` table + admin Slack/email notification).
5. **Test hardening**: Expand unit coverage for matching fallbacks and onboarding transformers; add Playwright negative cases (validation, link expiry).

### Sprint 2 (2–3 weeks)
1. **Monetization experiment surface**: Pricing card or waitlist deposit (Stripe checkout session or manual intent capture) gated by role.
2. **Preference refinement**: Allow users to adjust priorities (location, stage, commitment) and re-run matches; persist filters per user.
3. **Balance dashboard**: Lightweight admin page summarizing role counts, onboarding completion, match acceptance; highlight cold-start gaps.
4. **Background jobs**: Cron or queue worker to refresh matches nightly, expire stale tokens, and send summary emails.
5. **Quality telemetry**: Add synthetic `npm run monitor:e2e` hitting hosted env, plus Sentry for client/server errors.

### Quarter Horizon
- **Messaging & introductions**: Two-sided inbox or calendar handoff with guardrails.
- **Trust & safety**: Identity verification badge, flag/report workflow, manual review tooling.
- **Recommendation tuning**: Diversified ranking (explore/exploit), embedding refresh after significant profile edits, human feedback loop.
- **Marketplace economics**: Dynamic pricing tiers, referral credits, experiments on paid boosts.
- **Growth operations**: CRM automation (HubSpot/Airtable sync), cohort reporting, automated reminders for dormant users.
- **Reliability posture**: Feature flags, config validation, chaos drills for OpenAI/Resend outages.

---

## 5. Next Actions
1. **Product Manager**: Flesh out UX requirements/wireframes for Sprint 1 items; partner with design on landing + onboarding; define measurement plan.
2. **Dev Manager**: Estimate engineering effort, assign owners, and ensure infra (queues, Stripe, analytics SDK) is production-ready.
3. **Quality Manager**: Draft updated test strategy (unit, integration, e2e, monitoring) aligned with new features; ensure CI budget covers added suites.
4. **Orchestrator**: Schedule review checkpoint, track progress vs user acquisition goal, and iterate backlog as data arrives.

