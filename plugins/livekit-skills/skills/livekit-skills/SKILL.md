---
name: livekit-skills
description: 'Build voice AI agents with LiveKit Agents SDK. Use when the user asks to "build a voice agent", "create a LiveKit agent", "add voice AI", "implement handoffs", "structure agent workflows", or is working with LiveKit Agents SDK. Covers both LiveKit Cloud and self-hosted deployments using lk CLI.'
license: MIT
metadata:
  author: livekit
  version: "0.3.1"
---

# LiveKit Voice Agent Development

This skill provides guidance for building voice AI agents with the LiveKit Agents SDK. It covers both LiveKit Cloud and self-hosted deployments, using the `lk` CLI for documentation access and project management. All factual information about APIs, methods, and configurations must come from live documentation.


## MANDATORY: Read This Checklist Before Starting

Before writing ANY code, complete this checklist:

1. **Read this entire skill document** - Do not skip sections
2. **Set up LiveKit credentials** (Cloud project or self-hosted server) - You need `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`
3. **Set up documentation access** - Install `lk` CLI for `lk docs` commands
4. **Plan to write tests** - Every agent implementation MUST include tests (see testing section below)
5. **Verify all APIs against live docs** - Never rely on model memory for LiveKit APIs


## Setup

### LiveKit Cloud

LiveKit Cloud is the fastest way to get a voice agent running. It provides:
- Managed infrastructure (no servers to deploy)
- **LiveKit Inference** for AI models (no separate API keys needed)
- Built-in noise cancellation, turn detection, and other voice features
- Simple credential management

### Connect to Your Cloud Project

