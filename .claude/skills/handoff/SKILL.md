---
name: handoff
description: Write a handoff so the next Claude session can continue this work without the old conversation. Run it when a hook reports the conversation has passed the token threshold (450,000 by default), when the user asks for a handoff, or before ending a long session. Writes .claude/handoff/HANDOFF.md, commits and pushes it, and gives the user a copy-paste prompt for the next session.
---

# Handoff

The next session starts with none of this conversation. Everything it needs to carry on must be in `.claude/handoff/HANDOFF.md`. A SessionStart hook loads that file into every new session automatically, so write it for a reader who is smart but has seen nothing.

## Steps

1. **Collect facts, don't recall them.** Run these and use their output, not memory:
   - `git status --short`, `git branch --show-current`, `git log --oneline -15`
   - The session id and current context size. If a hook message gave them, use those. Otherwise: the session id is the file name (without `.jsonl`) of the newest file in `~/.claude/projects/<project>/`, and the context size is the latest assistant entry's `input_tokens + cache_read_input_tokens + cache_creation_input_tokens` in that file.
2. **Commit unfinished work first** if it builds, so the handoff points at pushed code. If it doesn't build, say so in the handoff and leave it uncommitted only if committing would break the branch.
3. **Write `.claude/handoff/HANDOFF.md`** using the template below. Replace the whole file; the previous handoff is in git history.
4. **Commit and push it** on the current branch, with a message like `Update session handoff`.
5. **Tell the user**, in a few lines: that the handoff is written and pushed, that new sessions load it automatically, and the copy-paste prompt from the last section of the file in case they start a session somewhere the hook doesn't run.

## Rules

- **No secrets.** Never write passwords, tokens, API keys or the contents of `.env*` files. Say where a secret lives instead ("the site password is in `.env.local` and the host's environment settings").
- **Facts over narrative.** Commit hashes, file paths, URLs and exact open questions. Skip the story of how you got there unless a decision would otherwise be re-argued.
- **Mark what's verified.** If something wasn't tested, say so.
- **Keep it under about 150 lines.** Link to artifacts and files instead of copying them.
- **Keep the first three lines exactly in this format.** The hooks read them to know when this session last handed off.

## Template

```markdown
# Session handoff
Session: <session id>
Context tokens at handoff: <number, digits only>
Written: <YYYY-MM-DD>, branch <branch>, last commit <short hash>

## The user
<Who they are, what they're trying to achieve, how they like to work: tone, level, preferences they've stated.>

## Where things stand
<One short paragraph: what exists now and what state it's in.>

## Done this session
- <commit hash> <what it did and why it matters>

## In progress, or waiting on the user
- <Exactly what's half-done, and any question the user hasn't answered yet, word for word if it matters.>

## Next steps
1. <In order. The first one should be doable straight away.>

## Decisions already made (don't re-argue)
- <Decision, and the one-line reason.>

## Links
- <Artifacts, preview pages, PRs, docs, with one line each on what they are.>

## Environment gotchas
- <Things that cost time this session: blocked network hosts, missing tools, commands that behave oddly.>

## Prompt for the next session
<A short paragraph the user can paste to start a new session: what to read first, and what to do first.>
```
