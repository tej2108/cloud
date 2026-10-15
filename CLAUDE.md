@AGENTS.md

# How we work on this repo

The owner is a UX designer learning to be a UX engineer. Be honest and plain, never patronising.

**Every change to the app goes through the `plan-then-build` skill** (`.claude/skills/plan-then-build/SKILL.md`): plan and visual preview first, the owner approves, Sonnet subagents build and verify, then ship. Nothing under `src/` is edited before approval. The only exceptions are questions, lessons, analysis and trivial one-line fixes, and the skill says how to handle those.

Other rules already in force:
- Develop and push only on the branch the session was given. Do not open pull requests unless asked.
- The site login lives in `.env.local` and the host's settings. Never print it, commit it or put it in artifacts or handoffs.
- Long sessions: the `handoff` skill and its hooks write `.claude/handoff/HANDOFF.md`.
