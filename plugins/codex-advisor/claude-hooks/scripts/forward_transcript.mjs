#!/usr/bin/env node
// SubagentStart hook: forwards the transcript path and command to the codex-advisor relay.
// Node-only, exits 0 on any failure.

import { accessSync, constants, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../../skills/codex-advisor/scripts/ask_codex.mjs", import.meta.url),
);
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
const run = (transcript) =>
  transcript
    ? `node ${quote(script)} --transcript ${quote(transcript)}`
    : `node ${quote(script)}`;

const emit = (transcript) =>
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext: transcript
          ? `Send the caller's question to the reviewer on standard input with exactly this command. It reads the original conversation directly:\n\n${run(transcript)}`
          : `The recent conversation could not be reconstructed, so the reviewer will see only your question. Say so in your reply. Run:\n\n${run()}`,
      },
    }),
  );

let transcript;
try {
  transcript = JSON.parse(readFileSync(0, "utf8")).transcript_path;
  accessSync(transcript, constants.R_OK);
} catch {}

emit(transcript);
