# Using modern SwiftUI API

Many older SwiftUI declarations use `deprecated: 100000.0` in their SDK availability attributes. These are soft deprecations: Xcode stays quiet, so a warning-free build does not establish that the code uses current API. Review the source, and inspect a symbol's `@available` declaration in the SDK when its status is unclear.

Also check the Dynamic Type deprecations in `accessibility.md` and animatable modifier deprecations in `views.md`.

- Always use `foregroundStyle()` instead of `foregroundColor()`.
- Replace soft-deprecated `accentColor()` with `tint()`. Configure the asset catalog's accent color for an app-wide default.
- Always use `clipShape(.rect(cornerRadius:))` instead of `cornerRadius()`.
- Always use the `Tab` API instead of `tabItem()`.
- Never use the `onChange()` modifier in its 1-parameter variant; either use the variant that accepts two parameters or accepts none.
- For sizing and positioning, prefer `containerRelativeFrame()`, `visualEffect()`, or the `Layout` protocol to `GeometryReader` when they can do the job. To keep content clear of safe areas, rely on SwiftUI's default insets rather than measuring them. Pin real bar content with `safeAreaInset()` or `safeAreaBar()` (iOS 26+), which reserve space as well as placing it, and use `safeAreaPadding()` only for intentional extra spacing inside the safe area. All of these adapt when bars move, including iPhone Duo's vertical bar. Reading reserved regions on iOS 27.1+ is a valid exception: locating the fold or cameras requires a `GeometryProxy` supplied by `GeometryReader` or `onGeometryChange()`. Do not flag that usage.
- Use `toolbarVisibility()` in place of `toolbar(_:for:)` with a visibility or `navigationBarHidden()`, and `toolbarBackgroundVisibility()` in place of the visibility overload of `toolbarBackground(_:for:)`. The older names became soft-deprecated with the iOS 18 renames. For example, `.toolbarVisibility(.visible, for: .navigationBar)`. Keep `toolbarBackground()` when it supplies a background style.
- On iOS 27+, control status bar visibility through `toolbarVisibility(_:for:)` with `.statusBar`; `statusBarHidden()` is soft-deprecated there. Keep the older modifier for targets below iOS 27, where there is no replacement.
- Replace soft-deprecated `colorScheme()` with an environment override, such as `.environment(\.colorScheme, .light)`. Despite Apple's rename annotation, `preferredColorScheme()` is not equivalent: it affects the entire screen or sheet, whereas the environment override preserves the original view-and-descendants scope.
- Prefer `textInputAutocapitalization()` and `autocorrectionDisabled()` to the soft-deprecated `autocapitalization()` and `disableAutocorrection()`.
- Define a named coordinate space with `.coordinateSpace(.named("canvas"))`, replacing soft-deprecated `coordinateSpace(name:)`. Lookups still use `frame(in: .named("canvas"))`.
- Obtain color components with `color.resolve(in:)`, passing the relevant environment. It resolves red, green, blue, and opacity correctly for appearances such as light and dark mode without UIKit. Avoid soft-deprecated `Color.cgColor`, which returns `nil` for dynamic colors, including asset colors.
- With Xcode 27+, use `@ContentBuilder` for newly written view builders. SwiftUI now uses this name throughout most of its declarations; `@ViewBuilder` names the same type, so existing uses need no change and are not findings. This is a compiler/SDK requirement, with no deployment-target restriction.
- When designing haptic effects, prefer using `sensoryFeedback()` over older UIKit APIs such as `UIImpactFeedbackGenerator`.
- Use the `@Entry` macro to define custom `EnvironmentValues`, `FocusedValues`, `Transaction`, and `ContainerValues` keys. This replaces the legacy pattern of manually creating a type conforming to (for example) `EnvironmentKey` with a `defaultValue`, then extending `EnvironmentValues` with a computed property.
- An `@Entry` default must remain equal across reads. Constructing a reference instance such as `LibraryStore()`, a current date such as `.now`, or a fresh `UUID()` produces a new default each time, causing readers to update on unrelated environment changes. Prefer an optional entry without an explicit default, such as `@Entry var library: LibraryStore?`, or a shared `static let` fallback. Xcode 27 diagnoses reference-type defaults, but misses some changing value types; adding `Equatable` does not stabilize a changing value. Leave constant defaults such as `true`, `1`, or `.orange` alone.
- For custom environment or focused actions, pass a struct or `@Observable` instance containing the required data and a method, optionally `callAsFunction()`. A stored closure cannot be compared, so readers update even without a meaningful change; Xcode 27 warns about this. Putting that closure in a struct still has the same problem. System-provided actions, including `\.dismiss` and `\.openURL`, need no replacement.
- When `overlay()`, `background()`, or `mask()` receives a view, use its builder closure rather than its soft-deprecated view-argument overload: `.mask { Image(systemName: "star.fill") }`. Some argument forms also fail in Xcode 27 because `blendMode` becomes ambiguous; for example, write `.overlay { Color.orange.blendMode(.multiply) }`. Style overloads remain correct, including `.background(.indigo)` and `.background(.indigo, in: .rect(cornerRadius: 12))`.
- Never use deprecated `.navigationBarLeading` or `.navigationBarTrailing`. Prefer placements that express purpose: `.cancellationAction` for canceling, `.confirmationAction` for confirming, and `.primaryAction` for the screen's main action. Use `.topBarLeading` or `.topBarTrailing` when no semantic role fits. This lets each device position items correctly, particularly iPhone Duo's vertical bar, which sorts by role rather than leading or trailing side.
- Prefer to rely on automatic grammar agreement when dealing with English, French, German, Portuguese, Spanish, and Italian. For example, use `Text("^[\(people) person](inflect: true)")` to show a number of people.
- You can fill and stroke a shape with two chained modifiers; you do *not* need an overlay for the stroke. The overlay was required previously, but this is fixed in iOS 17 and later.
- When referencing images from an asset catalog, prefer the generated symbol asset API when the project is configured to use them: `Image(.avatar)` rather than `Image("avatar")`.
- When targeting iOS 26 and later, SwiftUI has a native `WebView` view type that replaces almost all uses of hand-wrapped `WKWebView` inside `UIViewRepresentable`. To use it, make sure to include `import WebKit`.
- iOS 26+: `ForEach` over an `enumerated()` sequence should not convert to an array first; use `ForEach(items.enumerated(), id: \.element.id)` directly. The `RandomAccessCollection` conformance that allows this is gated to iOS 26, so earlier targets keep `ForEach(Array(items.enumerated()), id: \.element.id)`.
- When hiding scroll indicators, use `.scrollIndicators(.hidden)` rather than `showsIndicators: false` in the initializer.
- Never concatenate `Text` values or construct a `Text` label by adding strings. For example, use `Text("Folder: \(folderName)")` instead of `Text("Folder: " + folderName)`: interpolation retains a localization key, while string addition produces a plain `String` whose literal prefix is not localized.

