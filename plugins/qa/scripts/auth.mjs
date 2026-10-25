export async function signIn(qa, page) {
  const {auth} = qa.config;
  if (!auth) throw new qa.Blocked('Configure the project sign-in journey');
  const username = await qa.secret(auth.usernameEnv);
  const context = page.context();
  const current = await context.request.get(auth.profileUrl);
  const profile = current.ok() ? await current.json() : null;
  if (profile?.[auth.identityField] === username) return {reused: true};
  if (profile) throw new qa.Blocked('The QA profile contains a different signed-in account. Use the configured QA account.');
  await page.goto(auth.loginUrl);
  await page.locator(auth.usernameSelector).fill(username);
  await page.locator(auth.passwordSelector).fill(await qa.secret(auth.passwordEnv));
  const response = page.waitForResponse(result => new URL(result.url()).pathname === new URL(auth.loginEndpoint).pathname && result.request().method() === 'POST');
  await page.locator(auth.submitSelector).click();
  const login = await response;
  if (login.status() === 429) throw new qa.Blocked('Login is rate-limited. Wait for the server cooldown before another login attempt.');
  qa.assert.ok(login.ok(), 'Login request failed');
  await page.waitForURL(auth.successUrl, {timeout: 30000});
  const result = await context.request.get(auth.profileUrl);
  qa.assert.equal(result.status(), 200, 'Signed-in profile request failed');
  qa.assert.equal((await result.json())?.[auth.identityField], username, 'Login did not create a session for the QA account');
  return {reused: false};
}
