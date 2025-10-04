# CLAUDE.md AGENTS.md

This file provides guidance to Claude Code (claude.ai/code), OpenAI Codex and other agentic AI tools when working with code in this repository.

## AI Guidance

* After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding. Use your thinking to plan and iterate based on this new information, and then take the best next action.
* For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
* Before you finish, please verify your solution
* Do what has been asked; nothing more, nothing less.
* NEVER create new files unless they're absolutely necessary for achieving your goal.
* ALWAYS prefer editing an existing file to creating a new one.
* NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
* When asked to commit changes, exclude CLAUDE.md from any commits.
* Reuse existing code wherever possible and minimize unnecessary arguments.
* Look for opportunities to simplify the code or remove unnecessary parts.
* Focus on targeted modifications rather than large-scale changes.

## Python Coding

- Use Google-style docstrings with comprehensive specifications
   - **Summary**: Start with clear, concise summary line in imperative mood ("Calculate", not "Calculates")
   - **Args/Attributes**: Document all parameters with types and brief descriptions (no default values)
   - **Types**: Use union types with vertical bar `int | str`, uppercase letters for shapes `(N, M)`, lowercase builtins `list`, `dict`, `tuple`, capitalize typing module classes `Any`, `Path`
   - **Optional Args**: Mark at end of type `name (type, optional): Description...`
   - **Returns**: Always enclose in parentheses `(type)`, NEVER use tuple types - document multiple returns as separate named values
   - **Sections**: Optional minimal sections in order: Examples (using >>>), Notes, References (plaintext only, no new ultralytics.com links)
   - **Line Wrapping**: Wrap at specified character limit, use zero indentation in docstring content
   - **Special Cases**: 
     - Classes: Include Attributes, omit Methods/Args sections, put all details in class docstring
     - `__init__`: Args ONLY, no Examples/Notes/Methods/References
     - Functions: Include Args and Returns sections when applicable
     - All test functions should be single-line docstrings.
     - Indent section titles like "Args:" 0 spaces
     - Indent section elements like each argument 4 spaces
     - DO NOT CONVERT SINGLE-LINE CLASS DOCSTRINGS TO MULTILINE.
     - Optionally include a minimal 'Examples:' section, and improve existing Examples if applicable.
     - Do not include default values in argument descriptions, and erase any default values you see in existing arg descriptions.
   - **Omissions**: Omit "Returns:" if nothing returned, omit "Args:" if no arguments, avoid "Raises:" unless critical

- Super important to integrate new code changes seamlessly within the existing code rather than simply adding more code to current files. Always review any proposed code updates for correctness and conciseness. Focus on writing things in minimal number of lines while avoiding redundant trivial extra lines and comments. For instance don't do:
   ```python
   # Generate comment report only if requested
   if include_comments:
       comment_report = generate_comments_report(start_date, end_date, team, verbose)
   else:
       comment_report = ""
       print("   Skipping comment analysis (disabled)")
   ```
   Instead do:
   ```python
   comment_report = generate_comments_report(start_date, end_date, team, verbose) if include_comments else ""
   ```
- Understand existing variable naming, function importing, class method definition, function signature ordering and naming patterns of the given modules and align your implementation with existing patterns. Always exploit existing utilities/optimization/data structures/modules in the project when suggesting something new. 
- Redundant duplicate code use is inefficient and unacceptable.
- Never assume anything without testing it with `python3 -c "..."` (don't create file)
- Always consider MongoDB/Gemini/OpenAI/Claude/Voyage API and time costs, and keep them as efficient as possible
- When using 3rd party package functions/classes or want to explore them:
   - 1. Find location by:
     ```bash
     python -c "import ultralytics; print(ultralytics.__file__)"
     ```
   - 2. Use List() Read() tools to explore the package and understand the function/class you want to use or read function docstrings
   - 3. Then properly set the parameters and use the function/class

## Project Overview