1. Sign up at [cloud.livekit.io](https://cloud.livekit.io) if you haven't already
2. Create a project (or use an existing one)
3. Get your credentials from the project settings:
   - `LIVEKIT_URL` - Your project's WebSocket URL (e.g., `wss://your-project.livekit.cloud`)
   - `LIVEKIT_API_KEY` - API key for authentication
   - `LIVEKIT_API_SECRET` - API secret for authentication

4. Set these as environment variables (typically in `.env.local`):
```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

The LiveKit CLI can automate credential setup. Consult the CLI documentation for current commands.

### Use LiveKit Inference for AI Models

LiveKit Inference is one option for AI model access when using LiveKit Cloud. It provides access to leading AI model providers—all through your LiveKit credentials with no separate API keys needed.

Benefits of LiveKit Inference:
- No separate API keys to manage for each AI provider
- Billing consolidated through your LiveKit Cloud account
- Optimized for voice AI workloads

Consult the documentation for available models, supported providers, and current usage patterns. The documentation always has the most up-to-date information.

### Self-Hosted Setup

Self-hosting removes Cloud tier limits on deployments and concurrency. You control scaling directly.

#### Local development
Install and run the LiveKit server:
- macOS: `brew install livekit`
- Linux: `curl -sSL https://get.livekit.io | bash`

Start in dev mode:
```bash
livekit-server --dev
```
Default credentials: API key `devkey`, API secret `secret`.

Set environment variables:
```bash
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

#### Production deployment
Deploy `livekit-server` via Docker, Kubernetes, or VMs on any provider (Hetzner, AWS, GCP, etc.). Consult `lk docs get-page /home/self-hosting` or see `references/self-hosting.md` for details. Agent servers run as regular processes managed by your infra tooling.

### Using Your Own Model Providers

When self-hosting or when you prefer your own API keys over LiveKit Inference, configure model providers directly via environment variables:

```bash
# STT (Speech-to-Text)
DEEPGRAM_API_KEY=your-key

# LLM
OPENAI_API_KEY=your-key

# TTS (Text-to-Speech)
ELEVEN_API_KEY=your-key
# or
CARTESIA_API_KEY=your-key
```

The Agents SDK has plugins for all major providers. Pass model identifiers directly:

**Node.js / TypeScript:**
```typescript
import { voice } from "@livekit/agents";

const session = new voice.AgentSession({
  stt: "deepgram/nova-3:multi",
  llm: "openai/gpt-4.1-mini",
  tts: "cartesia/sonic-3:voice-id",  // or "elevenlabs/..."
});
```

**Python:**
```python
session = AgentSession(
    stt="deepgram/nova-3",
    llm="openai/gpt-4.1-mini",
    tts="elevenlabs/...",  # or "cartesia/sonic-3:voice-id"
)
```

Consult `lk docs search "plugins"` for the full list of supported providers.

### Project Templates

Initialize a new agent project with the CLI:

**Backend agents:**
```bash
lk agent init my-agent --template agent-starter-python
lk agent init my-agent --template agent-starter-node
```

**Frontend apps (React/Next.js, React Native, Swift, Flutter, Android):**
```bash
lk agent init my-frontend --template agent-starter-react
lk agent init my-frontend --template agent-starter-react-native
```

Omit `--template` to see all available templates interactively.

## Critical Rule: Never Trust Model Memory for LiveKit APIs

LiveKit Agents is a fast-evolving SDK. Model training data is outdated the moment it's created. When working with LiveKit:

- **Never assume** API signatures, method names, or configuration options from memory
- **Never guess** SDK behavior or default values
- **Always verify** against live documentation before writing code
- **Always cite** the documentation source when implementing features

This rule applies even when confident about an API. Verify anyway.

## Use LiveKit CLI for Documentation

Before writing any LiveKit code, use the `lk docs` CLI commands for current, verified API information. This prevents reliance on stale model knowledge.

### Search documentation
```bash
lk docs search "voice agent quickstart"
lk docs search "handoffs and tasks"
```

### Fetch specific pages
```bash
lk docs get-page /agents/start/voice-ai-quickstart
lk docs get-page /agents/build/tools /agents/build/vision
```

### Search SDK source code
```bash
lk docs code-search "class AgentSession" --repo livekit/agents
lk docs code-search "@function_tool" --language Python --full-file
```

### Check changelogs
```bash
lk docs changelog livekit/agents
lk docs changelog pypi:livekit-agents --releases 5
lk docs changelog npm:livekit-agents --releases 5
```

### If CLI is not installed
Install the LiveKit CLI first:
- macOS: `brew install livekit-cli`
- Linux: `curl -sSL https://get.livekit.io/cli | bash`
- Windows: `winget install LiveKit.LiveKitCLI`

As a fallback, reference pages are available in the `references/` directory alongside this skill.

## Voice Agent Architecture Principles

Voice AI agents have fundamentally different requirements than text-based agents or traditional software. Internalize these principles:

### Latency Is Critical

Voice conversations are real-time. Users expect responses within hundreds of milliseconds, not seconds. Every architectural decision should consider latency impact:

- Minimize LLM context size to reduce inference time
- Avoid unnecessary tool calls during active conversation
- Prefer streaming responses over batch responses
- Design for the unhappy path (network delays, API timeouts)

### Context Bloat Kills Performance

Large system prompts and extensive tool lists directly increase latency. A voice agent with 50 tools and a 10,000-token system prompt will feel sluggish regardless of model speed.

Design agents with minimal viable context:
- Include only tools relevant to the current conversation phase
- Keep system prompts focused and concise
- Remove tools and context that aren't actively needed

### Users Don't Read, They Listen

Voice interface constraints differ from text:
- Long responses frustrate users—keep outputs concise
- Users cannot scroll back—ensure clarity on first delivery
- Interruptions are normal—design for graceful handling
- Silence feels broken—acknowledge processing when needed

## Workflow Architecture: Handoffs and Tasks

Complex voice agents should not be monolithic. LiveKit Agents supports structured workflows that maintain low latency while handling sophisticated use cases.

### The Problem with Monolithic Agents

A single agent handling an entire conversation flow accumulates:
- Tools for every possible action (bloated tool list)
- Instructions for every conversation phase (bloated context)
- State management for all scenarios (complexity)

This creates latency and reduces reliability.

### Handoffs: Agent-to-Agent Transitions

Handoffs allow one agent to transfer control to another. Use handoffs to:
- Separate distinct conversation phases (greeting → intake → resolution)
- Isolate specialized capabilities (general support → billing specialist)
- Manage context boundaries (each agent has only what it needs)

Design handoffs around natural conversation boundaries where context can be summarized rather than transferred wholesale.

### Tasks: Scoped Operations

Tasks are tightly-scoped prompts designed to achieve a specific outcome. Use tasks for:
- Discrete operations that don't require full agent capabilities
- Situations where a focused prompt outperforms a general-purpose agent
- Reducing context when only a specific capability is needed

Consult the documentation for implementation details on handoffs and tasks.

## REQUIRED: Write Tests for Agent Behavior

Voice agent behavior is code. Every agent implementation MUST include tests. Shipping an agent without tests is shipping untested code.

### Mandatory Testing Workflow

When building or modifying a LiveKit agent:

1. **Create a `tests/` directory** if one doesn't exist
2. **Write at least one test** before considering the implementation complete
3. **Test the core behavior** the user requested
4. **Run the tests** to verify they pass

### Test-Driven Development Process

When modifying agent behavior—instructions, tool descriptions, workflows—begin by writing tests for the desired behavior:

1. Define what the agent should do in specific scenarios
2. Write test cases that verify this behavior
3. Implement the feature
4. Iterate until tests pass

This approach prevents shipping agents that "seem to work" but fail in production.

### What Every Agent Test Should Cover

At minimum, write tests for:
- **Basic conversation flow**: Agent responds appropriately to a greeting
- **Tool invocation** (if tools exist): Tools are called with correct parameters
- **Error handling**: Agent handles unexpected input gracefully

Focus tests on:
- **Tool invocation**: Does the agent call the right tools with correct parameters?
- **Response quality**: Does the agent produce appropriate responses for given inputs?
- **Workflow transitions**: Do handoffs and tasks trigger correctly?
- **Edge cases**: How does the agent handle unexpected input, interruptions, silence?

### Test Implementation Pattern

Use LiveKit's testing framework. Consult the testing documentation via `lk docs` for current patterns:
```
search: "livekit agents testing"
```

The framework supports:
- Simulated user input
- Verification of agent responses
- Tool call assertions
- Workflow transition testing

### Why This Is Non-Negotiable

Agents that "seem to work" in manual testing frequently fail in production:
- Prompt changes silently break behavior
- Tool descriptions affect when tools are called
- Model updates change response patterns

Tests catch these issues before users do.

### Skipping Tests

If a user explicitly requests no tests, proceed without them but inform them:
> "I've built the agent without tests as requested. I strongly recommend adding tests before deploying to production. Voice agents are difficult to verify manually and tests prevent silent regressions."

## Common Mistakes to Avoid

### Overloading the Initial Agent

Starting with one agent that "does everything" and adding tools/instructions over time. Instead, design workflow structure upfront, even if initial implementation is simple.

### Ignoring Latency Until It's a Problem

Latency issues compound. An agent that feels "a bit slow" in development becomes unusable in production with real network conditions. Measure and optimize latency continuously.

### Copying Examples Without Understanding

Examples in documentation demonstrate specific patterns. Copying code without understanding its purpose leads to bloated, poorly-structured agents. Understand what each component does before including it.

### Skipping Tests Because "It's Just Prompts"

Agent behavior is code. Prompt changes affect behavior as much as code changes. Test agent behavior with the same rigor as traditional software. **Never deliver an agent implementation without at least one test file.**

### Assuming Model Knowledge Is Current

Reiterating the critical rule: never trust model memory for LiveKit APIs. The SDK evolves faster than model training cycles. Verify everything.

## When to Consult Documentation

**Always consult documentation for:**
- API method signatures and parameters
- Configuration options and their valid values
- SDK version-specific features or changes
- Deployment and infrastructure setup
- Model provider integration details
- CLI commands and flags

**This skill provides guidance on:**
- Architectural approach and design principles
- Workflow structure decisions
- Testing strategy
- Common pitfalls to avoid

The distinction matters: this skill tells you *how to think* about building voice agents. The documentation tells you *how to implement* specific features.

## Feedback Loop

When using LiveKit documentation via `lk docs`, note any gaps, outdated information, or confusing content. Reporting documentation issues helps improve the ecosystem for all developers.

## Summary

Building effective voice agents with LiveKit Cloud requires:

1. **Use LiveKit Cloud + LiveKit Inference** as the foundation—it's the fastest path to production
2. **Verify everything** against live documentation—never trust model memory
3. **Minimize latency** at every architectural decision point
4. **Structure workflows** using handoffs and tasks to manage complexity
5. **Test behavior** before and after changes—never ship without tests
6. **Keep context minimal**—only include what's needed for the current phase

These principles remain valid regardless of SDK version or API changes. For all implementation specifics, consult the LiveKit documentation via `lk docs`.
