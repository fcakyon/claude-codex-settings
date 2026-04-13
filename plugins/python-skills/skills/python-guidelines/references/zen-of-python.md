# The Zen of Python (PEP 20)

Source: https://peps.python.org/pep-0020/
Author: Tim Peters
Status: Active (since 2004)
Run: `python -c "import this"`

Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
Complex is better than complicated.
Flat is better than nested.
Sparse is better than dense.
Readability counts.
Special cases aren't special enough to break the rules.
Although practicality beats purity.
Errors should never pass silently.
Unless explicitly silenced.
In the face of ambiguity, refuse the temptation to guess.
There should be one-- and preferably only one --obvious way to do it.
Although that way may not be obvious at first unless you're Dutch.
Now is better than never.
Although never is often better than _right_ now.
If the implementation is hard to explain, it's a bad idea.
If the implementation is easy to explain, it may be a good idea.
Namespaces are one honking great idea -- let's do more of those!

## Most Applicable Lines

For AI-assisted coding, these are the lines that matter most:

- **Simple is better than complex**: Don't over-engineer. A 5-line function beats a 50-line class hierarchy.
- **Flat is better than nested**: Early returns, list comprehensions, avoid deep if/else nesting.
- **Explicit is better than implicit**: Name things clearly. Don't hide behavior in magic methods or metaclasses.
- **Errors should never pass silently**: No bare `except:`. Let errors surface unless you have a specific reason to catch them.
- **Readability counts**: Code is read far more than it is written. Favor clarity over cleverness.
- **In the face of ambiguity, refuse the temptation to guess**: Ask for clarification rather than assuming.
- **If the implementation is hard to explain, it's a bad idea**: If you can't describe what a function does in one sentence, it's doing too much.
