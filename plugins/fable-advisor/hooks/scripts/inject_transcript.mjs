#!/usr/bin/env node
// inject_transcript.mjs
//
// SubagentStart hook for the fable-advisor agent. The built-in advisor tool
// auto-forwards the whole conversation to the reviewer model, but a plugin
// subagent normally sees only the caller's prompt, which the main agent tends
// to shrink to a few bullet points. That leaves the advisor reviewing missing
// or wrong context.
//
// This reads the SubagentStart payload from stdin, pulls transcript_path,
// renders the recent turns, and returns them via
// hookSpecificOutput.additionalContext so the reviewer starts with the real
// conversation. It uses only Node built-ins (no third-party dependency) and
// runs the same on macOS, Linux, and Windows via the "node" plus script-path
// hook pattern. Any failure exits 0 without output, so a missing transcript or
// unreadable line is a clean no-op rather than an error.

import { readFileSync } from "node:fs";

const emit = (ctx) =>
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "SubagentStart", additionalContext: ctx } })
  );

let transcriptPath;
try {
  transcriptPath = JSON.parse(readFileSync(0, "utf8")).transcript_path;
} catch {
  process.exit(0);
}
if (!transcriptPath) process.exit(0);

let lines;
try {
  lines = readFileSync(transcriptPath, "utf8").split("\n");
} catch {
  process.exit(0);
}

const pointer =
  `The full conversation transcript for this session is at:\n${transcriptPath}\n` +
  `Read it (JSONL, newest turns at the end) to reconstruct the context before reviewing.`;

const clip = (s, n) => (s.length > n ? s.slice(0, n) + " …[truncated]" : s);

const renderBlock = (role, b) => {
  switch (b.type) {
    case "text":
      return `${role}: ${clip(b.text ?? "", 4000)}`;
    case "thinking":
      return `assistant (thinking): ${clip(b.thinking ?? "", 1200)}`;
    case "tool_use":
      return `assistant → ${b.name ?? "?"}(${clip(JSON.stringify(b.input ?? {}), 280)})`;
    case "tool_result": {
      const c = b.content;
      const text =
        typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text ?? "").join(" ") : JSON.stringify(c ?? "");
      return `  ↳ result: ${clip(text, 700)}`;
    }
    default:
      return "";
  }
};

const records = [];
for (const line of lines) {
  if (!line) continue;
  let r;
  try {
    r = JSON.parse(line); // skips a half-written trailing line or any bad record
  } catch {
    continue;
  }
  if (r.isSidechain === true || r.isMeta === true) continue;
  if (r.type !== "user" && r.type !== "assistant") continue;
  const content = r.message?.content;
  let rendered;
  if (typeof content === "string") {
    rendered = `${r.type}: ${clip(content, 4000)}`;
  } else if (Array.isArray(content)) {
    rendered = content
      .map((b) => renderBlock(r.type, b))
      .filter(Boolean)
      .join("\n");
  } else continue;
  if (rendered) records.push(rendered);
}

if (records.length === 0) {
  emit(pointer);
  process.exit(0);
}

// Keep the most recent characters so a very chatty session cannot flood the
// reviewer's context. The newest turns are at the end, so keep the tail.
let recent = records.slice(-80).join("\n\n---\n\n");
const MAX = 160000;
if (recent.length > MAX) recent = "…[older turns truncated for length]\n" + recent.slice(-MAX);

emit(
  `You are reviewing an in-progress Claude Code session. Below is the recent conversation, most recent last, the same history the built-in advisor tool would see. Weigh the specific question in the caller's prompt against this actual context, not just the caller's summary of it.

<recent-conversation>
${recent}
</recent-conversation>

The complete raw transcript, including earlier turns not shown above, is at:
${transcriptPath}
Read it only if one specific earlier detail is load-bearing for your verdict.`
);
