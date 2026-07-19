#!/usr/bin/env node
// SubagentStart hook: feeds the fable-advisor subagent the recent conversation
// (it otherwise sees only the caller's prompt). Node-only, cross-platform, exits 0 on any failure.

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

// Scan newest-first and stop at 80 records, so a multi-MB transcript never parses the head it would discard.
const records = [];
for (let i = lines.length - 1; i >= 0 && records.length < 80; i--) {
  if (!lines[i]) continue;
  let r;
  try {
    r = JSON.parse(lines[i]); // skip a half-written or malformed line
  } catch {
    continue;
  }
  if (r.isSidechain === true || r.isMeta === true) continue;
  if (r.type !== "user" && r.type !== "assistant") continue;
  const content = r.message?.content;
  let rendered;
  if (typeof content === "string") rendered = `${r.type}: ${clip(content, 4000)}`;
  else if (Array.isArray(content)) rendered = content.map((b) => renderBlock(r.type, b)).filter(Boolean).join("\n");
  else continue;
  if (rendered) records.push(rendered);
}
records.reverse();

if (records.length === 0) {
  emit(
    `The full conversation transcript for this session is at:\n${transcriptPath}\n` +
      `Read it (JSONL, newest turns at the end) to reconstruct the context before reviewing.`
  );
  process.exit(0);
}

// Keep the newest characters so a very chatty session cannot flood the reviewer.
let recent = records.join("\n\n---\n\n");
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
