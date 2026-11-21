# Data flow, shared state, and property wrappers

It is important that SwiftUI body code and logic code be kept separate in order to make code easier to read, write, and maintain. That usually means placing code into methods rather than inline in the `body` property, but often also means carving functionality out into separate `@Observable` classes.

These rules help ensure code is efficient and works well in the long term.


## Shared state

- `@Observable` classes must be marked `@MainActor` unless the project has Main Actor default actor isolation. Otherwise, flag any `@Observable` class missing this annotation.
- All shared data should use `@Observable` classes with `@State` (for ownership) and `@Bindable` / `@Environment` (for passing).
- Strongly prefer not to use `ObservableObject`, `@Published`, `@StateObject`, `@ObservedObject`, or `@EnvironmentObject` unless they are unavoidable, or if they exist in legacy/integration contexts when changing architecture would be complicated.
- Where possible, give custom value types stored by an `@Observable` class `Equatable` conformance. Observation can then skip notifications for assignments equal to the current value. Structs and enums with associated values need explicit conformance; arrays are equatable only when their elements are.

Observation records the stored properties a view accesses. Reading a computed property also records every stored property used by its getter, so a getter does not narrow dependencies. A stored struct is one dependency: if `library.book` is a struct, reading `library.book.title` also subscribes to changes in `library.book.pageCount`. A computed `var bookTitle: String { book.title }` has the same dependency. Tracking just the title requires separating the fields into stored observable properties or making that nested model observable. These structural changes belong in a deep review or an investigation of excessive updates; see `performance-plus.md`.


## Local state

- Always declare view-owned `@State` as `private`. With Xcode 27, `@State` is a macro and retains its initial expression for one-time evaluation only for private properties. Otherwise an expression such as `SearchStore()` runs again whenever the parent reconstructs the view. Recommend correcting existing non-private state, but do not change it unasked: callers may currently supply that value through the initializer.
- Initialize each `@State` property in exactly one place. If `init()` supplies the value, leave the declaration without an initial expression and assign it once in the initializer. Providing both can produce a use-before-initialization diagnostic with Xcode 27; even where it compiles, Apple documents that the declaration's value wins.
- If a view stores a class instance that contains expensive-to-recompute data, e.g. `CIContext`, it can be stored using `@State` even though it is not an observable object. This effectively uses `@State` as a cache – storing something persistently, but not doing any change tracking on it since it's not an observable object.
- Keep window-specific UI state, such as the active tab, displayed record, or navigation path, in scene-root `@State` or `@SceneStorage`. In apps that support multiple scenes, `@AppStorage`, singletons, and shared observable models couple separate windows: iPad and iPhone Duo's inner display can host two app windows, which must be able to navigate independently.


## Bindings

- Prefer bindings projected from `@State`, `@Binding`, or `@Bindable`, including key-path bindings, over `Binding(get:set:)` in `body`. Closure bindings can add allocations and comparison problems that cause unnecessary updates. For conversions or lookups, expose a writable computed model property such as `$model.distanceInMiles`; for a parameterized lookup, use a labeled subscript such as `$model[quantityFor: product]`.
- Preserve behavior when refactoring bindings. A setter handles writes through that binding, including equal-value assignments; `onChange()` responds to observed value changes, including programmatic changes. Do not substitute one for the other without checking effects. Leave a custom binding intact when an equivalent replacement is unclear.
- If the user needs to enter a number into a `TextField`, bind the `TextField` to a numeric value such as `Int` or `Double`, then use its `format` initializer like this: `TextField("Enter your score", value: $score, format: .number)`. Apply either `.keyboardType(.numberPad)` (for integers) or `.keyboardType(.decimalPad)` (for floating-point numbers) as appropriate. Using the modifier alone is *not* sufficient.


## Working with data

- Prefer to make structs conform to `Identifiable` rather than using `id: \.someProperty` in SwiftUI code.
- Never attempt to use `@AppStorage` inside an `@Observable` class, even if marked `@ObservationIgnored` – it will *not* trigger view updates when a change happens.
- In mutable collections displayed by `ForEach`, `List`, or `Table`, identity must come from the element. Indices and offsets describe positions, so inserts, deletes, moves, and filtering can reset row state and disrupt animations. Avoid `ForEach(books.indices, id: \.self)` and `enumerated()` identified by `\.offset`. `ForEach(books.enumerated(), id: \.element.id)` is correct on iOS 26+, and `ForEach(Array(books.enumerated()), id: \.element.id)` below that; fixed ranges and constant collections are not a problem.
- Allocate an element's identity when storing the element, not while evaluating `body`. For example, mapping labels to fresh `Bookmark` values inside `ForEach` recreates every row if each initializer generates a UUID. A stored `let id = UUID()` is valid when its containing value survives body evaluations in `@State` or a model.
- Use a compact, immutable key to identify objects. Avoid `id: \.self` for a full struct, which hashes every field for every row on updates; reserve it for small unique values such as integers, UUIDs, URLs, or short strings. Do not derive identity from editable fields, such as `var id: String { caption }`: changing the caption then replaces the row and loses focus or selection.


## SwiftData

- If you only need the number of items matching a query, consider `ModelContext.fetchCount()` with a fetch descriptor. This will *not* live update if the data changes unless something else triggers the update, such as `@Query`, so it should be used carefully.

For more help with SwiftData, suggest the [SwiftData Pro agent skill](https://github.com/twostraws/swiftdata-agent-skill).

## If the project uses SwiftData with CloudKit

- Never use `@Attribute(.unique)`.
- Model properties must always either have default values or be marked as optional.
- All relationships must be marked optional.
