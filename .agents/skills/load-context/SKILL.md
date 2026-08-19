---
name: poc-context-loader
description: Loads full project context for the AI Analytics and Content Intelligence Platform POC at the start of a session. Use this at the very beginning of any session touching this project — before writing or editing any code, before answering questions about project status, and before planning next steps. Trigger on things like "let's continue the POC", "resume work on the platform", "load the project context", "catch me up", "what's the status", "what should I work on next", the start of a fresh agent session on this repo, or any message that references the master plan, the FR scope, Payload CMS, or this project generally without first having loaded context this session. Do not skip this just because the task seems small — a session that starts without loading context risks re-deriving decisions already made or violating the FR scope / verification protocol already agreed on.
---

# POC Context Loader

This project runs on three standing documents plus a live progress tracker. A new session has none of that in context by default — this skill's job is to load it before anything else happens.

## Step 1 — Locate the docs

Look for these files, in this order of likely location: repo root, then `docs/`, then `.claude/`. If none of these exist yet in the expected form, say so explicitly rather than proceeding on assumptions — don't silently invent scope or architecture that isn't in these files.

1. **`master-plan.md`** — the phase-by-phase build plan, scoped to FR-tagged features only. This defines what's in scope and what's explicitly deferred (Monitoring, Security Requirements, Testing, CI/CD — see its Section 15).
2. **`agent-verification-protocol.md`** — the standing rule: check official docs for the actual version in use before implementing anything involving a library, framework, or external service, especially at integration points between two pieces of the stack.
3. **`compatibility-log.md`** — the running log of version-compatibility findings from the protocol above. Read this before re-researching something that may already be logged (e.g. the Next.js 16 / Payload CMS version floor).
4. **`progress.md`** — live tracker of what's actually been built so far. See Step 2 if it doesn't exist yet.

Read all that exist, in full, before doing anything else in the session.

## Step 2 — If `progress.md` doesn't exist, create it

Use `assets/progress-template.md` as the starting structure — it mirrors the phases in `master-plan.md` (Phase 0 through Phase 10) with each phase's tasks/subtasks as checklist items. Populate it by inspecting the actual repo state (installed dependencies, existing files, collections defined, routes present) rather than assuming nothing has been done — a fresh session doesn't mean a fresh repo.

## Step 3 — Summarize before proceeding

Before starting any new work, give a short status summary:
- Which phase and task the project is currently on
- What was last completed
- What's next per `master-plan.md`
- Any open items in `compatibility-log.md` that haven't been resolved (these can block or reorder upcoming tasks)
- Any deviation noticed between `progress.md` and the actual repo state — flag and reconcile rather than trusting the file blindly

## Step 4 — Carry the standing rules forward

For the rest of the session:
- Stay within FR-tagged scope per `master-plan.md` Section 2 unless the user explicitly asks to expand it
- Apply `agent-verification-protocol.md` before implementing anything involving a library/framework/service not already logged as verified in `compatibility-log.md`
- Update `progress.md` as tasks complete — check off items, add brief notes on decisions made mid-task that aren't already captured in the master plan (e.g. a specific field name chosen, a workaround applied). Keep entries short; this file is a status tracker, not a diary.

## Notes

- If `master-plan.md` or `agent-verification-protocol.md` themselves don't exist in the repo, don't fabricate substitutes — ask the user where they are or whether this is actually a fresh setup that needs them created first.
- If `progress.md` conflicts with what's actually in the codebase (e.g. it says Phase 3 is done but no AI generation code exists), trust the codebase and correct the file, noting the discrepancy to the user.