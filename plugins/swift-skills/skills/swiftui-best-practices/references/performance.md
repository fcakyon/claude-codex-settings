# Performance

- Keep conditional modifier values inside the modifier, for example `.opacity(isUnavailable ? 0.4 : 1)`, rather than branching the view with `if`/`else`. Branching produces `_ConditionalContent`, which changes structural identity and recreates the underlying platform views each time the condition flips. Never introduce a `View.if()` helper that conditionally transforms its receiver: it changes structural identity, resets state, and disrupts animations when the condition flips. Report existing helpers with this explanation, but leave their removal to a requested change because they may have many callers.
- If a style ternary fails because its branches have different types, erase each style with `AnyShapeStyle`, for example `.background(isHighlighted ? AnyShapeStyle(.thinMaterial) : AnyShapeStyle(.clear))`. Keep the same view instead of introducing branches. Unlike `AnyView`, `AnyShapeStyle` is not a performance concern; use it only when ordinary type inference cannot handle the ternary.
- Avoid `AnyView` unless absolutely required. Use generics, `Group`, an extracted `View` struct, or a `@ContentBuilder` closure parameter instead.
- If a `ScrollView` has an opaque, static, and solid background, prefer to use `scrollContentBackground(.visible)` to improve scroll-edge rendering efficiency.
- For view extraction, follow the guidance and exceptions in `views.md`.
- Always ensure view initializers are kept as small and simple as possible, avoiding any non-trivial work. Flag any work that can be moved into a `task()` modifier to be run when the view is shown.
- Similarly, assume each view's `body` property is called frequently – if logic such as sorting or filtering can be moved out of there easily, it should be.
- Avoid creating properties to store formatters such as `DateFormatter` unless they are required. A more natural approach is to use `Text` with a format, like this: `Text(Date.now, format: .dateTime.day().month().year())` or `Text(100, format: .currency(code: "USD"))`.
- Avoid expensive inline transforms in `List`/`ForEach` initializers (e.g. `items.filter { ... }`) when they are repeated often.
- Prefer deriving transformed data from the source-of-truth using `let`, or caching in `@State`. However, do not cache derived collections in `@State` unless you also own explicit invalidation logic to avoid stale UI.
- For large data sets in `ScrollView`, use `LazyVStack`/`LazyHStack`; flag eager stacks with many children.
- Prefer using `task()` over `onAppear()` when doing async work, because it will be cancelled automatically when the view disappears.
- Avoid storing escaping `@ContentBuilder` closures on views when possible; store built view results instead.

`@ContentBuilder` requires Xcode 27+ but no minimum iOS. Use `@ViewBuilder` with earlier toolchains; existing uses of that name are not performance findings.

Example:

```swift
// Anti-pattern: stores an escaping closure on the view.
struct CardView<Content: View>: View {
    let content: () -> Content

    var body: some View {
        VStack(alignment: .leading) {
            content()
        }
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(.rect(cornerRadius: 8))
    }
}

// Preferred: store the built view value; the synthesized init handles calling the builder.
struct CardView<Content: View>: View {
    @ContentBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading) {
            content
        }
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(.rect(cornerRadius: 8))
    }
}
```


## Collections and row updates

- Pass each row its element, such as `BookmarkRow(bookmark: bookmark)`. Passing a store and a position or identifier makes the row search the collection, creating a dependency on the entire collection so one element's changes can update all rows.
- If rows own separate observable models, create and retain those models once. Constructing `BookmarkRow(model: BookmarkModel(bookmark: bookmark))` inside `body` or a `ForEach` callback gives every row a different object on each update.
- In a `List` or other lazy container, make each `ForEach` element produce the same number and kind of top-level views every time: normally one view, or a deliberate fixed group, never a count or shape that depends on the element. A bare `if`, `if`/`else`, or `switch` at the top of a row breaks this even when every branch yields one view, because which branch ran becomes part of the row's identity. When the count and kind are constant, SwiftUI derives every row's identity from the element ids alone; when they are not, it runs every row's body on each update to find out, a cost that grows with the list's length. Wrap such content in a container such as `VStack`; `Group` does not count. To leave elements out, filter the collection before `ForEach` instead of using an `if` inside it. The collection can be any size and change freely; the constraint is on what each element produces. A ternary remains right when only modifier values differ.
- To investigate variable row counts in lazy containers, try the launch argument `-LogForEachSlowPath YES`. This logs the affected `ForEach` instances.


## Frequent changes

- Keep rapidly changing measurements, such as scroll positions, geometry, drag coordinates, animation progress, and timer ticks, out of the environment. Each environment write makes SwiftUI inspect the descendant tree, even where no view reads that value.
- Store those measurements in an `@Observable` object and expose separately stored, less frequently changing results, such as `hasReachedEnd`, for views to read. Converting the raw measurement to a Boolean inside `body` still subscribes that view to every raw update.
- Use `scrollTransition()` or `visualEffect()` for scroll-driven appearance changes such as fading, scaling, and rotation; they avoid reevaluating `body`. Keep state when scroll position also drives application logic.
- Remove unread key-path `@Environment` and `@FocusedValue` properties. Their declarations subscribe the view even without a read in `body`. An unused type-based declaration such as `@Environment(LibraryStore.self)` has no runtime overhead, but is still unnecessary code.


## Remote images

- On iOS 27, `AsyncImage` honors HTTP caching headers automatically, including in apps with older deployment targets. Do not introduce an image cache or third-party dependency solely to cache those requests. For additional control with an iOS 27+ target, use `AsyncImage(request:)` with a `URLRequest` cache policy, or supply a session through `asyncImageURLSession()`.
