# Agent Instructions — Verify Before You Build

This doc governs how work gets done on this project, alongside `master-plan.md`. It applies to every technology in the stack, not just Next.js — Payload, Auth.js, the Vercel AI SDK, Meilisearch, Upstash, Stripe, all of it.

---

## 1. The core rule

**Before writing implementation code for any task involving a library, framework, or external service, check that library's official documentation for the version actually in use — don't rely on training data or general familiarity.** Frameworks in this stack ship breaking changes and compatibility windows fast enough that "how it usually works" is not a safe assumption. Verify first, then implement.

This applies even when the task feels routine. "I already know how NextAuth works" is exactly the assumption that causes version-mismatch bugs — the API may have moved since.

---

## 2. When this applies

- Before starting any new phase or task from `master-plan.md` that touches a library not yet verified in this project
- Before adding any new dependency to `package.json`
- Before upgrading an existing dependency
- Whenever two pieces of the stack integrate directly (e.g. Payload + Next.js, Auth.js + Payload's Users collection, Stripe webhooks + a Next.js Route Handler) — pairwise compatibility is a separate thing from either library working alone, and needs its own check
- Whenever something doesn't behave as expected — check for a version-specific known issue before assuming it's a logic bug

---

## 3. Verification steps

1. **Identify the exact version in use.** Check `package.json` — not "the latest," the actual pinned or installed version.
2. **Check the official docs for that version.** Prefer the library's own documentation site or GitHub repo over blog posts, Stack Overflow, or general knowledge. For version-specific behavior, check the changelog/release notes around that version.
3. **Check for compatibility notes between paired technologies**, not just each one in isolation. Many frameworks publish an explicit supported-version matrix (Payload does, for its Next.js compatibility) — find it before assuming two current versions of two libraries work together.
4. **If a conflict, breaking change, or known issue turns up**, resolve it before writing the feature code — pin to a working version combination, apply the documented workaround, or flag it if it blocks the plan entirely.
5. **Log what was found** — see Section 4. Future tasks (yours or a future agent's) shouldn't have to re-derive the same compatibility research.

---

## 4. Compatibility log

Maintain a running log — `compatibility-log.md` in the repo root — as verification happens. One entry per finding, not per task (skip logging when nothing noteworthy turned up). Format:

```
## [Library] [version] + [Library] [version]
Date checked:
Source: [official doc URL]
Finding:
Action taken:
```

Seed entry, from planning research already done for this project:

```
## Payload CMS + Next.js 16
Date checked: 2026-08-19
Source: https://payloadcms.com/docs/getting-started/installation
Finding: Payload's supported Next.js 16 range is 16.2.6+ only — 15.5 through
16.1.x is explicitly unsupported. Turbopack (default in Next 16) previously
broke Payload outright because @payloadcms/next unconditionally injected a
webpack config; fixed as of Payload 3.73.0, but the fix requires both
libraries to be recent enough. Cache Components support is partial — usable,
but the embedded admin panel can show a brief gray flash on hard refresh.
Action taken: Pin next@16.2.6+ and payload@3.73.0+ explicitly in package.json
before scaffolding. Do not let a scaffolding tool install "latest" without
checking these floors first.
```

---

## 5. If verification reveals a real conflict

Don't work around it silently or guess. Options, in order of preference:

1. Pin to a version combination that's documented as compatible, even if it's not the newest available
2. Apply the documented workaround/flag if one exists (e.g. a compatibility flag, a config option)
3. If neither resolves it, stop and surface the conflict rather than building on top of an unresolved incompatibility — this affects sequencing in `master-plan.md` and may need a task reordered or a phase adjusted

---

## 6. What this is not

This isn't a mandate to re-verify things that are already confirmed working in this project, or to treat every import as suspect. Once a version pairing is logged as verified, later tasks using that same pairing don't need to redo the check — they just need to not silently upgrade past it without re-verifying.
