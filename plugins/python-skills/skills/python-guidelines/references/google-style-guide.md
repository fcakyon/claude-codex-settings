# Google Python Style Guide -- Key Sections

Source: https://google.github.io/styleguide/pyguide.html
Maintainer: Google
License: CC-BY 3.0

Each section links to the specific guide section for full context.

## Exceptions

Source: https://google.github.io/styleguide/pyguide.html#24-exceptions

- Raise `ValueError` for programming mistakes like violated preconditions
- Never use catch-all `except:` statements, or catch `Exception` unless re-raising or creating an isolation point
- Minimize the amount of code in a `try`/`except` block
- Do not use `assert` in place of conditionals for critical logic

```python
# Yes
if minimum < 1024:
    raise ValueError(f"Min. port must be at least 1024, not {minimum}.")

# No
assert minimum >= 1024, "Minimum port must be at least 1024."
```

## Default Argument Values

Source: https://google.github.io/styleguide/pyguide.html#212-default-argument-values

Do not use mutable objects as default values.

```python
# Yes
def foo(a, b=None):
    if b is None:
        b = []


# No
def foo(a, b=[]): ...
def foo(a, b=time.time()): ...
```

## Import Ordering

Source: https://google.github.io/styleguide/pyguide.html#313-imports-formatting

Imports grouped from most generic to least:

1. `from __future__` imports
2. Python standard library
3. Third-party modules
4. Local/project imports

Within each group, sort lexicographically. Use `import x` for packages, `from x import y` where `x` is the package prefix. No relative imports.

```python

```

## Naming Conventions

Source: https://google.github.io/styleguide/pyguide.html#316-naming

| Type               | Style              | Example                 |
| ------------------ | ------------------ | ----------------------- |
| Packages/Modules   | `lower_with_under` | `my_module`             |
| Classes/Exceptions | `CapWords`         | `MyClass`, `InputError` |
| Functions/Methods  | `lower_with_under` | `calculate_total`       |
| Constants          | `CAPS_WITH_UNDER`  | `MAX_RETRIES`           |
| Variables          | `lower_with_under` | `user_count`            |

Avoid: single-char names (except `i`, `j`, `k`, `e`, `f`), dashes in names, type-in-name (`id_to_name_dict`).

## Adapting to Existing Code

These Google Style Guide rules are defaults. When working in an existing codebase, always match the existing patterns for:

- **Type hints**: Follow the repo's existing annotation style (presence/absence, `X | None` vs `Optional[X]`, etc.)
- **Naming**: Match the existing naming conventions in the file/module you're editing
- **Import style**: Follow the repo's existing import organization
- **Docstrings**: Match the existing docstring style in the project

The rules above are for greenfield code or when the existing codebase has no clear convention.

## Comments

Source: https://google.github.io/styleguide/pyguide.html#385-block-and-inline-comments

- Never describe the code. Assume the reader knows Python.
- Comments start at least 2 spaces from the code
- Use them to explain WHY, not WHAT
