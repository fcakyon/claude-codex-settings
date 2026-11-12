import {readFile} from 'node:fs/promises';

/** Give a page a scripted microphone and a meter for the audio it plays. Call before the page loads its app. */
export async function captureAudio(page) {
  await page.context().grantPermissions(['microphone']);
  await page.addInitScript(() => {
    const state = window.__qaAudio = {peak: 0, activeMs: 0};
    const meters = new Set();
    const meter = context => {
      const analyser = context.createAnalyser();
      analyser.samples = new Float32Array(analyser.fftSize);
      meters.add(analyser);
      return analyser;
    };
    // One clock reads every meter, so overlapping sounds count once and closed contexts drop out.
    let last = performance.now();
    setInterval(() => {
      let loudest = 0;
      for (const analyser of meters) {
        if (analyser.context.state === 'closed') { meters.delete(analyser); continue; }
        analyser.getFloatTimeDomainData(analyser.samples);
        let sum = 0;
        for (const value of analyser.samples) sum += value * value;
        loudest = Math.max(loudest, Math.sqrt(sum / analyser.samples.length));
      }
      const now = performance.now();
      state.peak = Math.max(state.peak, loudest);
      if (loudest > 0.001) state.activeMs += now - last;
      last = now;
    }, 40);
    // Web Audio graphs that reach the speakers also feed one meter per speaker, beside the app's own connection.
    const speakers = new WeakMap();
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (target, ...rest) {
      if (target instanceof AudioDestinationNode) {
        if (!speakers.has(target)) speakers.set(target, meter(target.context));
        connect.call(this, speakers.get(target), rest[0] ?? 0);
      }
      return connect.call(this, target, ...rest);
    };
    // Media elements, including WebRTC streams in <audio>, are read from a captured copy, so their sound is untouched.
    const listened = new WeakSet();
    document.addEventListener('play', event => {
      const media = event.target;
      const stream = media.srcObject instanceof MediaStream ? media.srcObject : media.captureStream();
      if (listened.has(media) || !stream.getAudioTracks().length) return;
      listened.add(media);
      state.listener ||= new AudioContext();
      state.listener.resume();
      state.listener.createMediaStreamSource(stream).connect(meter(state.listener));
    }, true);
    // The microphone stays silent until a case says a clip, so silence and speech are both deterministic.
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => {
      if (!constraints?.audio || constraints.video) return getUserMedia(constraints);
      state.context ||= new AudioContext();
      state.mic ||= state.context.createMediaStreamDestination();
      return state.mic.stream.clone();
    };
    // Pages that check for a microphone before asking for one find the scripted one.
    const enumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = async () => {
      const devices = await enumerateDevices();
      return devices.some(device => device.kind === 'audioinput' && device.deviceId) ? devices : [...devices, {kind: 'audioinput', deviceId: 'qa-microphone', groupId: 'qa', label: 'QA microphone', toJSON() { return this; }}];
    };
    state.say = async base64 => {
      if (!state.mic) throw new Error('The page has not opened the microphone');
      await state.context.resume();
      const source = state.context.createBufferSource();
      source.buffer = await state.context.decodeAudioData(Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer);
      source.connect(state.mic);
      await new Promise(resolve => { source.onended = resolve; source.start(); });
    };
  });
  return {
    say: async file => page.evaluate(base64 => window.__qaAudio.say(base64), (await readFile(file)).toString('base64')),
    output: () => page.evaluate(() => ({peak: window.__qaAudio.peak, activeMs: window.__qaAudio.activeMs})),
  };
}
