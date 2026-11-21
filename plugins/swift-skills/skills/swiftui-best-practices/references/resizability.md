# Resizable windows and adaptive layouts

Treat window dimensions as changeable throughout a scene's lifetime. iPad supports freely resized windows; iPhone Duo, Apple's folding iPhone, changes the app's available space as it opens and closes. Its outer display is broader and considerably shorter than other iPhones, while its larger inner display has a central fold. Most guidance below applies across devices. Rules marked iOS 27.1+ require that deployment target or an `if #available(iOS 27.1, *)` branch.

Do not introduce newer layout APIs solely to modernize working code. Recommend additions only for requested behavior or a concrete layout problem; apply them within the user's requested scope. Keep deployment targets unchanged, and preserve an older-system fallback when adding an availability branch.

Strongly recommend Xcode 27 or newer, preferably 27.1. Builds made with Xcode 26 run on iPhone Duo in a conventional iPhone-shaped compatibility area; Xcode 27.0 expands inner-display use, and Xcode 27.1 enables the full display and vertical bars.


## Choosing layouts

- Base layout choices on `@Environment(\.horizontalSizeClass)` and `@Environment(\.verticalSizeClass)`, not device idiom or orientation. iPhone Duo identifies as a phone but changes from compact outer-display width to regular width and height inside; neither `UIDevice.current.userInterfaceIdiom` nor rotation describes the available layout space.
- Test for `== .regular` when choosing an expanded layout. Size classes are optional, so `!= .compact` incorrectly treats `nil` as spacious.
- Flag forced size-class overrides, such as `.environment(\.verticalSizeClass, .regular)`, for review. They prevent descendants from responding to real window changes; Apple warns that they are likely to interfere with adaptation, rather than forbidding every use.
- A portrait-only orientation policy does not guarantee a narrow window. iPhone Duo's inner display supplies regular width and height regardless of the app's supported rotations.
- Give screens that assume everything fits, such as account setup, purchase screens, and introductions, scrolling or a `ViewThatFits` fallback. iPhone Duo's outer display is wide and short, nearer a square than other iPhones, so a layout sized for a tall phone can push its bottom actions out of reach.
- Folding resizes the current scene without relaunching the app or changing `scenePhase`; it needs no dedicated save/restore flow. When size classes select different view hierarchies, keep selections and navigation paths above the branch. State inside a replaced hierarchy loses its view identity and resets.
- With two windows open, closing the device keeps the most recently used window active and backgrounds the other. Existing background-save logic should expect that transition.


## Safe areas

- Remove padding that imitates a system safe-area inset, such as a fixed bottom gap intended to clear the home indicator. SwiftUI already respects that boundary, and its size varies. Do not substitute `safeAreaPadding()` for the guessed inset: that adds a design margin, which is appropriate only when additional spacing is intentional.
- When interactive or readable content must extend beyond a safe area, specify the intended edges, for example `.ignoresSafeArea(edges: .top)`. Unqualified `ignoresSafeArea()` is appropriate for decoration such as backgrounds, gradients, images, and scrims; on content it can put text and controls beneath system bars, including vertical ones.
- On iOS 26+, attach custom control bars with `safeAreaBar()` instead of layering them in a `ZStack` or overlay and guessing clearance with padding. It reserves space and supplies the system scroll-edge treatment for readable content underneath. Use `safeAreaInset()` for other pinned content, such as notices, or as the bar fallback on earlier targets. Pure decoration needs neither modifier.
- On iOS 26+, extend imagery behind sidebars, inspectors, or vertical bars with `backgroundExtensionEffect()`. Its mirrored, blurred extension preserves the visible original image, whereas `ignoresSafeArea()` can conceal part of it behind the bar. Apple recommends using one extension per screen.


## Tab bars and toolbars

