#!/usr/bin/env bash
#
# precompact_priorities.sh
#
# Claude Code fires PreCompact before each /compact (manual) and each
# auto compaction. This script's trimmed stdout becomes the
# "Additional Instructions:" block appended after the default 9-section
# compact prompt.
#
# Each rule below is a fidelity requirement layered onto one of the
# existing default sections (1-9) rather than a parallel taxonomy, so
# the summarizer has one coherent shape to fill.
#
# The quoted heredoc delimiter ('PRIORITY_BLOCK') disables every form of
# shell expansion, so apostrophes, em-dashes, and backticks in the block
# pass through untouched with zero escaping.

cat << 'PRIORITY_BLOCK'
<priority-preservation-instructions>
These requirements augment the 9 required sections. They do not replace
any section — they raise the fidelity bar for content categories that
the default prompt leaves under-specified.

A. UNANSWERED QUESTIONS (patches §6 and §7)
   The default §6 says to list ALL user messages but does not ask you
   to flag which ones went unanswered. For each §6 message, mark it as
   answered, partially answered, or unanswered. In §7, add a
   sub-heading "Pending Questions" at the top and list every
   unanswered or partially answered user question verbatim.

B. ROOT CAUSES, NOT SYMPTOMS (patches §4 and §5)
   The default §4 asks for "errors and fixes" but does not distinguish
   confirmed root causes from ruled-out hypotheses. In §5, record
   every confirmed root cause with its file path and line number
   (pattern: `path/to/file.py:42`). In §4, keep ruled-out hypotheses
   so they don't get re-tried. Never paraphrase an error message,
   error code, or stack frame — preserve them verbatim.

C. EXACT NUMBERS AND IDS (patches §3, §4, §5)
   The default prompt nowhere tells you to preserve exact digits. Do
   so everywhere they appear: benchmark results, profiling output,
   error rates, latencies, token counts, costs, PR numbers, issue
   numbers, commit SHAs, run IDs, dataset names, and model IDs. Never
   round, never paraphrase a quantitative value.

D. FILE PATH IMPORTANCE TIERS (patches §3)
   The default §3 lists files flat. Group them by importance instead:
   critical (caused or fixed the issue), referenced (read for
   context), mentioned (appeared in discussion only). Use the pattern
   `path/to/file.py:42` whenever a specific line matters.

E. SUBAGENT FINDINGS ARE PRIMARY EVIDENCE (patches §3 and §5)
   The default prompt does not call out Task / Agent tool results.
   For every such tool result in the transcript, preserve the agent's
   final report in full in §3 or §5 as appropriate — file paths, code
   references, citations, and quantitative findings it returned.
   Subagent runs are expensive to redo; treat their reports as
   primary evidence, not as compressible chatter.

F. A-VS-B COMPARISONS (patches §1)
   The default §1 asks for explicit requests and intents but says
   nothing about alternatives under evaluation. When the user was
   weighing option A vs option B (tool X vs tool Y, approach 1 vs
   approach 2), preserve both sides and the decision criteria. If a
   decision was reached, record which side won and the reasoning.

Priority when cutting for length: if A–F would otherwise be dropped
to fit within a section's length, drop conversational filler,
repeated tool output, and intermediate reasoning first.
</priority-preservation-instructions>
PRIORITY_BLOCK
