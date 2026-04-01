## /agents/start/voice-ai-quickstart

LiveKit docs › Get Started › Voice AI quickstart

---

# Voice AI quickstart

> Build and deploy a simple voice assistant in less than 10 minutes.

## Overview

This guide walks you through the setup of your very first voice assistant using LiveKit Agents. In less than 10 minutes, you'll have a voice assistant that you can speak to in your terminal, browser, telephone, or native app.

> 💡 **LiveKit Agent Builder**
> 
> The LiveKit Agent Builder is a quick way to get started with voice agents in your browser, without writing any code. It's perfect for prototyping and exploring ideas, but doesn't have as many features as the full LiveKit Agents SDK. See the [Agent Builder](https://docs.livekit.io/agents/start/builder.md) guide for more details.

### Coding agent support

LiveKit is built for coding agents like [Claude Code](https://claude.com/product/claude-code), [Cursor](https://www.cursor.com/), and [Codex](https://openai.com/codex/). These agents can build agents and frontends with the LiveKit SDKs and manage resources with the LiveKit CLI. Give your agent LiveKit expertise using the LiveKit CLI or Docs MCP server. For more information, see the [coding agents guide](https://docs.livekit.io/intro/coding-agents.md).

## Starter projects

The simplest way to get your first agent running is with one of the following starter projects. You can create a project from a template with the CLI (see [Quick start with CLI](#setup-with-cli)) or click "Use this template" on GitHub and follow the project's README.

These projects are constructed with best practices, a complete working agent, tests, and an AGENTS.md optimized to turn coding agents like [Claude Code](https://claude.com/product/claude-code) and [Cursor](https://www.cursor.com/) into LiveKit experts.

- **[Python starter project](https://github.com/livekit-examples/agent-starter-python)**: Ready-to-go Python starter project. Clone a repo with all the code you need to get started.

- **[Node.js starter project](https://github.com/livekit-examples/agent-starter-node)**: Ready-to-go Node.js starter project. Clone a repo with all the code you need to get started.

## Requirements

The following sections describe the minimum requirements to get started with LiveKit Agents.

**Python**:

- LiveKit Agents requires Python >= 3.10.
- This guide uses the [uv](https://docs.astral.sh/uv/getting-started/installation/) package manager.

---

**Node.js**:

- LiveKit Agents for Node.js requires Node.js >= 20.
- This guide uses [pnpm](https://pnpm.io/installation) package manager and requires pnpm >= 10.15.0.

### LiveKit Cloud

This guide assumes you have signed up for a free [LiveKit Cloud](https://cloud.livekit.io/) account. LiveKit Cloud includes agent deployment, model inference, and realtime media transport. Create a free project and use the API keys in the following steps to get started.

While this guide assumes LiveKit Cloud, the instructions can be adapted for [self-hosting](https://docs.livekit.io/transport/self-hosting/local.md) the open-source LiveKit server instead. For self-hosting in production, set up a [custom deployment](https://docs.livekit.io/deploy/custom/deployments.md) environment, and make the following changes: remove the [enhanced noise cancellation](https://docs.livekit.io/transport/media/noise-cancellation.md) plugin from the agent code, and use [plugins](https://docs.livekit.io/agents/models.md#plugins) for your own AI providers.

### LiveKit CLI

Use the LiveKit CLI to manage LiveKit API keys and deploy your agent to LiveKit Cloud.

1. Install the LiveKit CLI:

**macOS**:

Install the LiveKit CLI with [Homebrew](https://brew.sh/):

```text
brew install livekit-cli

```

---

**Linux**:

```text
curl -sSL https://get.livekit.io/cli | bash

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**Windows**:

```text
winget install LiveKit.LiveKitCLI

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**From Source**:

This repo uses [Git LFS](https://git-lfs.github.com/) for embedded video resources. Please ensure git-lfs is installed on your machine before proceeding.

```text
git clone github.com/livekit/livekit-cli
make install

```
2. Link your LiveKit Cloud project to the CLI:

```shell
lk cloud auth

```

This opens a browser window to authenticate and link your project to the CLI.

## Quickstart steps

The following sections walk you through the steps to get your first agent running.

### Setup with CLI

The simplest way to get your first agent running is with the LiveKit CLI.

Make sure your project meets all [requirements](#requirements), then run:

**Python**:

```shell
lk agent init my-agent --template agent-starter-python

```

---

**Node.js**:

```shell
lk agent init my-agent --template agent-starter-node

```

The CLI clones the template into the `my-agent` directory, creates an `.env.local` file with your LiveKit credentials, and prints the next steps to run your agent.

> 💡 **Save the chat link**
> 
> Save the link provided by the CLI after the line "To chat with your running agent, visit" for later use.

Follow the instructions it prints, which guide you through the following steps:

1. **Select a project to use** — If you don't have a default project set, the CLI prompts you to select a project to use.
2. **Change into the project directory** — The project directory is named after your agent.

`cd my-agent`
3. **Install dependencies** — Install the agent's runtime and plugin dependencies.

**Python**:

```shell
uv sync

```

---

**Node.js**:

```shell
pnpm install

```
4. **Download model files** — Required for the Silero VAD, turn detector, and noise cancellation plugins.

**Python**:

```shell
uv run src/agent.py download-files

```

---

**Node.js**:

```shell
pnpm download-files

```
5. **Run your agent** — Run your agent in development mode.

**Python**:

```shell
uv run src/agent.py dev

```

---

**Node.js**:

```shell
pnpm dev

```

### Speak to your agent

Open a browser and visit the link you saved earlier from the CLI output to speak to your agent.

## Other options

You can customize your agent by choosing different AI models and by exploring testing and deployment options.

### AI models

Voice agents require one or more [AI models](https://docs.livekit.io/agents/models.md) to provide understanding, intelligence, and speech. LiveKit Agents supports both high-performance STT-LLM-TTS voice pipelines constructed from multiple specialized models, as well as realtime models with direct speech-to-speech capabilities.

**STT-LLM-TTS pipeline**:

Your agent strings together three specialized providers into a high-performance voice pipeline powered by LiveKit Inference. No additional setup is required.

![Diagram showing STT-LLM-TTS pipeline.](/images/agents/stt-llm-tts-pipeline.svg)

| Component | Model | Alternatives |
| STT | Deepgram Nova-3 | [STT models](https://docs.livekit.io/agents/models/stt.md) |
| LLM | OpenAI GPT-4.1 mini | [LLM models](https://docs.livekit.io/agents/models/llm.md) |
| TTS | Cartesia Sonic-3 | [TTS models](https://docs.livekit.io/agents/models/tts.md) |

---

**Realtime model**:

Your agent uses a single realtime model to provide an expressive and lifelike voice experience.

![Diagram showing realtime model.](/images/agents/realtime-model.svg)

| Model | Required Key | Alternatives |
| [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) | `OPENAI_API_KEY` | [Realtime models](https://docs.livekit.io/agents/models/realtime.md) |

You can change the AI models used by editing your agent file. Full agent files for STT-LLM-TTS and Realtime models can be found in the [Agent code](#agent-code) section.

### Test and deploy

Use different modes and deployment options to test and deploy your agent.

#### Server startup modes

Start your agent server in development or production modes.

- `console` mode: For Python only, runs your agent locally in your terminal.
- `dev` mode: Run your agent in development mode for testing and debugging.
- `start` mode: Run your agent in production mode.

To learn more about these modes, see the [Server startup modes](https://docs.livekit.io/agents/server/startup-modes/) reference.

**Python**:

For Python agents, run the following command to start your agent in production mode:

```shell
uv run agent.py start

```

---

**Node.js**:

The Node.js starter includes `build` and `start` scripts. To run in production mode:

```shell
pnpm build
pnpm start

```

#### Connect to playground

Start your agent in `dev` mode to connect it to LiveKit and make it available from anywhere on the internet:

**Python**:

```shell
uv run src/agent.py dev

```

---

**Node.js**:

```shell
pnpm dev

```

Use the [Agents playground](https://docs.livekit.io/agents/start/playground.md) to speak with your agent and explore its full range of multimodal capabilities. Note that you'll need to set the **Agent name**, which should be `my-agent` for this quickstart.

#### Deploy to LiveKit Cloud

Run `lk agent create` from the project directory to register and deploy.

After the deployment completes, you can access your agent in the playground, or continue to use the `console` mode as you build and test your agent locally.

## Agent code

Once you have the quickstart running, you can dig into the agent code. For the difference between realtime and chained (STT-LLM-TTS) pipelines, see [AI models](#ai-models). The tabs below show the full files for each pipeline type so you can swap, copy, or adapt them.

**STT-LLM-TTS pipeline**:

** Filename: `agent.py`**

```python
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, TurnHandlingOptions
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor.""",
        )

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        stt="deepgram/nova-3:multi",
        llm="openai/gpt-4.1-mini",
        tts="cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
        ),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony() if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP else noise_cancellation.BVC(),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)


```

** Filename: `main.ts`**

```typescript
import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Agent } from './agent';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad! as silero.VAD;

    const session = new voice.AgentSession({
      vad,
      stt: "deepgram/nova-3:multi",
      llm: "openai/gpt-4.1-mini",
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      turnHandling: {
        turnDetection: new livekit.turnDetector.MultilingualModel(),
      },
    });

    await session.start({
      agent: new Agent(),
      room: ctx.room,
      inputOptions: {
        // For telephony applications, use `TelephonyBackgroundVoiceCancellation` for best results
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    const handle = session.generateReply({
      instructions: 'Greet the user and offer your assistance.',
    });
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: 'my-agent' }));

```

** Filename: `agent.ts`**

```typescript
import { voice } from '@livekit/agents';

export class Agent extends voice.Agent {
  constructor() {
    super({
      instructions: 'You are a helpful voice AI assistant.',
    });
  }
}

```

---

**Realtime model**:

** Filename: `agent.py`**

```python
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io
from livekit.plugins import (
    openai,
    noise_cancellation,
)

load_dotenv(".env.local")

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant.")

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        llm=openai.realtime.RealtimeModel(
            voice="coral"
        )
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony() if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP else noise_cancellation.BVC(),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance. You should start by speaking in English."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)


```

** Filename: `main.ts`**

```typescript
import {
  type JobContext,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Agent } from './agent';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const session = new voice.AgentSession({
      llm: new openai.realtime.RealtimeModel({
        voice: 'coral',
      }),
    });

    await session.start({
      agent: new Agent(),
      room: ctx.room,
      inputOptions: {
        // For telephony applications, use `TelephonyBackgroundVoiceCancellation` for best results
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    const handle = session.generateReply({
      instructions: 'Greet the user and offer your assistance. You should start by speaking in English.',
    });
    await handle.waitForPlayout();
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: 'my-agent' }));

```

** Filename: `agent.ts`**

```typescript
import { voice } from '@livekit/agents';

export class Agent extends voice.Agent {
  constructor() {
    super({
      instructions: 'You are a helpful voice AI assistant.',
    });
  }
}

```

## Next steps

Follow these guides to bring your voice AI app to life in the real world.

- **[Web and mobile frontends](https://docs.livekit.io/agents/start/frontend.md)**: Put your agent in your pocket with a custom web or mobile app.

- **[Telephony integration](https://docs.livekit.io/agents/start/telephony.md)**: Your agent can place and receive calls with LiveKit's SIP integration.

- **[Testing your agent](https://docs.livekit.io/agents/start/testing.md)**: Add behavioral tests to fine-tune your agent's behavior.

- **[Building voice agents](https://docs.livekit.io/agents/build.md)**: Comprehensive documentation to build advanced voice AI apps with LiveKit.

- **[Agent server](https://docs.livekit.io/agents/server.md)**: Learn how to manage your agents with agent servers and jobs.

- **[Deploying to LiveKit Cloud](https://docs.livekit.io/agents/ops/deployment.md)**: Learn more about deploying and scaling your agent in production.

- **[AI Models](https://docs.livekit.io/agents/models.md)**: Explore the full list of AI models available with LiveKit Agents.

- **[Recipes](https://docs.livekit.io/reference/recipes.md)**: A comprehensive collection of examples, guides, and recipes for LiveKit Agents.

---

This document was rendered at 2026-04-01T11:24:17.683Z.
For the latest version of this document, see [https://docs.livekit.io/agents/start/voice-ai.md](https://docs.livekit.io/agents/start/voice-ai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).
