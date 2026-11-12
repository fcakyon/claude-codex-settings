# Realtime voice

A voice journey proves four things: the provider heard what was said, the reply played, silence stays silent, and the provider session is closed afterwards. Typed input and mocked transports prove none of them.

Call `qa.captureAudio(page)` before the page loads. It grants the microphone permission and lists a microphone, so permission and device checks pass. The microphone the page opens is silent until `say(file)` plays a WAV clip into it, and `say` returns after the clip ends. `output()` reports the loudest played level (`peak`) and how long audio was audible (`activeMs`). It hears Web Audio sent to the speakers and every playing `<audio>` or `<video>` element, including WebRTC streams, without changing what the page plays. The same values live in `window.__qaAudio` for `page.waitForFunction`.

```js
const audio = await qa.captureAudio(page)
await page.goto(qa.config.baseUrl + '/call')
await page.getByRole('button', {name: 'Start call'}).click()
await audio.say(path.join(qa.root, '.agents/qa/clips/opening-question.wav'))
await page.getByText(/weather/i).waitFor()
await page.waitForFunction(() => window.__qaAudio.activeMs > 500)
qa.assert.ok((await audio.output()).peak > 0.01, 'The reply is played')
```

Synthesize or record each phrase once and commit the WAV beside the suite, so every run says exactly the same thing. Short clips with a few distinctive words survive speech recognition. Assert that those words appear in the transcript, case-insensitively, never the exact sentence.

For silence, leave the microphone quiet for longer than the provider's silence timeout plus a margin, then assert that no new agent turn arrived and `activeMs` stopped growing. For barge-in, say a clip while `activeMs` is still growing and assert that it stops soon after.

After hanging up, assert the provider session is gone, since providers cap concurrent sessions per account and a leaked one blocks the next run.

## ElevenLabs Agents

- Check the budget first. `GET https://api.elevenlabs.io/v1/user/subscription` with `xi-api-key` returns `character_count` and `character_limit`. Throw `qa.Blocked` when the remainder is below what the run needs, because an exhausted quota fails sessions in ways that look like app bugs.
- Read what the agent heard from the server. `GET /v1/convai/conversations/{conversation_id}` returns `transcript` entries with `role` (`user` or `agent`) and `message`. Poll until `status` is `done` before asserting on the full transcript.
- `conversation_config.turn.turn_timeout` sets how long the agent waits in silence before it speaks again, documented as 1 to 30 seconds. Silent turns can appear in the transcript as `...` user messages followed by an agent prompt, so a silence journey asserts that neither arrives.
- When the app creates agents, assert they are deleted afterwards (`DELETE /v1/convai/agents/{agent_id}`, then a failing `GET`).
- Text-only sessions cost no speech and suit logic checks. ElevenLabs agent tests (`/v1/convai/agent-testing/create`, `/v1/convai/agents/{agent_id}/run-tests`) check prompt behavior without a browser. Neither proves microphone or playback.
