#!/usr/bin/env node
// SubagentStart hook: feeds the fable-advisor subagent the recent conversation
// (it otherwise sees only the caller's prompt). Node-only, exits 0 on any failure.

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const output = (ctx) =>
  JSON.stringify({ hookSpecificOutput: { hookEventName: "SubagentStart", additionalContext: ctx } });
const emit = (ctx) => process.stdout.write(output(ctx));

const clip = (s, n) => (s.length > n ? s.slice(0, n) + " …[truncated]" : s);

const renderBlock = (role, b) => {
  switch (b.type) {
    case "text":
      return `${role}: ${clip(b.text ?? "", 4000)}`;
    case "thinking":
      return `assistant (thinking): ${clip(b.thinking ?? "", 4000)}`;
    case "tool_use":
      return `assistant → ${b.name ?? "?"}(${clip(JSON.stringify(b.input ?? {}), 8000)})`;
    case "tool_result": {
      const c = b.content;
      const text =
        typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text ?? "").join(" ") : JSON.stringify(c ?? "");
      return `  ↳ result: ${clip(text, 8000)}`;
    }
    default:
      return "";
  }
};

// On failure lines stays empty, so the reviewer is told it has only the caller's prompt.
let transcriptPath;
let lines = [];
try {
  transcriptPath = JSON.parse(readFileSync(0, "utf8")).transcript_path;
  lines = readFileSync(transcriptPath, "utf8").split("\n");
} catch {}

// Scan newest-first and stop at 80 records, so a multi-MB transcript never parses the head it would discard.
const records = [];
let i = lines.length - 1;
for (; i >= 0 && records.length < 80; i--) {
  if (!lines[i]) continue;
  let r;
  try {
    r = JSON.parse(lines[i]); // the transcript is appended to while this runs
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

const source = transcriptPath
  ? ` Full session: ${transcriptPath}, one JSON record per line, newest last. Grep it for a term, number, or phrase you are chasing; never read it whole.`
  : "";

let recent = records.join("\n\n---\n\n");
const MAX = 40000;
if (recent.length > MAX) recent = "…[older turns truncated for length]\n" + recent.slice(-MAX);
// Without this the record cap is silent, and the tail of a session reads as the whole of it.
if (i >= 0) recent = `…[this is only the newest ${records.length} turns of a longer session]\n` + recent;

if (records.length) {
  const token = randomUUID().slice(0, 8);
  const context = () =>
    `You are reviewing an in-progress Claude Code session. Below is the recent conversation, most recent last, the same history the built-in advisor tool would see. Weigh the specific question in the caller's prompt against this actual context, not just the caller's summary of it.

Confirmation token: ${token}

Long turns are shortened and marked \`…[truncated]\`.${source}

<recent-conversation>
${recent}
</recent-conversation>`;
  while (output(context()).length > 45000)
    recent = "…[older turns truncated for hook delivery]\n" + recent.slice(-Math.floor(recent.length * 0.8));
  emit(context());
} else {
  emit(`The recent conversation could not be reconstructed, so you see only the caller's prompt. Name the context you need.${source}`);
}
