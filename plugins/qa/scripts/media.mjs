import assert from 'node:assert/strict';
import {open} from 'node:fs/promises';
import {Blocked, command} from './process.mjs';

const monitorEvents = ['seeking', 'waiting', 'stalled', 'error', 'pause'];
const isoRootBoxes = new Set(['ftyp', 'moov', 'mdat', 'free', 'skip', 'wide', 'uuid', 'meta', 'pdin']);

async function runFfprobe(args) {
  let result;
  try {
    result = await command('ffprobe', args);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Blocked('ffprobe is required to inspect media assets');
    throw error;
  }
  assert.equal(result.code, 0, `ffprobe failed: ${result.stderr.trim()}`);
  return JSON.parse(result.stdout || '{}');
}

async function hasMp4Faststart(filePath) {
  const handle = await open(filePath, 'r');
  try {
    const fileSize = (await handle.stat()).size;
    const header = Buffer.alloc(16);
    let offset = 0;
    for (let boxes = 0; boxes < 256 && offset + 8 <= fileSize; boxes++) {
      const toRead = Math.min(16, fileSize - offset);
      const {bytesRead} = await handle.read(header, 0, toRead, offset);
      if (bytesRead < 8) break;
      let size = header.readUInt32BE(0);
      const type = header.toString('ascii', 4, 8);
      if (boxes === 0 && !isoRootBoxes.has(type)) return null;
      if (size === 1) {
        if (bytesRead < 16) break;
        const extended = Number(header.readBigUInt64BE(8));
        if (!Number.isSafeInteger(extended) || extended < 16) break;
        size = extended;
      } else if (size === 0 || size < 8) {
        return type === 'moov' ? true : type === 'mdat' ? false : null;
      }
      if (type === 'moov') return true;
      if (type === 'mdat') return false;
      offset += size;
    }
    return null;
  } finally {
    await handle.close();
  }
}

function circularDrift(a, b, duration) {
  const raw = Math.abs(a - b);
  return Number.isFinite(duration) && duration > 0 ? Math.min(raw, Math.abs(duration - raw)) : raw;
}

async function waitForVideos(page, selector, expectedCount, timeout) {
  await page.waitForFunction(({selector, expectedCount}) => {
    const videos = [...document.querySelectorAll(selector)];
    const enough = expectedCount !== null ? videos.length === expectedCount : videos.length > 0;
    return enough && videos.every(video => video.readyState >= 2);
  }, {selector, expectedCount}, {timeout});
}

async function sampleVideos(page, selector, token, resetBaseline = false) {
  return page.evaluate(({selector, token, resetBaseline}) => {
    const store = token ? window.__qaMediaMonitors?.[token] : null;
    return [...document.querySelectorAll(selector)].map((video, index) => {
      const entry = store?.entries.get(video) || null;
      if (entry) {
        const nowTime = video.currentTime;
        if (resetBaseline) {
          entry.forwardSec = 0;
          entry.lastTime = nowTime;
        } else {
          const delta = nowTime - entry.lastTime;
          const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
          if (delta > 0 && delta < 5) entry.forwardSec += delta;
          else if (delta < 0 && video.loop && dur > 0 && entry.lastTime > dur * 0.5 && nowTime < dur * 0.5) {
            entry.forwardSec += dur - entry.lastTime + nowTime;
          }
          entry.lastTime = nowTime;
        }
      }
      return {
        index,
        isVideo: video.tagName === 'VIDEO',
        instanceId: entry?.id ?? null,
        time: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : null,
        paused: video.paused,
        ended: video.ended,
        muted: video.muted,
        playbackRate: video.playbackRate,
        seeking: video.seeking,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        frames: video.getVideoPlaybackQuality?.()?.totalVideoFrames ?? 0,
        error: video.error ? {code: video.error.code, message: video.error.message || ''} : null,
        counts: entry ? {...entry.counts} : null,
        forwardSec: entry ? entry.forwardSec : 0,
      };
    });
  }, {selector, token, resetBaseline});
}

