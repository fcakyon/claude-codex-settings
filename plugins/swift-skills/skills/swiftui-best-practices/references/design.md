# Design

## Creating a uniform design in this app

Prefer to place standard fonts, sizes, colors, stack spacing, padding, rounding, animation timings, and more into a shared enum of constants, so they can be used by all views. This allows the app's design to feel uniform and consistent, and be adjusted easily.


## Requirements for flexible, accessible design

- Never rely on `UIScreen.main`. For available space, prefer `containerRelativeFrame()`, `visualEffect()`, or, when necessary, `GeometryReader`; for pixel scale, read `@Environment(\.displayScale)`. iPhone Duo has two displays, making a single main screen an invalid assumption, and the property is deprecated from iOS 26.
- Prefer flexible frames unless a fixed size can comfortably hold the content. Where an arrangement might run out of room, use `ViewThatFits` to attempt the preferred layout and then a smaller-space alternative, such as a horizontal control row followed by a vertical arrangement. Account for longer translations, larger Dynamic Type, and narrower windows.
- On iOS 26+, use `ConcentricRectangle()` for shapes next to a screen or sheet boundary, allowing their corners to follow the container. A fixed radius cannot match iPhone Duo's outer display, whose four corners differ. Shapes farther from these boundaries can continue using `.rect(cornerRadius:)`.
- Preserve access to the same features at every window size. Flag functionality gated to regular size classes or controls dropped from compact layouts: folding iPhone Duo must not make a feature disappear. Additional width can expose more of an existing hierarchy, such as list and detail together, without changing what the app can do.
- Apple's minimum acceptable tap area for interactions on iOS is 44x44. Ensure this is strictly enforced.


## Standard system styling

- Strongly prefer to use `ContentUnavailableView` when data is missing or empty, rather than designing something custom.
- When using `searchable()`, you can show empty results using `ContentUnavailableView.search` and it will include the search term they used automatically – there's no need to use `ContentUnavailableView.search(text: searchText)` or similar.
- If you need an icon and some text placed horizontally side by side, prefer `Label` over `HStack`.
- Prefer system hierarchical styles (e.g. secondary/tertiary) over manual opacity when possible, so the system can adapt to the correct context automatically.
- When using `Form`, wrap controls such as `Slider` in `LabeledContent` so the title and control are laid out correctly.
- `LabeledContent` also works outside `Form` for any title-value display; it might be necessary to define a custom `LabeledContentStyle` for consistent layout across views.
- When using `RoundedRectangle`, the default rounding style is `.continuous` – there is no need to specify it explicitly.


## Ensuring designs work for everyone

- Use `bold()` instead of `fontWeight(.bold)`, because using `bold()` allows the system to choose the correct weight for the current context.
- Only use `fontWeight()` for weights other than bold when there's an important reason - scattering around `fontWeight(.medium)` or `fontWeight(.semibold)` is counterproductive.
- Avoid hard-coded values for padding and stack spacing unless specifically requested.
- Avoid UIKit colors (`UIColor`) in SwiftUI code; use SwiftUI `Color` or asset catalog colors.
- The font size `.caption2` is extremely small, and is generally best avoided. Even the font size `.caption` is on the small side, and should be used carefully.
