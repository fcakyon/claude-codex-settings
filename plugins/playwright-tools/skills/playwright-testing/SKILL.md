---
name: playwright-testing
description: "Write, organize, and debug Playwright end-to-end tests using Page Object Model, accessible locators, auth handling, file uploads, network mocking, and CI integration. Use when the user asks about Playwright testing, responsiveness tests, login flow tests, file upload tests, authentication in tests, or fixing flaky tests."
---

# Playwright Testing Best Practices

## Workflow

1. **Organize tests** using the file structure and naming conventions below.
2. **Write page objects** to encapsulate page interactions.
3. **Choose locators** following the priority order (role-based first).
4. **Handle auth** via storage state for fast, isolated tests.
5. **Debug failures** with UI mode, traces, and the anti-pattern checklist.

## Test Organization

### File Structure

```
tests/
├── auth/
│   ├── login.spec.ts
│   └── signup.spec.ts
├── dashboard/
│   └── dashboard.spec.ts
├── fixtures/
│   └── test-data.ts
├── pages/
│   └── login.page.ts
└── playwright.config.ts
```

### Naming Conventions

- Files: `feature-name.spec.ts`
- Tests: Describe user behavior, not implementation
  - Good: `test('user can reset password via email')`
  - Bad: `test('test reset password')`

## Page Object Model

```typescript
// pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign in" }).click();
  }
}

// tests/login.spec.ts
test("successful login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "password");
  await expect(page).toHaveURL("/dashboard");
});
```

## Locator Strategies (Best to Worst)

1. **`getByRole`** — accessible, resilient
2. **`getByLabel`** — form inputs
3. **`getByPlaceholder`** — when no label exists
4. **`getByText`** — visible text
5. **`getByTestId`** — when no better option
6. **CSS/XPath** — last resort

```typescript
// Preferred
await page.getByRole("button", { name: "Submit" }).click();
await page.getByLabel("Email address").fill("user@example.com");

// Acceptable
await page.getByTestId("submit-button").click();

// Avoid
await page.locator("#submit-btn").click();
```

## Authentication Handling

### Storage State (Recommended)

Save logged-in state and reuse across tests:

```typescript
// global-setup.ts
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: "auth.json" });
  await browser.close();
}

// playwright.config.ts
export default defineConfig({
  globalSetup: "./global-setup.ts",
  use: { storageState: "auth.json" },
});
```

### Multi-User Scenarios

```typescript
const adminAuth = "admin-auth.json";
const userAuth = "user-auth.json";

test.describe("admin features", () => {
  test.use({ storageState: adminAuth });
});

test.describe("user features", () => {
  test.use({ storageState: userAuth });
});
```

## File Upload and Download

```typescript
// Single file upload
await page.getByLabel("Upload file").setInputFiles("path/to/file.pdf");

// Multiple files
await page.getByLabel("Upload files").setInputFiles(["file1.pdf", "file2.pdf"]);

// Drag and drop
const buffer = Buffer.from("file content");
await page.getByTestId("dropzone").dispatchEvent("drop", {
  dataTransfer: { files: [{ name: "test.txt", mimeType: "text/plain", buffer }] },
});

// Download
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Download" }).click();
const download = await downloadPromise;
await download.saveAs("downloads/" + download.suggestedFilename());
```

## Waiting Strategies

```typescript
// Auto-wait (preferred) — Playwright waits automatically for actions and assertions
await page.getByRole("button", { name: "Submit" }).click();
await expect(page.getByText("Success")).toBeVisible();

// Explicit waits (when needed)
await page.waitForURL("**/dashboard");
await page.waitForLoadState("networkidle");
await page.waitForResponse((resp) => resp.url().includes("/api/data"));
```

## Network Mocking

```typescript
// Mock API response
await page.route("**/api/users", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, name: "Test User" }]),
  });
});

// Intercept and modify
await page.route("**/api/data", async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.modified = true;
  await route.fulfill({ response, json });
});
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Run Playwright tests
  run: npx playwright test
  env:
    CI: true
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

```typescript
// playwright.config.ts — parallel execution
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,
});
```

## Debugging Failed Tests

```bash
npx playwright test --ui       # UI mode
npx playwright test --debug    # Inspector
npx playwright test --headed   # Show browser
```

Enable trace capture on failure:

```typescript
// playwright.config.ts
use: { trace: 'on-first-retry' }
```

## Flaky Test Fixes

| Cause | Fix |
|-------|-----|
| Race conditions | Use assertions instead of hard waits; wait for network requests |
| Animation issues | Disable animations in config or wait for completion |
| Dynamic content | Use flexible locators (text, not position); wait for loading states |
| Test isolation | Each test sets up its own state; no cross-test dependencies |

```typescript
// Bad: Hard sleep          →  Good: Wait for condition
await page.waitForTimeout(5000);
await expect(page.getByText("Loaded")).toBeVisible();

// Bad: Flaky selector      →  Good: Semantic selector
await page.locator(".btn:nth-child(3)").click();
await page.getByRole("button", { name: "Submit" }).click();
```

## Responsive Design Testing

For responsive testing across viewport breakpoints, use the **responsive-tester** agent. It automatically tests pages across 7 standard breakpoints (375px to 1536px), detects horizontal overflow, verifies mobile-first patterns, and checks touch target sizes (44x44px minimum).

Trigger by asking to "test responsiveness", "check breakpoints", or "test mobile/desktop layout".
