// Reach a control with real Tab presses, including intervening links and controls.
export async function tabTo(locator, {timeout = 30000} = {}) {
  const page = locator.page();
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await locator.evaluate(el => el.matches(':focus'), undefined, {timeout: Math.max(1, deadline - Date.now())})) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab did not reach ${locator} within ${timeout}ms`);
}
