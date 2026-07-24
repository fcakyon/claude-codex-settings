#!/usr/bin/env node
// Sends a review request to the Codex CLI and prints only the reviewer's answer.
// The question arrives on standard input. --context <file> prepends a staged conversation.
// Set CODEX_ADVISOR_MODEL to review with a model other than the Codex default.

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const contextIndex = args.indexOf("--context");
const question = readFileSync(0, "utf8").trim();
if (!question)
  throw new Error("ask_codex: pass the review request on standard input");

const prompt = [
  readFileSync(
    new URL("../reviewer-prompt.md", import.meta.url),
    "utf8",
  ).trim(),
  contextIndex === -1
    ? ""
    : readFileSync(args[contextIndex + 1], "utf8").trim(),
  `<question>\n${question}\n</question>`,
]
  .filter(Boolean)
  .join("\n\n");

const answerFile = join(
  mkdtempSync(join(tmpdir(), "codex-advisor-")),
  "answer.md",
);
const result = spawnSync(
  "codex",
  [
    "exec",
    ...(process.env.CODEX_ADVISOR_MODEL
      ? ["--model", process.env.CODEX_ADVISOR_MODEL]
      : []),
    "--sandbox",
    "read-only",
    "--ephemeral",
    "--skip-git-repo-check",
    "--color",
    "never",
    "--output-last-message",
    answerFile,
    "-",
  ],
  { input: prompt, stdio: ["pipe", "ignore", "pipe"] },
);

if (result.error) throw result.error;
if (result.signal) throw new Error(`codex exited from signal ${result.signal}`);
// Codex narrates the run on stderr, so it only becomes useful once something failed.
if (result.status !== 0) {
  process.stderr.write(result.stderr ?? "");
  process.exit(result.status ?? 1);
}

process.stdout.write(readFileSync(answerFile, "utf8"));

// Both temp trees hold a copy of the conversation, so drop them once the review is through.
// A failed run exits above with them intact, which keeps a retry cheap.
rmSync(dirname(answerFile), { recursive: true, force: true });
if (contextIndex !== -1)
  rmSync(dirname(args[contextIndex + 1]), { recursive: true, force: true });
