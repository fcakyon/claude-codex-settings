#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const systemPrompt = readFileSync(new URL("../../../claude-agents/fable-advisor.md", import.meta.url), "utf8")
  .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
  .trim();
const result = spawnSync(
  "claude",
  [
    "-p",
    "--model",
    "fable",
    "--effort",
    "high",
    "--tools",
    "",
    "--no-session-persistence",
    "--output-format",
    "text",
    "--system-prompt",
    systemPrompt,
  ],
  { stdio: "inherit" }
);

if (result.error) throw result.error;
if (result.signal) throw new Error(`claude exited from signal ${result.signal}`);
process.exit(result.status ?? 1);
