# Candidate surfacing

Run the surfacing script during read-only discovery, before inspecting candidate
evidence by hand. It lists candidates, never verdicts. Every listed item still
needs the full record in [candidate evidence](audit.md#candidate-evidence)
before any edit.

```bash
node <skill-root>/scripts/surface-candidates.mjs --root . [--qa-suite <path>] [--format json|markdown|text]
```

Run it from the repository root. `<skill-root>` is the installed `test-audit`
skill directory, which holds `SKILL.md` and `scripts/`. The script needs
Node 22 or later and no dependencies. It reads the files `git ls-files` lists
in a Git repository and walks the tree otherwise, skipping dependency, build,
cache and artifact folders. Its `notAudited` key names the skipped folders,
unsupported languages and unreadable files.

| Report key | What it lists | Check before acting |
| --- | --- | --- |
| `testOnlySeams` | Top-level production symbols that only tests reference | Read every caller, including other packages |
| `undercountedScripts` | Test files with five or more assertions and no runner declarations | Count assertions, not runner tests |
| `bundleGrepsWithBuildGuards` | Tests that read source or bundle text under a bundler config | Check whether the build guard already owns it |
| `assertionFreeTests` | Test blocks with no assertion and no skip or environment guard | Confirm the test can fail at all |
| `envGatedOrSkippedTests` | Test blocks that skip or read the environment | Find the job that runs them before calling them dead |
| `qaSuiteOverlap` | Unit tests that mock a route a QA journey exercises | Compare with the journey before keeping the mock |

The detectors match words and simple patterns, not syntax trees. Dynamic
dispatch, reflection, re-exports and generated code cause false positives and
false negatives. An empty list is no signal, not proof.

## Audit lessons

1. Split caller counts before deleting any symbol. Record `nonTestCallers`,
   `samePkgTestCallers` and `otherPkgTestCallers` separately. A symbol with no
   production caller but tests in another package can still be a public
   contract, while one used only by its own package tests is a test-only seam.
2. Treat build and compiler guards, such as a Vite config that fails the build
   when a debug fixture reaches a bundle, as mutation-verified keepers. Do not
   repeat them with bundle string greps, and do not delete them as redundant.
3. Do not read raw runner test counts as coverage. A single-script test file
   can run dozens of assertions while the runner reports one test.
4. End every audit handoff with an explicit `Not audited` section. Name skipped
   languages, excluded directories and unrun live or native suites, so partial
   scope never reads as a clean result.

## QA journeys

The sibling `qa` plugin owns the `.agents/qa/suite.mjs` coverage contract,
where each exported case has an `id`, a `surface` and the real routes it
drives. `qa` finds missing user journeys. `test-audit` prunes redundant tests
and flags unit tests that mock a route a QA journey already exercises for real.
Keep pure algorithm tests with meaningful edge cases. Remove a mocked transport
test only after the journey proves the same contract.
