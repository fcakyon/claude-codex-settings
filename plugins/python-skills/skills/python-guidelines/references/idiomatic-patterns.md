# Idiomatic Python Patterns

Sources:

- PEP 8: https://peps.python.org/pep-0008/
- PEP 20: https://peps.python.org/pep-0020/
- Google Python Style Guide: https://google.github.io/styleguide/pyguide.html
- Effective Python, 3rd ed. (Brett Slatkin, Addison-Wesley, 2024, ISBN 978-0138172183)

Each pattern notes its primary source. Item numbers reference the 3rd edition.

## 1. Enumerate over indexing

Source: Effective Python Item 17, PEP 279

```python
# No
for i in range(len(items)):
    print(i, items[i])

# Yes
for i, item in enumerate(items):
    print(i, item)
```

## 2. Zip for parallel iteration

Source: Effective Python Item 18

```python
# No
for i in range(min(len(names), len(colors))):
    print(names[i], colors[i])

# Yes
for name, color in zip(names, colors):
    print(name, color)
```

## 3. Reversed for backward loops

Source: PEP 322

```python
# No
for i in range(len(items) - 1, -1, -1):
    print(items[i])

# Yes
for item in reversed(items):
    print(item)
```

## 4. List comprehensions over map/filter

Source: Effective Python Item 40, PEP 202

```python
# No
result = list(map(lambda x: x * 2, filter(lambda x: x > 0, items)))

# Yes
result = [x * 2 for x in items if x > 0]
```

## 5. Generator expressions for large data

Source: Effective Python Item 44, PEP 289

```python
# No -- builds entire list in memory
total = sum([x**2 for x in range(10**6)])

# Yes -- lazy evaluation
total = sum(x**2 for x in range(10**6))
```

## 6. Context managers for resources

Source: PEP 343, Effective Python Item 82

```python
# No
f = open("data.txt")
try:
    data = f.read()
finally:
    f.close()

# Yes
with open("data.txt") as f:
    data = f.read()
```

## 7. Keyword arguments for clarity

Source: Effective Python Items 35, 37

```python
# No -- what do these booleans mean?
search("@obama", False, 20, True)

# Yes
search("@obama", retweets=False, count=20, popular=True)
```

## 8. Dataclasses for structured data

Source: PEP 557, Effective Python Item 51

```python
# No
result = (0, 4)  # what are these?

# Yes
from dataclasses import dataclass


@dataclass
class TestResults:
    failed: int
    attempted: int
```

## 9. Tuple unpacking for state

Source: Core Python feature

```python
# No
temp = y
y = x + y
x = temp

# Yes
x, y = y, x + y
```

## 10. str.join over concatenation

Source: PEP 8, Google Style Guide

```python
# No -- O(n^2) string building
s = names[0]
for name in names[1:]:
    s += ", " + name

# Yes -- O(n)
s = ", ".join(names)
```

## 11. defaultdict/Counter for counting

Source: Effective Python Item 27, Python docs collections module

```python
# No
d = {}
for color in colors:
    if color not in d:
        d[color] = 0
    d[color] += 1

# Yes
from collections import Counter

d = Counter(colors)
```

## 12. Helper functions over complex expressions

Source: Effective Python Item 4

```python
# No -- hard to read
value = first if first is not None else (second if second is not None else default)


# Yes
def first_valid(*values, default=None):
    return next((v for v in values if v is not None), default)


value = first_valid(first, second, default=default)
```

## 13. Exceptions over returning None

Source: Effective Python Item 32

```python
# No -- caller can't distinguish None result from error
def divide(a, b):
    if b == 0:
        return None
    return a / b


# Yes
def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

## 14. Generators for lazy sequences

Source: Effective Python Item 43, PEP 255

```python
# No -- builds entire list in memory
def read_lines(path):
    results = []
    with open(path) as f:
        for line in f:
            results.append(line.strip())
    return results


# Yes -- yields one at a time
def read_lines(path):
    with open(path) as f:
        for line in f:
            yield line.strip()
```

## 15. Plain attributes, not getters/setters

Source: Effective Python Item 58, PEP 8

```python
# No -- Java-style boilerplate
class User:
    def __init__(self, name):
        self._name = name

    def get_name(self):
        return self._name

    def set_name(self, name):
        self._name = name


# Yes -- use @property only when you need computed access
class User:
    def __init__(self, name):
        self.name = name
```

## 16. cache/lru_cache for memoization

Source: Python docs functools module, Effective Python Item 38

```python
# No
_cache = {}


def fib(n):
    if n in _cache:
        return _cache[n]
    result = fib(n - 1) + fib(n - 2) if n > 1 else n
    _cache[n] = result
    return result


# Yes (Python 3.9+: use @cache for unbounded, @lru_cache for bounded)
from functools import cache


@cache
def fib(n):
    return fib(n - 1) + fib(n - 2) if n > 1 else n
```

## 17. Functions for simple interfaces

Source: Effective Python Item 48

```python
# No -- single-method class is a function in disguise
class Validator:
    def validate(self, value):
        return value > 0


# Yes
def validate(value):
    return value > 0
```

## 18. No mutable default arguments

Source: Effective Python Item 36, Google Style Guide 2.12

```python
# No -- shared mutable state across calls
def append_to(element, target=[]):
    target.append(element)
    return target


# Yes
def append_to(element, target=None):
    if target is None:
        target = []
    target.append(element)
    return target
```
