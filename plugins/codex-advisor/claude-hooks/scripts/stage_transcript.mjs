#!/usr/bin/env node
// SubagentStart hook: stages the recent conversation to a file and hands the codex-advisor
// relay the exact command to run. Staging beats inlining here because the reviewer is a
// separate process, so the relay never has to retype the history.
// Node-only, cross-platform, exits 0 on any failure.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../../skills/codex-advisor/scripts/ask_codex.mjs", import.meta.url),
);
const run = (contextFile) =>
  contextFile
    ? `node "${script}" --context "${contextFile}"`
    : `node "${script}"`;

const emit = (contextFile) =>
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext: contextFile
          ? `The recent conversation has been staged for the reviewer, the same history the built-in advisor tool would see. Send the caller's question to the reviewer on standard input with exactly this command:\n\n${run(contextFile)}`
          : `The recent conversation could not be reconstructed, so the reviewer will see only your question. Say so in your reply. Run:\n\n${run()}`,
      },
    }),
  );

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
        typeof c === "string"
          ? c
          : Array.isArray(c)
            ? c.map((x) => x.text ?? "").join(" ")
            : JSON.stringify(c ?? "");
      return `  ↳ result: ${clip(text, 8000)}`;
    }
    default:
      return "";
  }
};

// Any failure here leaves lines empty, which still stages the transcript path so the
// reviewer keeps its escape hatch instead of ruling on the caller's prompt alone.
let transcript;
let lines = [];
try {
  transcript = JSON.parse(readFileSync(0, "utf8")).transcript_path;
  lines = readFileSync(transcript, "utf8").split("\n");
} catch {}

// Scan newest-first and stop at 80 records, so a multi-MB transcript never parses the head it would discard.
const records = [];
let i = lines.length - 1;
for (; i >= 0 && records.length < 80; i--) {
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
  else if (Array.isArray(content))
    rendered = content
      .map((b) => renderBlock(r.type, b))
      .filter(Boolean)
      .join("\n");
  else continue;
  if (rendered) records.push(rendered);
}
records.reverse();

// Keep the newest characters so a very chatty session cannot flood the reviewer.
let recent = records.join("\n\n---\n\n");
const MAX = 160000;
if (recent.length > MAX)
  recent = "…[older turns truncated for length]\n" + recent.slice(-MAX);
// The record cap is silent otherwise, and a reviewer that cannot tell a whole session from
// its tail never knows there is anything older to go looking for.
if (i >= 0)
  recent = `…[this is only the newest ${records.length} turns of a longer session]\n` + recent;

let contextFile;
try {
  if (transcript) {
    const staged = join(
      mkdtempSync(join(tmpdir(), "codex-advisor-")),
      "conversation.md",
    );
    writeFileSync(
      staged,
      `You are reviewing an in-progress Claude Code session. Below is the recent conversation, most recent last, the same history the built-in advisor tool would see. Weigh the question against this actual context, not just the caller's summary of it.

Long turns are shortened and marked \`…[truncated]\`. Full session: ${transcript}, one JSON record per line, newest last. Grep it for a term, number, or phrase you are chasing; never read it whole.

<recent-conversation>
${recent}
</recent-conversation>
`,
    );
    contextFile = staged;
  }
} catch {}

emit(contextFile);
