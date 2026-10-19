"""Find each git commit a shell command runs and the message it gives, shared by the commit hooks."""

from __future__ import annotations

import re
import shlex
from pathlib import Path

# Same heredoc pattern as the humanize hook, groups are the delimiter, the rest of the opening line, and the body
HEREDOC = re.compile(r"<<-?[ \t]*[\"']?([A-Za-z_]\w*)[\"']?([^\n]*)\r?\n(.*?)\r?\n[ \t]*\1[ \t]*$", re.DOTALL | re.MULTILINE)
# quoted text and escapes are kept, a # starting a word outside them is a comment up to the newline
COMMENT = re.compile(r"""('[^']*'|"(?:\\.|[^"\\])*"|\\.)|(?<![^\s;&|()])#[^\n]*""", re.DOTALL)
MARK = re.compile(r"\x00(\d+)\x00")
CAT_MARK = re.compile(r"\$\(\s*cat\s+\x00(\d+)\x00\s*\)")
OPERATORS = ";&|\n()"
SHELLS = {"bash", "sh", "zsh"}


def tokens(text: str) -> list[str]:
    """Split shell text into words, operators, and redirects with humanize's shlex settings plus ()<> as operators."""
    text = COMMENT.sub(lambda m: m[1] or "", text.replace("\\\n", " "))
    try:
        lexer = shlex.shlex(text, posix=True, punctuation_chars=OPERATORS + "<>")
        lexer.whitespace_split = True
        lexer.whitespace = " \t\r"
        lexer.commenters = ""
        return list(lexer)
    except ValueError:
        # keep operators apart so an unclosed quote still leaves each command on its own
        return re.findall(rf"[{OPERATORS}<>]+|[^\s{OPERATORS}<>]+", text)


def git_commits(command: str | list[str], cwd: str) -> list[tuple[list[str], str]]:
    """Return the arguments and message of each git commit a shell command or argv array runs.

    The message comes from -m values, a heredoc or pipe feeding -F -, or the -F file, preferring what cat, tee,
    echo, or printf wrote to it earlier in the command over the file on disk. A shell runs its -c script or its
    stdin as code, while every other heredoc body stays data.

    Args:
        command (str | list[str]): Shell command string, or an argv array as Codex sends it.
        cwd (str): Directory that relative -F paths resolve from.

    Returns:
        (list[tuple[list[str], str]]): Arguments after commit and the message, one pair per git commit.
    """
    bodies, files, found = [], {}, []

    def mark(m: re.Match) -> str:
        """Swap a heredoc for a token that indexes its body, keeping the rest of its opening line."""
        bodies.append(m[3])
        return f" \x00{len(bodies) - 1}\x00 {m[2]}"

    def message(args: list[str], stdin: str) -> str:
        """Join the -m values or read the -F file the way git commit does."""
        parts, rest = [], iter(args)
        for arg in rest:
            if m := re.fullmatch(r"--(message|file)(=.*)?", arg, re.DOTALL):
                flag, value = m[1][0], m[2][1:] if m[2] else next(rest, "")
            elif m := re.fullmatch(r"-[^-mFcCtuS]*([mFcCtuS])(.*)", arg, re.DOTALL):
                # a short cluster like -vam ends at the first flag taking a value, given after it or as the next arg
                flag, value = m[1], m[2] or (next(rest, "") if m[1] in "mFcCt" else "")
            else:
                continue
            if flag == "m":
                # the shell puts a $(cat <<EOF) body in place of the substitution
                parts.append(CAT_MARK.sub(lambda b: bodies[int(b[1])], value))
            elif flag in "Ff":
                path = Path(cwd, value)
                written = files[path] if path in files else path.read_text() if path.is_file() else ""
                parts.append(stdin if value == "-" else written)
        return "\n\n".join(parts)

    def step(cmd: list[str], stdin: str) -> str:
        """Record a git commit, run shell code, and track what one simple command writes, returning its output."""
        words, writes, rest = [], [], iter(cmd)
        for tok in rest:
            if b := MARK.fullmatch(tok):
                stdin = bodies[int(b[1])]
            elif tok == "<<<":
                stdin = next(rest, "") + "\n"
            elif tok in (">", ">>", ">|", "&>", "&>>"):
                writes.append(next(rest, ""))
            elif re.fullmatch(r"[<>&|]+", tok):
                next(rest, "")
            else:
                words.append(tok)
        name, args = (Path(words[0]).name, words[1:]) if words else ("", [])
        operands = [a for a in args if not a.startswith("-")]
        if name in SHELLS:
            run(next((b for a, b in zip(args, args[1:]) if re.fullmatch(r"-\w*c\w*", a)), stdin))
        elif name == "git":
            i = 0
            while i < len(args) and args[i].startswith("-"):
                i += 2 if args[i] in ("-C", "-c", "--git-dir", "--work-tree", "--namespace") else 1
            if args[i : i + 1] == ["commit"]:
                found.append((args[i + 1 :], message(args[i + 1 :], stdin)))
        # only these print text the hook can know, cat only when it copies stdin rather than files
        out = {"cat": None if operands else stdin, "tee": stdin, "echo": " ".join(operands), "printf": " ".join(operands)}.get(name)
        if out is None:
            return ""
        files.update(dict.fromkeys((Path(cwd, p) for p in writes + (operands if name == "tee" else [])), out))
        return out

    def run(text: str) -> None:
        """Run each simple command in shell text in order, piping the output of one into the next across |."""
        cmd, piped = [], ""
        for tok in [*tokens(HEREDOC.sub(mark, text)), ";"]:
            if tok and not tok.strip(OPERATORS):
                out = step(cmd, piped)
                cmd, piped = [], out if tok in ("|", "|&") else ""
            else:
                cmd.append(tok)

    if isinstance(command, list):  # an argv array is one simple command with no shell syntax
        step([str(a) for a in command], "")
    else:
        run(command)
    return found
