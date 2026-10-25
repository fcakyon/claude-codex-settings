import assert from 'node:assert/strict';

export async function videoState(page, selector = 'video') {
  return page.locator(selector).last().evaluate(video => ({time: video.currentTime, paused: video.paused, ended: video.ended, width: video.videoWidth, height: video.videoHeight, readyState: video.readyState, frames: video.getVideoPlaybackQuality().totalVideoFrames, protected: Boolean(video.mediaKeys)}));
}

export async function advancingVideo(page, {selector = 'video', timeout = 20000} = {}) {
  const before = await videoState(page, selector);
  await page.waitForFunction(({selector, before}) => {
    const video = [...document.querySelectorAll(selector)].at(-1);
    return video && !video.paused && video.currentTime > before.time + 1 && video.getVideoPlaybackQuality().totalVideoFrames > before.frames;
  }, {selector, before}, {timeout});
  const after = await videoState(page, selector);
  assert.ok(after.width > 0 && after.height > 0, 'Video has no decoded dimensions');
  return {before, after};
}

export async function observeSkip(page, {selector = 'video', start, end, timeout = 20000}) {
  const jump = await page.locator(selector).last().evaluate((video, {start, end, timeout}) => new Promise(resolve => {
    let previous = {time: video.currentTime, at: performance.now()};
    let samples = 0;
    const finish = result => {
      clearTimeout(timer);
      video.removeEventListener('timeupdate', observe);
      resolve(result);
    };
    const observe = () => {
      const current = {time: video.currentTime, at: performance.now()};
      samples++;
      if (current.time >= end) finish(previous.time >= start - 2 && previous.time < start + 1 && current.time - previous.time > (current.at - previous.at) / 1000 + 2 ? {samples, landedAt: current.time} : null);
      previous = current;
    };
    const timer = setTimeout(() => finish(null), timeout);
    video.addEventListener('timeupdate', observe);
  }), {start, end, timeout});
  assert.ok(jump, 'No actual skip across the expected interval was observed');
  return jump;
}
