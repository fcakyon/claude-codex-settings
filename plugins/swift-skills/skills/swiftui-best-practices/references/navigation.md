# Navigation and presentation

- Use `NavigationStack` or `NavigationSplitView` as appropriate; flag all use of the deprecated `NavigationView`.
- Strongly prefer to use `navigationDestination(for:)` to specify destinations; flag all use of the old `NavigationLink(destination:)` pattern where it should be replaced.
- Never mix `navigationDestination(for:)` and `NavigationLink(destination:)` in the same navigation hierarchy; it causes significant problems.
- Register `navigationDestination(for:)` once per data type within each navigation stack; flag competing registrations in the same stack. Independent stacks, including those in separate tabs, can each register the same type.


## Alerts, confirmation dialogs, and sheets

- Attach `confirmationDialog()` to its triggering control so Liquid Glass animates from the right source. An action inside `ToolbarOverflowMenu` is the exception: the system owns that menu, so a dialog attached to a button inside it never appears, even though the button's action runs. Attach it to a view outside the menu and drive presentation with state.
- When building with Xcode 27 or later, use `alert(_:item:)` or `confirmationDialog(_:item:)` when presentation concerns one optional value, such as a pending removal. The optional supplies the unwrapped value to the closures and becomes `nil` on dismissal, without requiring `Identifiable`. This removes the separate Boolean and `presenting:` value, much as `sheet(item:)` does. These overloads are compiled into the app and support iOS 15 onward, or iOS 16 when the title is a `LocalizedStringResource`, without an availability check.
- If an alert has only a single "OK" button that does nothing but dismiss the alert, it can be omitted entirely: `.alert("Dismiss Me", isPresented: $isShowingAlert) { }`.
- If a sheet is designed to present an optional piece of data, prefer `sheet(item:)` over `sheet(isPresented:)` so the optional is safely unwrapped.
- When using `sheet(item:)` with a view that accepts the item as its only initializer parameter, prefer `sheet(item: $someItem, content: SomeView.init)` over `sheet(item: $someItem) { someItem in SomeView(item: someItem) }`.
