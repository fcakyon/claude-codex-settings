#!/usr/bin/env node
// Sends a review request to the Codex CLI and prints only the reviewer's answer.
// The question arrives on standard input. --transcript <file> prepends the recent conversation.
// Set CODEX_ADVISOR_MODEL to review with a model other than the pinned default.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const transcriptIndex = args.indexOf("--transcript");
const question = readFileSync(0, "utf8").trim();
if (!question)
  throw new Error("ask_codex: pass the review request on standard input");

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

let context = "";
if (transcriptIndex !== -1) {
  const transcript = args[transcriptIndex + 1];
  const lines = readFileSync(transcript, "utf8").split("\n");
  const records = [];
  let i = lines.length - 1;
  for (; i >= 0 && records.length < 80; i--) {
    if (!lines[i]) continue;
    let record;
    try {
      record = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (record.isSidechain === true || record.isMeta === true) continue;
    if (record.type !== "user" && record.type !== "assistant") continue;
    const content = record.message?.content;
    const rendered =
      typeof content === "string"
        ? `${record.type}: ${clip(content, 4000)}`
        : Array.isArray(content)
          ? content.map((block) => renderBlock(record.type, block)).filter(Boolean).join("\n")
          : "";
    if (rendered) records.push(rendered);
  }
  records.reverse();
  let recent = records.join("\n\n---\n\n");
  const MAX = 160000;
  if (recent.length > MAX) recent = "…[older turns truncated for length]\n" + recent.slice(-MAX);
  if (i >= 0) recent = `…[this is only the newest ${records.length} turns of a longer session]\n` + recent;
  if (records.length)
    context = `You are reviewing an in-progress Claude Code session. Below is the recent conversation, most recent last, the same history the built-in advisor tool would see. Weigh the question against this actual context, not just the caller's summary of it.

Long turns are shortened and marked \`…[truncated]\`. Full session: ${transcript}, one JSON record per line, newest last. Grep it for a term, number, or phrase you are chasing; never read it whole.

<recent-conversation>
${recent}
</recent-conversation>`;
}

const prompt = [
  readFileSync(
    new URL("../reviewer-prompt.md", import.meta.url),
    "utf8",
  ).trim(),
  context,
  `<question>\n${question}\n</question>`,
]
  .filter(Boolean)
  .join("\n\n");

const result = spawnSync(
  "codex",
  [
    "exec",
    // Pinned so the verdict does not drift with whatever ~/.codex/config.toml happens to set.
    "--model",
    process.env.CODEX_ADVISOR_MODEL ?? "gpt-5.6-sol",
    "-c",
    'model_reasoning_effort="medium"',
    "--sandbox",
    "read-only",
    "--ephemeral",
    "--skip-git-repo-check",
    "--color",
    "never",
    "-",
  ],
  { input: prompt, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
);

if (result.error) throw result.error;
if (result.signal) throw new Error(`codex exited from signal ${result.signal}`);
// Codex narrates the run on stderr, so it only becomes useful once something failed.
if (result.status !== 0) {
  process.stderr.write(result.stderr ?? "");
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