For example, the usage of `+` here is bad and deprecated:

```swift
Text("Hello").foregroundStyle(.red)
+
Text("World").foregroundStyle(.blue)
```

Instead, use text interpolation like this:

```swift
let red = Text("Hello").foregroundStyle(.red)
let blue = Text("World").foregroundStyle(.blue)
Text("\(red)\(blue)")
```


## Toolbars

These APIs require iOS 27 or later unless a different requirement is stated.

- Use `ToolbarOverflowMenu` for overflow actions. When toolbar items do not fit, the system now moves them into an overflow menu of its own; a custom ellipsis `Menu` then becomes a nested submenu, while `ToolbarOverflowMenu` contributes its actions directly. This applies on all devices, with especially little room on iPhone Duo where status, toolbar, and tabs occupy the same edge.
- A menu devoted to one task, such as filtering, can legitimately become a submenu, although it takes another tap to reach. Give it a descriptive SF Symbol rather than an ellipsis, and use `visibilityPriority(.high)` when it should remain in the bar.
- Assign `.high` visibility priority to frequent actions and items conveying status, and `.low` to expendable items. Without priorities, overflow starts at the trailing end without considering importance. Prioritization is particularly useful on iPhone Duo's outer display, which fits few items.
- Reserve `.topBarPinnedTrailing` for at most one indispensable action. It stays at the far trailing position, after the overflow control, and moves into the overflow menu only when search is active and room runs out; pinning multiple items undermines adaptive overflow.
- Consider `.toolbarMinimizationBehavior(.onScrollDown, for: .navigationBar)` for content-led screens such as articles or long lists. It shrinks a horizontal navigation bar during downward scrolling, along with an integrated top tab bar. iPhone Duo's vertical bar does not shrink. The iOS 26 tab bar equivalent is `.tabBarMinimizeBehavior(.onScrollDown)`.
- Apply `contentMarginsRemoved()` to the `ToolbarItem` holding custom imagery when the glass should fit the image. Default margins otherwise produce an oversized pill around an image button or a glass border around a standalone image. Keep standard margins on ordinary buttons.
- On any supported version, place related controls, such as previous and next actions, in a `ToolbarItemGroup` instead of separate items divided by fixed spacers. The group adapts its spacing and, where supported, accepts one visibility priority for the whole set.
- With Xcode 27+, a `ForEach` may generate items directly within `toolbar()`, replacing the need to spell out each item on older toolchains. This works with deployment targets back to iOS 16 without a runtime availability branch.
- Xcode 27.2+ and iOS 26.4+: toggle a toolbar item's `.hidden()` modifier instead of conditionally creating the item. For example, `ToolbarItem { Button("Export", systemImage: "square.and.arrow.up", action: export) }.hidden(!canExport)`. This rule is unavailable when building with Xcode 27.1; do not recommend it for that toolchain.


## Using ObservableObject

If using `ObservableObject` is absolutely required – for example if you are trying to create a debouncer using a Combine publisher – you should always make sure `import Combine` is added. This was previously provided through SwiftUI, but that is no longer the case.
