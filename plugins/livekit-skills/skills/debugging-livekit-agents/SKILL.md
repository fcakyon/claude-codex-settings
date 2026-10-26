---
name: debugging-livekit-agents
description: 'Drives a live multi-turn conversation with a LiveKit agent running locally, using `lk agent debugger`. Use when the user says "test my agent", "try my agent", "does this work", or "why did it call that tool", after editing an agent to check how it behaves, or when an agent on a speech-to-speech model or one that mishears users needs checking. The default for a bare "test"; for regression tests use testing-livekit-agents, for graded runs running-livekit-simulations.'
license: MIT
metadata:
  author: livekit
---

# Debugging a LiveKit agent live

`lk agent debugger` runs the user's agent locally as a background process and lets you drive a
conversation one turn at a time. It's built for coding agents: you play the user, choose each next
line based on the last reply, and inspect what the agent did in between.

By default the session is text: speech is off and nothing goes to a LiveKit room, so each turn is
fast. When the bug lives in the audio path, start the session in audio mode instead (see
[Audio mode](#audio-mode)).

Before the first use, confirm the command exists and read its help:

```bash
lk agent debugger --help
```

The help is thorough and is the source of truth for subcommands and flags, so this skill doesn't
restate them. If the command is missing, the installed CLI predates it. Tell the user to update
`lk` and use `testing-livekit-agents` until then. Don't guess at an older command's shape.

## The loop

**Start** the agent, **say** user turns, **inspect** what happened, edit the code, **restart**,
repeat, and **stop** when you're done. Roughly:

```bash
lk agent debugger start
lk agent debugger say "Hi, what can you do?"
lk agent debugger say "Book me a table for two tonight"
lk agent debugger stop
```

Each `say` prints everything the agent did in response (tool calls with arguments and results,
handoffs, errors) followed by the reply. Between turns you can look at the agent's chat history, a
live event stream, the process logs, and status; `--help` lists the subcommands.

**Restart after every code edit.** A running session keeps the old code, and it's easy to lose
time debugging behavior the file no longer has.

## Debugging with it

- **Read the tool calls as well as the reply.** The reply shows what went wrong; the tool call and
  its arguments usually show why. A wrong argument points to the prompt or the tool description. No
  call at all usually means the tool description never says when to use it.
- **Interleave the logs when a tool misbehaves.** An option shows the agent's log lines under the
  turn they belong to, so a tool's traceback appears right below the sanitized error the user would
  have heard. That's the quickest way from symptom to cause.
- **Check the agent's chat history instead of relying on your memory of the conversation.** It
  records what the LLM saw, including instruction and tool changes across handoffs. When behavior
  seems impossible, the history usually shows the context isn't what you assumed.
- **Reproduce before you fix, then re-run the same turns.** Keep the sequence of `say` lines that
  triggered the bug so you can compare before and after.
- **Drive whole conversations.** Most bugs take several turns to show up: details collected early
  that get lost, a user changing their mind mid-flow, a handoff that drops context. A single turn
  won't find them.
- **Script it if a program is deciding the turns.** There's machine-readable output and meaningful
  exit codes. Check `--help` for the current format instead of assuming field names.

## Audio mode

Text mode skips STT and TTS, so it can't show a name heard as a different spelling, digits the STT
spells out as words, a turn that ends too early, or anything from a realtime model that only takes
audio. Where the CLI supports it, starting the session with audio (check `start --help`) speaks
each `say` with LiveKit Inference TTS into the agent's microphone input, and the agent runs its full
audio pipeline.

- **Use it when the symptom is about hearing**, or when the agent uses a speech-to-speech model that
  can't run in text mode. Stay in text mode for logic, prompt, and tool bugs: it's faster, and
  the transcription noise only gets in the way.
- **It needs a LiveKit Cloud project.** The spoken turns run on LiveKit Inference, so `lk` must
  have project credentials. Text mode doesn't need them.
- **Compare what was heard with what you sent.** Each turn shows the agent's transcript of your
  line, and the sent text when the words differ. That difference is often the whole bug: the agent
  answered correctly to what it heard.
- **Write lines the way a caller would say them.** Spell out numbers and codes when testing how the
  agent handles spoken input, and test both forms if the agent should accept either.
- **The mode belongs to the session.** Restart keeps it; stop and start again to switch.
- **A long silent pause can end a turn early.** A turn ends once the agent has answered and stayed
  quiet for a moment. If the agent pauses for a long time before finishing (for example, a realtime
  model waiting on a delegated answer), the rest of its reply shows up in the next turn. Check the
  chat history before concluding the agent never answered.

Audio mode still can't interrupt the agent mid-reply or tell you how the agent sounds. Use
`lk agent console` or audio simulations for those.

## When to use something else

| Situation | Use |
|---|---|
| You want to *hear* it, or hand the user something to try | `lk agent console` (mic and speakers, a human at the keyboard) |
| The same failure keeps coming back | A turn-level regression test (`testing-livekit-agents`) |
| You need whole-conversation outcomes graded at scale | Simulations (`running-livekit-simulations`) |
| Transcription or endpointing on a turn you're investigating | The debugger in audio mode (above) |
| Interruptions, or speech behavior graded across many conversations | Audio simulations (`running-livekit-simulations`) |

The debugger is for finding bugs interactively. Once you've found one, write a test for it so a
later change can't reintroduce it unnoticed.

## Related skills

- Building the agent: `building-livekit-agents`
- Pinning a found bug as a test: `testing-livekit-agents`
- Whole-conversation checks: `writing-livekit-scenarios`, `running-livekit-simulations`
- Production-only failures (worker processes, providers, shutdown): `operating-livekit-agents`
- CLI flags and API facts: `reading-livekit-docs`
