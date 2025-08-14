# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

* Always provide docstrings in this format:

    - Single line docstrings, signature typehints (for ide linting) and docstring typehints (for mkdocs)

    ```python
    def example_function(arg1: int, arg2: int = 4) -> bool:
        """
        Example function demonstrating Google-style docstrings.

        Args:
            arg1 (int): The first argument.
            arg2 (int): The second argument.

        Returns:
            True if arguments are equal, False otherwise.

        Examples:
            >>> example_function(1, 1)  # True
        """
        return arg1 == arg2
    ```

- Always use pathlib instead of os.path
- Super important to integrate new code changes seamlessly within the existing code rather than simply adding more code to current files.
- Always review any proposed code updates to correctness and conciseness.

## Project Overview
