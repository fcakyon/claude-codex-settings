#!/usr/bin/env python3
"""
PostToolUse hook: Format Markdown files and embedded code blocks.
Inspired by https://github.com/ultralytics/actions/blob/main/actions/update_markdown_code_blocks.py
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory


PYTHON_BLOCK_PATTERN = r"^( *)```(?:python|py|\{[ ]*\.py[ ]*\.annotate[ ]*\})\n(.*?)\n\1```"
BASH_BLOCK_PATTERN = r"^( *)```(?:bash|sh|shell)\n(.*?)\n\1```"
LANGUAGE_TAGS = {"python": ["python", "py", "{ .py .annotate }"], "bash": ["bash", "sh", "shell"]}


def check_prettier_version() -> bool:
    """Check if prettier is installed and warn if version differs from 3.6.2."""
    if not shutil.which("npx"):
        return False
    try:
        result = subprocess.run(["npx", "prettier", "--version"],
                                capture_output=True, text=True, check=False, timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            if "3.6.2" not in version:
                print(f"⚠️  Prettier version mismatch: expected 3.6.2, found {version}")
            return True
    except Exception:
        pass
    return False


def extract_code_blocks(markdown_content: str) -> dict[str, list[tuple[str, str]]]:
    """Extract code blocks from markdown content.

    Args:
        markdown_content (str): Markdown text to inspect.

    Returns:
        (dict): Mapping of language names to lists of (indentation, block) pairs.
    """

    python_blocks = re.compile(PYTHON_BLOCK_PATTERN, re.DOTALL | re.MULTILINE).findall(markdown_content)
    bash_blocks = re.compile(BASH_BLOCK_PATTERN, re.DOTALL | re.MULTILINE).findall(markdown_content)
    return {"python": python_blocks, "bash": bash_blocks}


def remove_indentation(code_block: str, num_spaces: int) -> str:
    """Remove indentation from a block of code.

    Args:
        code_block (str): Code snippet to adjust.
        num_spaces (int): Leading space count to strip.

    Returns:
        (str): Code with indentation removed.
    """

    lines = code_block.split("\n")
    stripped_lines = [line[num_spaces:] if len(line) >= num_spaces else line for line in lines]
    return "\n".join(stripped_lines)


def add_indentation(code_block: str, num_spaces: int) -> str:
    """Add indentation back to non-empty lines in a code block.

    Args:
        code_block (str): Code snippet to indent.
        num_spaces (int): Space count to prefix.

    Returns:
        (str): Code with indentation restored.
    """

    indent = " " * num_spaces
    lines = code_block.split("\n")
    return "\n".join([indent + line if line.strip() else line for line in lines])


def format_code_with_ruff(temp_dir: Path) -> None:
    """Format Python files in a temporary directory with Ruff.

    Args:
        temp_dir (Path): Directory containing extracted Python blocks.
    """

    try:
        subprocess.run(["ruff", "format", "--line-length=120", str(temp_dir)], check=True)
        print("Completed ruff format ✅")
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR running ruff format ❌ {exc}")

    try:
        subprocess.run(
            [
                "ruff",
                "check",
                "--fix",
                "--extend-select", "F,I,D,UP,RUF,FA",
                "--target-version", "py39",
                "--ignore", "D100,D104,D203,D205,D212,D213,D401,D406,D407,D413,RUF001,RUF002,RUF012",
                str(temp_dir),
            ],
            check=True,
        )
        print("Completed ruff check ✅")
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR running ruff check ❌ {exc}")


def format_bash_with_prettier(temp_dir: Path) -> None:
    """Format Bash files in a temporary directory with prettier-plugin-sh.

    Args:
        temp_dir (Path): Directory containing extracted Bash blocks.
    """

    try:
        result = subprocess.run(
            "npx prettier --write --plugin=$(npm root -g)/prettier-plugin-sh/lib/index.cjs ./**/*.sh",
            shell=True,
            capture_output=True,
            text=True,
            cwd=temp_dir,
        )
        if result.returncode != 0:
            print(f"ERROR running prettier-plugin-sh ❌ {result.stderr}")
        else:
            print("Completed bash formatting ✅")
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR running prettier-plugin-sh ❌ {exc}")


def generate_temp_filename(file_path: Path, index: int, code_type: str) -> str:
    """Generate a deterministic filename for a temporary code block.

    Args:
        file_path (Path): Source markdown path.
        index (int): Block index for uniqueness.
        code_type (str): Language identifier.

    Returns:
        (str): Safe filename for the temporary code file.
    """

    stem = file_path.stem
    code_letter = code_type[0]
    path_part = str(file_path.parent).replace("/", "_").replace("\\", "_").replace(" ", "-")
    hash_val = hashlib.md5(f"{file_path}_{index}".encode(), usedforsecurity=False).hexdigest()[:6]
    ext = ".py" if code_type == "python" else ".sh"
    filename = f"{stem}_{path_part}_{code_letter}{index}_{hash_val}{ext}"
    return re.sub(r"[^\w\-.]", "_", filename)


def process_markdown_file(
    file_path: Path,
    temp_dir: Path,
    process_python: bool = True,
    process_bash: bool = True,
) -> tuple[str, list[tuple[int, str, Path, str]]]:
    """Extract code blocks from a markdown file and store them as temporary files.

    Args:
        file_path (Path): Markdown path to process.
        temp_dir (Path): Directory to store temporary files.
        process_python (bool, optional): Enable Python block extraction.
        process_bash (bool, optional): Enable Bash block extraction.

    Returns:
        markdown_content (str): Original markdown content.
        temp_files (list): Extracted block metadata.
    """

    try:
        markdown_content = file_path.read_text()
    except Exception as exc:  # noqa: BLE001
        print(f"Error reading file {file_path}: {exc}")
        return "", []

    code_blocks_by_type = extract_code_blocks(markdown_content)
    temp_files: list[tuple[int, str, Path, str]] = []
    code_types: list[tuple[str, int]] = []
    if process_python:
        code_types.append(("python", 0))
    if process_bash:
        code_types.append(("bash", 1000))

    for code_type, offset in code_types:
        for i, (indentation, code_block) in enumerate(code_blocks_by_type[code_type]):
            num_spaces = len(indentation)
            code_without_indentation = remove_indentation(code_block, num_spaces)
            temp_file_path = temp_dir / generate_temp_filename(file_path, i + offset, code_type)
            try:
                temp_file_path.write_text(code_without_indentation)
            except Exception as exc:  # noqa: BLE001
                print(f"Error writing temp file {temp_file_path}: {exc}")
                continue
            temp_files.append((num_spaces, code_block, temp_file_path, code_type))

    return markdown_content, temp_files


def update_markdown_file(file_path: Path, markdown_content: str, temp_files: list[tuple[int, str, Path, str]]) -> None:
    """Replace markdown code blocks with formatted versions.

    Args:
        file_path (Path): Markdown file to update.
        markdown_content (str): Original content.
        temp_files (list): Metadata for formatted code blocks.
    """

    for num_spaces, original_code_block, temp_file_path, code_type in temp_files:
        try:
            formatted_code = temp_file_path.read_text().rstrip("\n")
        except Exception as exc:  # noqa: BLE001
            print(f"Error reading temp file {temp_file_path}: {exc}")
            continue
        formatted_code_with_indentation = add_indentation(formatted_code, num_spaces)

        for lang in LANGUAGE_TAGS[code_type]:
            markdown_content = markdown_content.replace(
                f"{' ' * num_spaces}```{lang}\n{original_code_block}\n{' ' * num_spaces}```",
                f"{' ' * num_spaces}```{lang}\n{formatted_code_with_indentation}\n{' ' * num_spaces}```",
            )

    try:
        file_path.write_text(markdown_content)
    except Exception as exc:  # noqa: BLE001
        print(f"Error writing file {file_path}: {exc}")


def run_prettier(markdown_file: Path) -> None:
    """Format a markdown file with Prettier when available.

    Args:
        markdown_file (Path): Markdown file to format.
    """

    if not check_prettier_version():
        return
    is_docs = "docs" in markdown_file.parts and "reference" not in markdown_file.parts
    command = ["npx", "prettier", "--write", "--list-different", str(markdown_file)]
    if is_docs:
        command = ["npx", "prettier", "--tab-width", "4", "--write", "--list-different", str(markdown_file)]
    subprocess.run(command, capture_output=True, check=False, cwd=markdown_file.parent)


def format_markdown_file(markdown_file: Path) -> None:
    """Format markdown-embedded code and run Prettier on the file.

    Args:
        markdown_file (Path): Markdown file to process.
    """

    with TemporaryDirectory() as tmp_dir_name:
        temp_dir = Path(tmp_dir_name)
        markdown_content, temp_files = process_markdown_file(markdown_file, temp_dir)
        if not temp_files:
            run_prettier(markdown_file)
            return

        has_python = any(code_type == "python" for *_, code_type in temp_files)
        has_bash = any(code_type == "bash" for *_, code_type in temp_files)
        if has_python:
            format_code_with_ruff(temp_dir)
        if has_bash:
            format_bash_with_prettier(temp_dir)
        update_markdown_file(markdown_file, markdown_content, temp_files)

    run_prettier(markdown_file)


def read_markdown_path() -> Path | None:
    """Read the markdown path from stdin payload.

    Returns:
        markdown_path (Path | None): Markdown path when present and valid.
    """

    try:
        data = json.load(sys.stdin)
    except Exception:  # noqa: BLE001
        return None
    file_path = data.get("tool_input", {}).get("file_path", "")
    path = Path(file_path) if file_path else None
    if not path or path.suffix.lower() != ".md" or not path.exists():
        return None
    return path


def main() -> None:
    """Run markdown formatting hook."""

    markdown_file = read_markdown_path()
    if markdown_file:
        format_markdown_file(markdown_file)
    sys.exit(0)


if __name__ == "__main__":
    main()
