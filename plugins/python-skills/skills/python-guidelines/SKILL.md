---
name: python-guidelines
description: This skill should be used when writing, reviewing, or refactoring Python code. Covers code integration, idiomatic patterns, docstring formatting, anti-abstraction rules, and software engineering basics.
---

# Python Guidelines

**Integrate into existing code. Don't append to it.**

> Simple is better than complex. Flat is better than nested.
> Errors should never pass silently. Unless explicitly silenced.
> If the implementation is hard to explain, it's a bad idea.
>
> -- The Zen of Python (PEP 20)

## Code Philosophy

- Match existing naming, importing, and signature patterns. Use existing utilities and data structures.
- Functions have a single purpose. Don't hardcode behavior that makes them less general.
- No trivial wrappers for 2 lines or less. Inline it.
- Inline single-use variables at the usage site.
- No try/except unless critical. Let errors surface.
- No duplicate code.
- Functions handle their own input validation. No if-else checks in main.
- Use pathlib, not os.path.
- Consider API and time costs for MongoDB/Gemini/OpenAI/Claude/Voyage.

Don't do this:

```python
# Generate comment report only if requested
if include_comments:
    comment_report = generate_comments_report(start_date, end_date, team, verbose)
else:
    comment_report = ""
    print("   Skipping comment analysis (disabled)")
```

Do this:

```python
comment_report = generate_comments_report(start_date, end_date, team, verbose) if include_comments else ""
```

Ask yourself: "Am I adding code, or integrating into what exists?"

## Simplicity Over Abstraction

**YAGNI: You Aren't Gonna Need It.**

Don't build for hypothetical future requirements. Add complexity only when the current task demands it.

Avoid:

- Abstract base classes for a single implementation
- Configuration options nobody asked for
- Error handling for impossible scenarios
- Wrapper classes around a single function
- Dependency injection when direct calls work
- Generic type parameters for one concrete type

Three similar lines of code is better than a premature abstraction. Refactor when the third real use case appears, not before.

But simplicity does not mean chaos. Always maintain:

- Clear function names that describe what they do
- Logical grouping of related code into modules
- Consistent naming conventions across the project
- Clean separation between I/O and logic
- Explicit parameters over global state or side effects

Ask yourself: "Is this abstraction solving a problem I have right now, or one I'm imagining?"

## Environment

- **Package manager**: uv (NOT pip)
- **Virtual env**: `source .venv/bin/activate` or `uv run python -c "..."`
- **3rd party packages**: Find source with `python -c "import pkg; print(pkg.__file__)"`, then Read.

## Testing Discipline

Never assume anything. Run `python -c "..."` to verify hypotheses about code behavior, package functions, or data structures before suggesting a plan or exiting plan mode.

Ask yourself: "Did I verify this with `python -c` before building on it?"

## Google-Style Docstrings

- **Summary**: Imperative mood ("Calculate", not "Calculates")
- **Args**: All parameters with types and descriptions. No default values. Indent 4 spaces.
- **Types**: `int | str` unions, uppercase shapes `(N, M)`, lowercase builtins `list`/`dict`/`tuple`, capitalize `Any`/`Path`
- **Optional**: `name (type, optional): Description`
- **Returns**: Always `(type)` in parentheses. Never tuple types. Separate named values for multiple returns.
- **Sections**: Examples (>>>), Notes, References (plaintext only). Section titles at 0 indent.
- **Omit**: "Returns:" if nothing returned, "Args:" if no args, "Raises:" unless critical
- **Classes**: Attributes section only, omit Methods/Args. Don't convert single-line to multiline.
- **`__init__`**: Args only. No Examples/Notes/Methods/References.
- **Tests**: Single-line docstrings only.
- Erase default values from existing arg descriptions. Optionally include minimal Examples.

Ask yourself: "Would a new developer understand this function from the docstring alone?"

## Reference Files

For deeper guidance, see the reference files in `references/`:

- `zen-of-python.md` -- Full Zen of Python (PEP 20) with annotations
- `google-style-guide.md` -- Curated sections: exceptions, defaults, imports, naming, comments
- `idiomatic-patterns.md` -- 18 Python idioms with before/after code examples
- `effective-python-tips.md` -- Key tips from "Effective Python" by Brett Slatkin, organized by category
