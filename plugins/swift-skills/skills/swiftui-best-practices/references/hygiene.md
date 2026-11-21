# Hygiene

- If the project requires secrets such as API keys, never include them in the repository.
- Code comments and documentation comments should be present where the logic isn't self-evident.
- Unit tests should exist for core application logic. UI tests only where unit tests are not possible.
- `@AppStorage` must never be used to store usernames, passwords, or other sensitive data. Use the keychain for that.
- If SwiftLint is configured, it should return no warnings or errors.
- Report a missing launch-screen declaration. Check for `UILaunchScreen` in Info.plist, `INFOPLIST_KEY_UILaunchScreen_Generation`, or an existing launch-screen storyboard configuration. App Store Connect rejects iOS 27 SDK builds without a launch screen. Leave project-setting changes to the developer rather than fixing this automatically.
- Flag `UIRequiresFullScreen` in Info.plist: with the iOS 27 SDK, it no longer prevents resizing, so code relying on it must adapt, including during iPhone Duo folds. Do not delete it or introduce `UIRequiresFullScreenIgnoredStartingWithVersion` without a request; either changes app behavior.
- If the Xcode MCP is configured, prefer its tools over generic alternatives. For example, `RenderPreview` is able to capture images of rendered SwiftUI previews for examination, and `DocumentationSearch` can search Apple's documentation for latest usage instructions.
