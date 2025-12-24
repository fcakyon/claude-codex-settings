---
name: playwright-testing
description: This skill should be used when user asks about "Playwright", "responsiveness test", "test with playwright", "test login flow", "file upload test", "handle authentication in tests", or "fix flaky tests".
---

# Playwright Testing Best Practices

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

### Basic Pattern

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

## Locator Strategies

### Priority Order (Best to Worst)

1. **`getByRole`** - Accessible, resilient
2. **`getByLabel`** - Form inputs
3. **`getByPlaceholder`** - When no label
4. **`getByText`** - Visible text
5. **`getByTestId`** - When no better option
6. **CSS/XPath** - Last resort

### Examples

```typescript
// Preferred
await page.getByRole("button", { name: "Submit" }).click();
await page.getByLabel("Email address").fill("user@example.com");

// Acceptable
await page.getByTestId("submit-button").click();

// Avoid
await page.locator("#submit-btn").click();
await page.locator('//button[@type="submit"]').click();
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
  use: {
    storageState: "auth.json",
  },
});
```

### Multi-User Scenarios

```typescript
// Create different auth states
const adminAuth = "admin-auth.json";
const userAuth = "user-auth.json";

test.describe("admin features", () => {
  test.use({ storageState: adminAuth });
  // Admin tests
});

test.describe("user features", () => {
  test.use({ storageState: userAuth });
  // User tests
});
```

## File Upload Handling

### Basic Upload

```typescript
// Single file
await page.getByLabel("Upload file").setInputFiles("path/to/file.pdf");

// Multiple files
await page
  .getByLabel("Upload files")
  .setInputFiles(["path/to/file1.pdf", "path/to/file2.pdf"]);

// Clear file input
await page.getByLabel("Upload file").setInputFiles([]);
```

### Drag and Drop Upload

```typescript
// Create file from buffer
const buffer = Buffer.from("file content");

await page.getByTestId("dropzone").dispatchEvent("drop", {
  dataTransfer: {
    files: [{ name: "test.txt", mimeType: "text/plain", buffer }],
  },
});
```

### File Download

```typescript
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Download" }).click();
const download = await downloadPromise;
await download.saveAs("downloads/" + download.suggestedFilename());
```

## Waiting Strategies

### Auto-Wait (Preferred)

Playwright auto-waits for elements. Use assertions:

```typescript
// Auto-waits for element to be visible and stable
await page.getByRole("button", { name: "Submit" }).click();

// Auto-waits for condition
await expect(page.getByText("Success")).toBeVisible();
```

### Explicit Waits (When Needed)

```typescript
// Wait for navigation
await page.waitForURL("**/dashboard");

// Wait for network idle
await page.waitForLoadState("networkidle");

// Wait for specific response
await page.waitForResponse((resp) => resp.url().includes("/api/data"));
```

## Network Mocking

### Mock API Responses

```typescript
await page.route("**/api/users", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, name: "Test User" }]),
  });
});

// Mock error response
await page.route("**/api/users", async (route) => {
  await route.fulfill({ status: 500 });
});
```

### Intercept and Modify

```typescript
await page.route("**/api/data", async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.modified = true;
  await route.fulfill({ response, json });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
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

### Parallel Execution

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,
});
```

## Debugging Failed Tests

### Debug Tools

```bash
# Run with UI mode
npx playwright test --ui

# Run with inspector
npx playwright test --debug

# Show browser
npx playwright test --headed
```

### Trace Viewer

```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry', // Capture trace on failure
}
```

## Flaky Test Fixes

### Common Causes and Solutions

**Race conditions:**

- Use proper assertions instead of hard waits
- Wait for network requests to complete

**Animation issues:**

- Disable animations in test config
- Wait for animation to complete

**Dynamic content:**

- Use flexible locators (text content, not position)
- Wait for loading states to resolve

**Test isolation:**

- Each test should set up its own state
- Don't depend on other tests' side effects

### Anti-Patterns to Avoid

```typescript
// Bad: Hard sleep
await page.waitForTimeout(5000);

// Good: Wait for condition
await expect(page.getByText("Loaded")).toBeVisible();

// Bad: Flaky selector
await page.locator(".btn:nth-child(3)").click();

// Good: Semantic selector
await page.getByRole("button", { name: "Submit" }).click();
```

## Responsive Design Testing

For comprehensive responsive testing across viewport breakpoints, use the **responsive-tester** agent. It automatically:

- Tests pages across 7 standard breakpoints (375px to 1536px)
- Detects horizontal overflow issues
- Verifies mobile-first design patterns
- Checks touch target sizes (44x44px minimum)
- Flags anti-patterns like fixed widths without mobile fallback

Trigger it by asking to "test responsiveness", "check breakpoints", or "test mobile/desktop layout".
