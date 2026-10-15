---
name: plan-then-build
description: The standard way to make any change to this app. Plan first and show the owner a visual preview plus the list of changes for approval, then build with Sonnet subagents, verify with a separate Sonnet subagent, and ship. Use this whenever the user asks to build, add, change, redesign, fix or refactor anything in the app (a page, a component, a feature, styling, data, the PDF reader, security headers), even if they only say "let's do X" or "make it do Y" and never mention a plan or agents. Skip it only for questions, explanations, lessons and analysis, and for trivial one-line fixes (see "When not to use it").
---

# Plan, approve, build, verify, ship

The owner is a UX designer learning to be a UX engineer. They decide what the product looks like and does. You decide how it is built. This workflow puts the owner's decision first, while it is still cheap to change, and keeps the strongest model's judgment on the part that needs it.

- **You (the main session) plan, preview, review and ship.** Judgment lives here.
- **Sonnet subagents build and verify.** Execution is narrow and well specified, so a cheaper, faster model does it well, in parallel when the work splits cleanly.

Nothing under `src/` is edited until the owner approves. If scope grows during the build, go back to the approval step. Approval covers what the plan says and nothing more.

## When not to use it

Answer directly, without this workflow, for: questions, explanations, lessons, analysis of a report, and fixes of a line or two that change no behaviour a user would notice (a typo, a wrong constant). Say in one line that you are skipping the plan and why.

If the owner says they want to write the code themselves ("let me try", lesson mode), do the plan and preview step, then guide them instead of spawning builders.

## 1. Plan

No code yet. Read before deciding:

1. `AGENTS.md`, then the relevant guide in `node_modules/next/dist/docs/` for any Next.js API the change touches. This version of Next.js differs from what you remember.
2. The files the change will touch, and `src/app/globals.css` for the design tokens.
3. Related lessons or decisions already made: `.claude/handoff/HANDOFF.md` ("Decisions already made") and recent `git log`.

Write the plan to `.claude/plans/<yyyy-mm-dd>-<slug>.md` using `PLAN-TEMPLATE.md` in this folder. The parts that matter most:

- **What the visitor will see**, in plain words, before any file names.
- **Slices.** Split the build into slices whose file sets do not overlap, so builders can run in parallel without editing the same file. If two slices must touch one file, merge them or run them in order.
- **Decisions for the owner**, each with your recommendation and the honest cost of the alternatives. Do not bury a product decision inside an implementation detail.
- **How it will be verified**, stated as checks that can fail.

## 2. Preview

The owner approves by looking, so give them something to look at. Publish a private Artifact page (load the `artifact-design` skill first, and `artifact-diagramming` if a diagram helps) containing:

- **UI changes:** a static mockup at desktop and phone width, using the app's real tokens from `globals.css`, IBM Plex Sans, and real data from `src/lib/brfs.ts`. Show before and after when something existing changes. Label it clearly as a picture of the intended result, not the running code.
- **Non-UI changes:** a before/after table of behaviour, or a diagram of what moves where.
- In both cases: the list of files that will change, the decisions needing a call, and what will not change.

Republish to the same file path when the owner asks for changes, so the link stays the same. Keep the preview honest: do not mock up behaviour the plan does not include.

## 3. Approval gate

Give the owner the link and ask with `AskUserQuestion`: approve as shown, approve with changes (they type them), or not now. Put the open decisions in the same question so one reply settles everything. Do not start building on silence or on a vague "looks good" when a decision is still open.

After approval, set `Status: approved` in the plan file. After "approve with changes", update the plan and preview, then confirm only if the change is big enough to alter what they saw.

## 4. Build with Sonnet subagents

Spawn one `builder` per slice, all in the same message when the slices are independent. Use the `builder` agent type if it is listed; otherwise use `general-purpose` with `model: "sonnet"` and start the prompt with "Read `.claude/agents/builder.md` and follow it exactly."

Each builder's prompt must contain: the plan file path, its slice name, its exact file allowlist, and any decision the owner made that affects the slice. Builders do not commit and do not push.

When they return, review the work yourself before anything else:

- `git diff` against the plan. Reject or fix scope creep, files outside a slice, new dependencies the plan did not list.
- Read the code for correctness. A builder's "done" is a claim, not evidence.

## 5. Verify with a separate subagent

Spawn a `verifier` (same fallback as above, using `.claude/agents/verifier.md`). It is a different agent from the builders because the builder is the worst judge of its own work. It builds the app, runs lint and typecheck, serves the production build with throwaway credentials, drives it at desktop and phone width, and reports pass or fail per check with evidence.

Then run the `code-review` skill on the diff. Fix real findings; for the rest, say why you left them.

If verification fails, fix the cause (yourself for small things, a fresh builder for larger ones) and verify again. Do not report success on a partial pass.

## 6. Ship

1. Commit with a message that says what changed and why, and include the plan file. Push to the branch the session was given. Do not open a pull request unless the owner asks.
2. Tell the owner, in plain language: what changed, how it matches the preview and where it differs, what was verified and what was not, and two or three things worth learning from the diff (concepts they will meet again). Keep it honest and short. They are a beginner and not fragile.
3. Set `Status: shipped` in the plan file. If the session is long, update the handoff with the `handoff` skill.

## Secrets and safety

- Never print, commit or hand to a subagent the contents of `.env.local` or any site credential. Verifiers use throwaway values passed as environment variables.
- Tell every subagent the same: no secrets in output, no `pkill -f`, kill servers by PID.
