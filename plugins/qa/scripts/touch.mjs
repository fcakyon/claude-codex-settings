// Each gesture is [dx, dy, waitMs] steps from the target's center, named by finger direction. Every dispatch already waits about one frame.
export const gestures = {
  tap: [[0, 0, 60]],
  hold: [[0, 0, 700]],
  holdThenDragUp: [[0, 0, 500], [0, -20, 30], [0, -40, 30], [0, -60, 30], [0, -80, 30]],
  holdThenDragDown: [[0, 0, 500], [0, 20, 30], [0, 40, 30], [0, 60, 30], [0, 80, 30]],
  holdThenDragRight: [[0, 0, 500], [20, 0, 30], [40, 0, 30], [60, 0, 30]],
  swipeRight: [[0, 0, 30], [12, 2, 0], [30, 4, 0], [50, 6, 0], [70, 8, 0]],
  swipeRightJitteryStart: [[0, 0, 30], [4, 9, 0], [20, 12, 0], [40, 14, 0], [60, 16, 0]],
  swipeUp: [[0, 0, 30], [0, -15, 0], [0, -40, 0], [0, -70, 0], [0, -100, 0]],
  swipeDown: [[0, 0, 30], [0, 15, 0], [0, 40, 0], [0, 70, 0], [0, 100, 0]],
  slowSwipeUp: [[0, 0, 30], [0, -10, 120], [0, -25, 120], [0, -45, 120], [0, -70, 120]],
};

export async function emulateTouch(page, {width = 390, height = 844} = {}) {
  await page.setViewportSize({width, height});
  await (await page.context().newCDPSession(page)).send('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 5});
}

export async function touchGesture(page, selector, steps, {observe = () => null, settle = 250, timeout = 5000} = {}) {
  const target = page.locator(selector);
  await target.evaluate(element => {
    element.scrollIntoView({block: 'center', behavior: 'instant'});
    const events = new Set();
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) element.addEventListener(type, event => events.add(event.type), true);
    const start = [];
    for (let node = element; node; node = node.assignedSlot || node.parentElement || node.getRootNode().host) start.push([node, node.scrollLeft, node.scrollTop]);
    window.__qaTouch = {events, start};
  });
  const box = await target.boundingBox();
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  const sample = async () => ({
    ...await page.evaluate(() => {
      if (!window.__qaTouch) throw new Error(`Page navigated to ${location.href} during the touch gesture`);
      const {events, start} = __qaTouch;
      const delta = (key, index) => Math.round(start.reduce((sum, entry) => sum + entry[0][key] - entry[index], 0));
      return {events: [...events], scrolled: {x: delta('scrollLeft', 1), y: delta('scrollTop', 2)}};
    }),
    state: await target.evaluate(observe),
  });
  const cdp = await page.context().newCDPSession(page);
  const send = (type, points) => {
    let timer;
    return Promise.race([
      cdp.send('Input.dispatchTouchEvent', {type, touchPoints: points}),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Touch ${type} got no response in ${timeout} ms. The page may not be rendering frames.`)), timeout); }),
    ]).finally(() => clearTimeout(timer));
  };
  try {
    for (const [index, [dx, dy, wait]] of steps.entries()) {
      await send(index ? 'touchMove' : 'touchStart', [{x: x + dx, y: y + dy}]);
      if (wait) await page.waitForTimeout(wait);
    }
    const during = await sample();
    await send('touchEnd', []);
    await page.waitForTimeout(settle);
    return {during, after: await sample()};
  } finally { await cdp.detach(); }
}
