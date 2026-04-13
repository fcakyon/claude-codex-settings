# Effective Python -- Key Tips

Source: Brett Slatkin, "Effective Python: 125 Specific Ways to Write Better Python" (3rd ed., Addison-Wesley, 2024)
ISBN: 978-0138172183
Item numbers reference the 3rd edition.

Selected items organized by relevance to AI-assisted coding.

## Pythonic Thinking (Chapter 1)

- **Item 2**: Follow the PEP 8 Style Guide
- **Item 4**: Write Helper Functions Instead of Complex Expressions
- **Item 5**: Prefer Multiple-Assignment Unpacking over Indexing
- **Item 7**: Consider Conditional Expressions for Simple Inline Logic
- **Item 8**: Prevent Repetition with Assignment Expressions

## Loops, Iterators, and Dictionaries (Chapters 3-4)

- **Item 17**: Prefer `enumerate` over `range`
- **Item 18**: Use `zip` to Process Iterators in Parallel
- **Item 22**: Never Modify Containers While Iterating over Them
- **Item 24**: Consider `itertools` for Working with Iterators and Generators
- **Item 27**: Prefer `defaultdict` over `setdefault` to Handle Missing Items
- **Item 29**: Compose Classes Instead of Deeply Nesting Dictionaries, Lists, and Tuples

## Functions (Chapter 5)

- **Item 32**: Prefer Raising Exceptions to Returning `None`
- **Item 33**: Know How Closures Interact with Variable Scope and `nonlocal`
- **Item 34**: Reduce Visual Noise with Variable Positional Arguments
- **Item 35**: Provide Optional Behavior with Keyword Arguments
- **Item 36**: Use `None` and Docstrings to Specify Dynamic Default Arguments
- **Item 37**: Enforce Clarity with Keyword-Only and Positional-Only Arguments
- **Item 38**: Define Function Decorators with `functools.wraps`

## Comprehensions and Generators (Chapter 6)

- **Item 40**: Use Comprehensions Instead of `map` and `filter`
- **Item 41**: Avoid More Than Two Control Subexpressions in Comprehensions
- **Item 43**: Consider Generators Instead of Returning Lists
- **Item 44**: Consider Generator Expressions for Large List Comprehensions

## Classes and Interfaces (Chapter 7)

- **Item 48**: Accept Functions Instead of Classes for Simple Interfaces
- **Item 51**: Prefer `dataclasses` for Defining Lightweight Classes
- **Item 53**: Initialize Parent Classes with `super`
- **Item 54**: Consider Composing Functionality with Mix-in Classes
- **Item 55**: Prefer Public Attributes over Private Ones
- **Item 58**: Use Plain Attributes Instead of Setter and Getter Methods

## Robustness and Performance (Chapters 10-11)

- **Item 82**: Consider `contextlib` and `with` Statements for Reusable `try`/`finally` Behavior
- **Item 83**: Always Make `try` Blocks as Short as Possible
- **Item 85**: Beware of Catching the `Exception` Class
- **Item 92**: Profile Before Optimizing
- **Item 106**: Use `decimal` When Precision Is Paramount
