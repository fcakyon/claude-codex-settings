#!/usr/bin/env python3
"""Format every file a write tool changed the way the Ultralytics Actions format job does."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Pins and arguments from ultralytics/actions v0.5.17 action.yml, where ruff is the package's own dependency.
# --force-exclude, --no-error-on-unmatched-pattern, and --no-errors-on-unmatched let ruff, Prettier, and Biome skip a
# path their config or ignore files exclude, as they do in a whole-repo run.
ACTIONS = ["uvx", "-q", "--from", "ultralytics-actions==0.5.17"]
RUFF_CHECK = [
    *ACTIONS,
    "ruff",
    "check",
    "--fix",
    "--unsafe-fixes",
    "--extend-select=F,I,D,UP,RUF,FA",
    "--target-version=py38",
    "--ignore=BLE001,D100,D104,D203,D205,D212,D213,D401,D406,D407,D413,RUF001,RUF002,RUF012,S110",
    "--force-exclude",
]
RUFF_FORMAT = [*ACTIONS, "ruff", "format", "--line-length=120", "--force-exclude"]
DOCSTRINGS = [*ACTIONS, "ultralytics-actions-format-python-docstrings"]
CODE_BLOCKS = [*ACTIONS, "ultralytics-actions-update-markdown-code-blocks"]
NPX = ["npx", "--prefer-offline", "--yes"]
PRETTIER = [
    *NPX,
    "prettier@3.9.9",
    "--write",
    "--list-different",
    "--print-width",
    "120",
    "--no-error-on-unmatched-pattern",
]
PRETTIER_IGNORED = ["!**/*lock.{json,yaml,yml}", "!**/*.lock", "!**/model.json", "!**/*.min.js", "!**/*.min.css"]
BIOME = [
    *NPX,
    "@biomejs/biome@latest",
    "check",
    "--write",
    "--line-width=120",
    "--max-diagnostics=1000",
    "--diagnostic-level=error",
    "--unsafe",
    "--no-errors-on-unmatched",
]
SHFMT = ["shfmt", "-i", "2", "-sr", "-bn", "-ci", "-l", "-w"]
BIOME_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".json"}
PRETTIER_SUFFIXES = {".css", ".less", ".scss", ".yml", ".yaml", ".html", ".vue", ".svelte", *BIOME_SUFFIXES}
# upstream COMMON_EXCLUDED_DIRS, the repo folders its docstring pass prunes
EXCLUDED_DIRS = set(
    ".git .venv venv env .env __pycache__ .mypy_cache .pytest_cache .tox .nox .eggs eggs .idea .vscode node_modules "
    "site-packages build dist".split()
)


def changed_paths(data: dict) -> list[str]:
    """Return changed file paths from Claude writes or Codex patches.

    Args:
        data (dict): Hook input payload.

    Returns:
        (list[str]): Changed file paths.
    """
    tool_input = data.get("tool_input") or {}
    if file_path := tool_input.get("file_path"):
        return [file_path]
    # a moved file now lives at its Move to path, not its Update File path
    return re.findall(
        r"^\*\*\* (?:Add File|Update File|Move to): (.+?)\s*$(?!\n\*\*\* Move to: )",
        tool_input.get("command", ""),
        re.MULTILINE,
    )


def repo_paths(path: Path) -> tuple[Path, Path]:
    """Locate the repo that holds a file.

    Args:
        path (Path): Absolute file path.

    Returns:
        root (Path): Repo root, or the file's folder outside a repo.
        rel (Path): File path relative to root.
    """
    git = subprocess.run(
        ["git", "rev-parse", "--show-toplevel", "--show-prefix"], cwd=path.parent, capture_output=True, text=True
    )
    if git.returncode:
        return path.parent, Path(path.name)
    root, prefix = git.stdout.splitlines()
    return Path(root), Path(prefix, path.name)


def uses_biome(root: Path) -> bool:
    """Check whether the repo has a Biome config and a workflow that sets the action's biome input.

    Args:
        root (Path): Repo root.

    Returns:
        (bool): Whether Biome runs first and replaces Prettier for JavaScript, TypeScript, and JSON.
    """
    return any((root / name).is_file() for name in ("biome.json", "biome.jsonc")) and any(
        re.search(r"^\s*biome:\s*[\"']?true\b", workflow.read_text(), re.MULTILINE)
        for workflow in root.glob(".github/workflows/*.y*ml")
    )


def run(cmd: list[str], cwd: Path) -> list[str]:
    """Run one formatter, skipping it when its launcher is missing.

    Args:
        cmd (list[str]): Formatter command.
        cwd (Path): Folder to run it in.

    Returns:
        (list[str]): Formatter output when it exited non-zero.
    """
    if not shutil.which(cmd[0]):
        return []
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return [f"{result.stdout}{result.stderr}".strip()] if result.returncode else []


def format_code_blocks(path: Path, root: Path, rel: Path) -> list[str]:
    """Format the Python and Bash code blocks and MkDocs tables of one Markdown file.

    The upstream formatter rewrites every Markdown file under its working folder and reads the file's repo path to skip
    tables under docs/**/reference/, so the file is staged at that path next to the repo's ruff config.

    Args:
        path (Path): Markdown file path.
        root (Path): Repo root.
        rel (Path): File path relative to root.

    Returns:
        (list[str]): Formatter output when it failed.
    """
    with tempfile.TemporaryDirectory() as tmp:
        staged = Path(tmp, rel)
        staged.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, staged)
        for config in ("pyproject.toml", "ruff.toml", ".ruff.toml"):
            if (root / config).is_file():
                shutil.copyfile(root / config, Path(tmp, config))
        failed = run(CODE_BLOCKS, Path(tmp))
        if (text := staged.read_bytes()) != path.read_bytes():
            path.write_bytes(text)
    return failed


def format_file(path: Path, root: Path, rel: Path) -> list[str]:
    """Run the upstream format steps on one file in upstream order.

    Args:
        path (Path): Absolute file path.
        root (Path): Repo root.
        rel (Path): File path relative to root.

    Returns:
        (list[str]): Output of the steps that failed.
    """
    dirs, file = rel.parts[:-1], str(path)
    if path.suffix == ".py":
        failed = run([*RUFF_CHECK, file], root) + run([*RUFF_FORMAT, file], root)
        return failed if EXCLUDED_DIRS.intersection(dirs) else failed + run([*DOCSTRINGS, file], root)
    if path.suffix == ".sh":
        return [] if {".git", "node_modules"}.intersection(dirs) else run([*SHFMT, file], root)
    # a repo that turns Biome on runs it on every file type it knows, then Prettier on all but the scripts Biome owns
    biome = uses_biome(root)
    failed = run([*BIOME, file], root) if biome else []
    if biome and path.suffix in BIOME_SUFFIXES:
        return failed
    if path.suffix in PRETTIER_SUFFIXES:
        return failed + run([*PRETTIER, file, *PRETTIER_IGNORED], root)
    if path.suffix != ".md":
        return failed
    # Prettier gives top-level docs/ 4-space tabs and skips docs/**/reference/ and nested docs/ folders
    failed += format_code_blocks(path, root, rel)
    if "docs" not in dirs:
        return failed + run([*PRETTIER, file], root)
    if dirs[0] == "docs" and "reference" not in dirs:
        return failed + run([*PRETTIER, "--tab-width", "4", file], root)
    return failed


def main() -> None:
    """Format each changed file and pass failed formatter output back to the agent."""
    messages = []
    for path in dict.fromkeys(Path(p).absolute() for p in changed_paths(json.load(sys.stdin))):
        messages += format_file(path, *repo_paths(path))
    if messages:
        print(
            json.dumps(
                {"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "\n".join(messages)}}
            )
        )


if __name__ == "__main__":
    main()