- When creating tabs, navigation, and toolbars, prefer `TabView` and system toolbars to get the best system-native experience. iPhone Duo can combine them into a vertical outer-display bar; custom bars do not automatically relocate, overflow, or clear cameras, and no API adds those behaviors. If a custom bar is necessary, position it using `toolbarVerticalEdge` and reserved-region geometry on supported systems.
- Supply both text and an icon for each tab and toolbar action, such as `Button("Compose", systemImage: "square.and.pencil", action: compose)`. Vertical bars show icons, while overflow menus also show titles. Title-only or custom-view items don't join the vertical bar.
- Follow the semantic toolbar placement rules in `api.md`. Vertical bars arrange actions by purpose, not by a horizontal leading/trailing position.
- In `NavigationSplitView`, attach toolbar declarations to the column whose content they control. Only detail-column actions migrate to the vertical bar; sidebar and content-column actions remain above their respective columns.
- iOS 27.1+, iPhone Duo: read `@Environment(\.toolbarVerticalEdge)` when aligning custom UI to the bar. Its side follows device orientation and does not mirror with right-to-left languages, so a fixed edge is unreliable. The value is `nil` in contexts that never use a vertical bar.
- iOS 27.1+, iPhone Duo: use `axisBehavior(.horizontalOnly)` sparingly to keep an item horizontal; retaining a top bar consumes content height. `.verticalPreferred` instead favors the vertical bar when both bars exist.
- iOS 27.1+: report `toolbarVerticalBehavior(.disabled)` except where horizontal bars genuinely serve better: a sheet with only a Done/Close action, a full-width interface concentrated at the bottom, such as a dialing pad or calculator, or a full-screen video player with toolbar controls. Treat the choice as fixed rather than toggled at runtime. Preserve the default vertical adaptation elsewhere, and never propose adding this opt-out.
- Only recommend `toolbarVerticalCompressionBehavior(.prefersToolbarItems)` when a requested iPhone Duo layout should prioritize actions over tabs, or testing identifies a problem with action visibility. It requires an iOS 27.1+ target or a guarded branch with an older-system fallback. Tabs normally take precedence in the shared vertical bar, pushing actions into overflow; this modifier preserves the actions and condenses tabs into one control, which can suit focused workflows such as composing a document.
- iOS 27+: to turn tabs into a sidebar on wide iPhone layouts, including iPhone Duo's inner display, combine `.tabViewStyle(.sidebarAdaptable)` with `.defaultTabBarPlacement(.sidebar)`. This conversion is not automatic on iPhone.


## Presentations

- Prefer system sheets with `presentationDetents()`, popovers, and alerts. They adjust around the fold; a custom sheet assembled from a `ZStack`, offsets, and a drag gesture does not gain that behavior.
- Only recommend `.presentationPlacement(.trailing)` or `.leading` when side placement is requested or a sheet obscures content that needs to remain visible. It requires an iOS 27+ target or a guarded branch retaining the existing presentation on older systems. This suits wide iPad windows and iPhone Duo's inner display, where sheets otherwise appear centrally. The modifier applies only to sheets.
- Use `inspector(isPresented:content:)` for an adjacent settings or detail panel. It becomes a trailing column at regular width and a sheet at compact width, replacing separate hand-built panel and sheet hierarchies.


## Fold and camera geometry

These APIs require iOS 27.1+.

- Add reserved-region handling only when a requested full-screen custom layout must avoid the fold or cameras, or testing reveals an overlap. System containers already account for these regions. Require an iOS 27.1+ target or a guarded branch preserving the older layout. Read `reservedRegions(kind: .division)` for the fold or `reservedRegions(kind: .occlusion)` for cameras from a `GeometryProxy`, obtained through `GeometryReader` or `onGeometryChange()`. Use each region's `frame` and check `isActive`; the fold becomes relevant when partly folded. Do not hardcode dimensions or positions. Frames already account for right-to-left mirroring.
- Keep controls clear of active camera regions, where touches are suppressed. The outer camera always reserves space; the inner camera occludes content only while being used.
- Consider `ArrangementView` only for a requested adaptive primary/secondary layout or a demonstrated resizing or fold problem with an existing pair, such as a document with notes or a video with a transcript. Require an iOS 27.1+ target or a guarded branch preserving the older layout. `.arrangementViewStyle(.split)` chooses side-by-side or stacked placement; `.split.axes(.horizontal)` limits the allowed direction. `.arrangementViewStyle(.overlay)` layers the primary above the secondary, then separates them across a partial fold. This works on all iPhones and iPads running iOS 27.1, but is not a general replacement for stacks.
- Keep `NavigationStack`, `NavigationSplitView`, and `TabView` outside the `ArrangementView`, wrapping it rather than appearing within its two children. Never nest an `ArrangementView` in a `ScrollView` or `List`.
- Ensure essential secondary content has another access route. When the allowed split cannot fit, only the primary remains, as can happen on the outer display in landscape. `layoutPriority()` determines which content survives when space is insufficient.
- Inside an arrangement, read `@Environment(\.splitArrangementAxis)` to adapt to the split direction. In an overlay arrangement, the primary's `@Environment(\.overlayArrangementZIndex)` is 1 while above the secondary and 0 after separation around the fold. Neither environment value indicates whether the other child is hidden.
- Reserve `onHingeChange()` for effects or interactions tied to hinge movement; it reports angle and status. Layout decisions belong to size classes, reserved regions, and `ArrangementView`. Angles range from 180 (fully open) to 0 (fully closed), currently with individual degree accuracy. This is system policy, and may change in the future.
- Do not plan simultaneous app content on both displays. The outer display cannot host the app's content while the device is open, except for a camera app during capture.


## Checking changes

For iPhone Duo work, inspect every screen, sheet, and popover on both displays in all rotations. Include vertical bars, controls near a partial fold, Split View on either side, and a right-to-left language. Folding and rotation in the simulator require manual Device Hub interaction. Check the outer-display cases available to you, then ask the user to cover the remaining manual cases and state which were not tested.
