#!/usr/bin/env node
// Drives the handoff skill (.claude/skills/handoff/SKILL.md) from Claude Code hooks.
//
//   SessionStart      → loads the latest handoff into the new session.
//   UserPromptSubmit  → once the conversation passes the threshold, tells Claude to run the
//   Stop                handoff skill (and keeps the turn going on Stop until it has).
//
// "Conversation size" is the latest assistant reply's input tokens (fresh + cache read +
// cache write): what the model had to read on its last turn. After a handoff it fires again
// only once the conversation has grown by REFIRE_AFTER more tokens, so a long session keeps
// its handoff current without nagging on every message.

import fs from "node:fs";
import path from "node:path";

const THRESHOLD = Number(process.env.HANDOFF_TOKEN_THRESHOLD) || 450_000;
const REFIRE_AFTER = Number(process.env.HANDOFF_REFIRE_AFTER) || 150_000;
const MAX_INJECT_CHARS = 16_000;
const TAIL_BYTES = 4 * 1024 * 1024;

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const handoffFile = path.join(projectDir, ".claude", "handoff", "HANDOFF.md");

const out = (obj) => process.stdout.write(JSON.stringify(obj));

/** Current conversation size from the newest main-thread assistant entry in the transcript. */
function contextTokens(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  const size = fs.statSync(transcriptPath).size;
  const scan = (start) => {
    const fd = fs.openSync(transcriptPath, "r");
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    const lines = buf.toString("utf8").split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('"usage"')) continue;
      let entry;
      try {
        entry = JSON.parse(lines[i]);
      } catch {
        continue; // first line of a tail read is usually cut in half
      }
      const u = entry?.message?.usage;
      if (entry.type !== "assistant" || entry.isSidechain || !u) continue;
      return (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    }
    return null;
  };
  return scan(Math.max(0, size - TAIL_BYTES)) ?? (size > TAIL_BYTES ? scan(0) : null);
}

/** Session id and token count recorded in the current handoff's header, if any. */
function lastHandoff() {
  if (!fs.existsSync(handoffFile)) return null;
  const head = fs.readFileSync(handoffFile, "utf8").slice(0, 600);
  return {
    session: head.match(/^Session:\s*(\S+)/m)?.[1],
    tokens: Number(head.match(/^Context tokens at handoff:\s*([\d,_ ]+)/m)?.[1].replace(/[^\d]/g, "")) || 0,
  };
}

function needsHandoff(sessionId, tokens) {
  if (tokens == null || tokens < THRESHOLD) return false;
  const last = lastHandoff();
  if (!last || last.session !== sessionId) return true;
  return tokens >= last.tokens + REFIRE_AFTER;
}

const instruction = (sessionId, tokens) =>
  `The conversation is at ${tokens.toLocaleString("en-US")} tokens, past the ${THRESHOLD.toLocaleString("en-US")}-token handoff threshold. ` +
  `Run the handoff skill now (.claude/skills/handoff/SKILL.md): write .claude/handoff/HANDOFF.md, commit and push it, and give the user the next-session prompt. ` +
  `Use Session: ${sessionId} and Context tokens at handoff: ${tokens} in the header. Then carry on with what the user asked.`;

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0); // never break the session over a hook problem
}
const event = input.hook_event_name;

try {
  if (event === "SessionStart") {
    if (!fs.existsSync(handoffFile)) process.exit(0);
    let text = fs.readFileSync(handoffFile, "utf8");
    if (text.length > MAX_INJECT_CHARS) text = text.slice(0, MAX_INJECT_CHARS) + "\n\n[Handoff truncated; read the full file at .claude/handoff/HANDOFF.md]";
    const fromThisSession = lastHandoff()?.session === input.session_id;
    out({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          (fromThisSession
            ? "This session's own handoff, kept for reference after compaction or resume:\n\n"
            : "Handoff from the previous session (.claude/handoff/HANDOFF.md). Read it before starting; it says where the work stands and what to do next. Verify anything time-sensitive with git before relying on it.\n\n") + text,
      },
    });
  } else if (event === "UserPromptSubmit" || event === "Stop") {
    const tokens = contextTokens(input.transcript_path);
    if (!needsHandoff(input.session_id, tokens)) process.exit(0);
    if (event === "UserPromptSubmit") {
      out({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: instruction(input.session_id, tokens) } });
    } else if (!input.stop_hook_active) {
      // Keep the turn going so the handoff gets written before Claude goes idle.
      out({ decision: "block", reason: instruction(input.session_id, tokens) });
    }
  }
} catch {
  // A broken hook must never block the user's work.
}
process.exit(0);