export function createMediaChecks(check = assert) {
  async function videoState(page, selector = 'video') {
    return page.locator(selector).last().evaluate(video => ({
      time: video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : null,
      paused: video.paused,
      ended: video.ended,
      muted: video.muted,
      playbackRate: video.playbackRate,
      seeking: video.seeking,
      width: video.videoWidth,
      height: video.videoHeight,
      readyState: video.readyState,
      frames: video.getVideoPlaybackQuality?.()?.totalVideoFrames ?? 0,
      protected: Boolean(video.mediaKeys),
      error: video.error ? {code: video.error.code, message: video.error.message || ''} : null,
    }));
  }

  async function advancingVideo(page, {selector = 'video', timeout = 20000} = {}) {
    const before = await videoState(page, selector);
    await page.waitForFunction(({selector, before}) => {
      const video = [...document.querySelectorAll(selector)].at(-1);
      const frames = video?.getVideoPlaybackQuality?.()?.totalVideoFrames ?? 0;
      return video && !video.paused && video.currentTime > before.time + 1 && frames > before.frames;
    }, {selector, before}, {timeout});
    const after = await videoState(page, selector);
    check.equal(after.error, null, 'Video reported a media error');
    check.ok(after.width > 0 && after.height > 0, 'Video has no decoded dimensions');
    return {before, after};
  }

  async function observeSkip(page, {selector = 'video', start, end, timeout = 20000}) {
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
    check.ok(jump, 'No actual skip across the expected interval was observed');
    return jump;
  }

  async function assertPlaybackStability(page, {
    selector = 'video', expectedCount = null, durationMs = 1800, action = null, timeout = 20000,
    maxSeeking = 1, maxWaiting = 1, maxStalled = 0, minAdvanceSec = 0.4, minFrames = 1,
    minReadyState = 3, sync = expectedCount !== null && expectedCount > 1, maxSyncDriftSec = 0.25,
    expectedPlaybackRate = 1,
  } = {}) {
    if (!action) await waitForVideos(page, selector, expectedCount, timeout);

    const token = `qa_media_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await page.evaluate(({selector, token, events}) => {
      const monitors = (window.__qaMediaMonitors ??= {});
      const entries = new Map();
      let nextId = 1;
      const attach = video => {
        if (entries.has(video)) return;
        const counts = Object.fromEntries(events.map(name => [name, 0]));
        const entry = {id: nextId++, counts, listeners: [], lastTime: video.currentTime, forwardSec: 0};
        for (const name of events) {
          const handler = () => { counts[name] += 1; };
          video.addEventListener(name, handler);
          entry.listeners.push([name, handler]);
        }
        const onTimeUpdate = () => {
          const nowTime = video.currentTime;
          const delta = nowTime - entry.lastTime;
          const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
          if (delta > 0 && delta < 5) entry.forwardSec += delta;
          else if (delta < 0 && video.loop && dur > 0 && entry.lastTime > dur * 0.5 && nowTime < dur * 0.5) {
            entry.forwardSec += dur - entry.lastTime + nowTime;
          }
          entry.lastTime = nowTime;
        };
        video.addEventListener('timeupdate', onTimeUpdate);
        entry.listeners.push(['timeupdate', onTimeUpdate]);
        entries.set(video, entry);
      };
      const scan = () => {
        for (const video of document.querySelectorAll(selector)) attach(video);
      };
      scan();
      const observer = new MutationObserver(scan);
      observer.observe(document.documentElement, {childList: true, subtree: true});
      monitors[token] = {entries, observer};
    }, {selector, token, events: monitorEvents});

    let start;
    let end;
    try {
      if (action) {
        await action();
        await waitForVideos(page, selector, expectedCount, timeout);
      }
      start = await sampleVideos(page, selector, token, true);
      await page.waitForTimeout(durationMs);
      end = await sampleVideos(page, selector, token, false);
    } finally {
      await page.evaluate(currentToken => {
        const store = window.__qaMediaMonitors?.[currentToken];
        if (!store) return;
        store.observer.disconnect();
        for (const [video, entry] of store.entries) {
          for (const [name, handler] of entry.listeners) video.removeEventListener(name, handler);
        }
        delete window.__qaMediaMonitors[currentToken];
      }, token).catch(() => {});
    }

    if (expectedCount !== null) check.equal(end.length, expectedCount, `Expected ${expectedCount} videos matching ${selector}`);
    else check.ok(end.length > 0, `Expected at least one video matching ${selector}`);

    const videos = end.map((after, index) => {
      const before = start[index] ?? null;
      const frameDelta = before ? after.frames - before.frames : after.frames;
      return {...after, beforeInstanceId: before?.instanceId ?? null, advancedSec: after.forwardSec, frameDelta};
    });

    for (const video of videos) {
      const label = `Video[${video.index}]`;
      check.ok(video.counts !== null && video.instanceId !== null, `${label} monitor was not attached`);
      check.equal(video.instanceId, video.beforeInstanceId, `${label} element was replaced during stability window`);
      check.equal(video.error, null, `${label} reported a media error`);
      check.equal(video.counts.error, 0, `${label} emitted error events`);
      if (video.isVideo) check.ok(video.width > 0 && video.height > 0, `${label} has no decoded dimensions`);
      check.equal(video.paused, false, `${label} is paused`);
      check.equal(video.ended, false, `${label} ended unexpectedly`);
      check.ok(video.readyState >= minReadyState, `${label} readyState ${video.readyState} below ${minReadyState}`);
      check.ok(video.advancedSec >= minAdvanceSec, `${label} advanced ${video.advancedSec.toFixed(3)}s, expected at least ${minAdvanceSec.toFixed(3)}s`);
      if (video.isVideo) check.ok(video.frameDelta >= minFrames, `${label} rendered ${video.frameDelta} frames, expected at least ${minFrames}`);
      check.ok(video.counts.seeking <= maxSeeking, `${label} seeking count ${video.counts.seeking} exceeded ${maxSeeking}`);
      check.ok(video.counts.waiting <= maxWaiting, `${label} waiting count ${video.counts.waiting} exceeded ${maxWaiting}`);
      check.ok(video.counts.stalled <= maxStalled, `${label} stalled count ${video.counts.stalled} exceeded ${maxStalled}`);
      if (expectedPlaybackRate !== null && !video.muted) {
        check.equal(video.playbackRate, expectedPlaybackRate, `${label} unmuted playbackRate must stay ${expectedPlaybackRate}`);
      }
    }

    let maxDriftSec = 0;
    if (sync && videos.length > 1) {
      const base = videos[0];
      for (let index = 1; index < videos.length; index++) {
        const current = videos[index];
        const duration = Number.isFinite(base.duration) && base.duration > 0
          ? (Number.isFinite(current.duration) && current.duration > 0 ? Math.min(base.duration, current.duration) : base.duration)
          : current.duration;
        const drift = circularDrift(base.time, current.time, duration);
        if (drift > maxDriftSec) maxDriftSec = drift;
      }
      check.ok(maxDriftSec <= maxSyncDriftSec, `Video sync drift ${maxDriftSec.toFixed(3)}s exceeded ${maxSyncDriftSec}s`);
    }

    return {count: videos.length, durationMs, maxDriftSec, videos};
  }

  async function probeMediaAsset(filePath, {
    maxKeyframeIntervalSec = 2.5, requireFaststart = false, requireAudio = false, requireVideo = true,
  } = {}) {
    let faststart = null;
    if (requireFaststart) {
      faststart = await hasMp4Faststart(filePath);
      check.equal(faststart, true, `MP4 moov atom must precede mdat for faststart playback: ${filePath}`);
    }

    const inspectKeyframes = requireVideo && maxKeyframeIntervalSec !== null;
    const [info, packetInfo, checkedFaststart] = await Promise.all([
      runFfprobe([
        '-v', 'error', '-show_entries', 'stream=codec_type,width,height,duration:format=duration',
        '-print_format', 'json', filePath,
      ]),
      inspectKeyframes
        ? runFfprobe([
          '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time,dts_time,flags',
          '-print_format', 'json', filePath,
        ])
        : Promise.resolve(null),
      requireFaststart ? Promise.resolve(faststart) : hasMp4Faststart(filePath),
    ]);
    faststart = checkedFaststart;

    const streams = info.streams || [];
    const videoStream = streams.find(stream => stream.codec_type === 'video');
    const audioStream = streams.find(stream => stream.codec_type === 'audio');
    const durationSec = Number(info.format?.duration ?? videoStream?.duration ?? 0);

    if (requireVideo) {
      check.ok(videoStream && videoStream.width > 0 && videoStream.height > 0, `Missing decoded video stream in ${filePath}`);
    }
    if (requireAudio) {
      check.ok(Boolean(audioStream), `Missing audio stream in ${filePath}`);
    }

    let keyframes = [];
    let maxKeyframeGapSec = null;
    if (videoStream && packetInfo) {
      keyframes = (packetInfo.packets || [])
        .filter(packet => (packet.flags || '').includes('K'))
        .map(packet => Number(packet.pts_time ?? packet.dts_time))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
      if (keyframes.length > 0) {
        maxKeyframeGapSec = 0;
        for (let index = 1; index < keyframes.length; index++) {
          maxKeyframeGapSec = Math.max(maxKeyframeGapSec, keyframes[index] - keyframes[index - 1]);
        }
        if (Number.isFinite(durationSec) && durationSec > keyframes.at(-1)) {
          maxKeyframeGapSec = Math.max(maxKeyframeGapSec, durationSec - keyframes.at(-1));
        }
      } else if (Number.isFinite(durationSec) && durationSec > 0) {
        maxKeyframeGapSec = durationSec;
      }
      if (requireVideo && maxKeyframeIntervalSec !== null) {
        check.ok(keyframes.length > 0, `No video keyframes found in ${filePath}`);
        check.ok(
          maxKeyframeGapSec !== null && maxKeyframeGapSec <= maxKeyframeIntervalSec,
          `Max keyframe gap ${maxKeyframeGapSec?.toFixed(2)}s exceeded ${maxKeyframeIntervalSec}s in ${filePath}`,
        );
      }
    }

    return {
      path: filePath,
      durationSec,
      width: videoStream?.width ?? 0,
      height: videoStream?.height ?? 0,
      hasAudio: Boolean(audioStream),
      keyframeCount: keyframes.length,
      maxKeyframeGapSec,
      faststart,
    };
  }

  async function assertRangeSupport(url, {
    headers = {}, timeoutMs = 30000, expectedContentType = /^(video|audio)\//, rangeBytes = '0-1023', maxBytes = 65536,
  } = {}) {
    const response = await fetch(url, {
      headers: {...headers, Range: `bytes=${rangeBytes}`},
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    try {
      check.equal(response.status, 206, `Media range request for ${url} returned HTTP ${response.status}`);
      const acceptRanges = response.headers.get('accept-ranges') || '';
      const contentRange = response.headers.get('content-range') || '';
      check.match(contentRange, /^bytes\s+\d+-\d+\/(?:\d+|\*)$/i, `Media range response for ${url} missing valid Content-Range header`);
      const contentType = (response.headers.get('content-type') || '').toLowerCase().split(';', 1)[0].trim();
      if (expectedContentType) {
        check.match(contentType, expectedContentType, `Media range response for ${url} returned unexpected Content-Type ${contentType || 'missing'}`);
      }
      let bytesRead = 0;
      const reader = response.body?.getReader();
      if (reader) {
        try {
          while (bytesRead === 0) {
            const {done, value} = await reader.read();
            if (done) break;
            bytesRead += value.byteLength;
            if (bytesRead >= maxBytes) break;
          }
        } finally {
          await reader.cancel().catch(() => {});
        }
      }
      check.ok(bytesRead > 0, `Media range response for ${url} returned empty body`);
      return {status: response.status, contentType, contentRange, acceptRanges, bytesRead};
    } finally {
      await response.body?.cancel().catch(() => {});
    }
  }

  return {videoState, advancingVideo, observeSkip, assertPlaybackStability, probeMediaAsset, assertRangeSupport};
}

const defaults = createMediaChecks();
export const {videoState, advancingVideo, observeSkip, assertPlaybackStability, probeMediaAsset, assertRangeSupport} = defaults;
