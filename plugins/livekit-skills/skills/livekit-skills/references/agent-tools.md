## /agents/build/tools

LiveKit docs › Logic & Structure › Tool definition & use › Overview

---

# Tool definition and use

> Let your agents call external tools and more.

## Overview

LiveKit Agents has full support for LLM tool use. This feature allows you to create a custom library of tools to extend your agent's context, create interactive experiences, and overcome LLM limitations. Tools can run synchronously or [in the background](https://docs.livekit.io/agents/logic/tools/async.md), letting the agent keep talking while long-running work completes.

Within a tool, you can:

- Generate [agent speech](https://docs.livekit.io/agents/build/audio.md) with `session.say()` or `session.generate_reply()`.
- Call methods on the frontend using [RPC](https://docs.livekit.io/transport/data/rpc.md).
- Handoff control to another agent as part of a [workflow](https://docs.livekit.io/agents/logic/workflows.md).
- Store and retrieve session data from the `context`.
- Anything else that a Python function can do.
- [Call external APIs or lookup data for RAG](https://docs.livekit.io/agents/build/external-data.md).

### Tool types

Two types of tools are supported:

- **Function tools**: Tools that are defined as functions within your agent's code base and can be called by the LLM.
- **Provider tools**: Tools provided by a specific model provider (e.g. OpenAI, Gemini, etc.) and are executed internally by the provider's model server.

### Provider tools

Available in:
- [x] Node.js
- [x] Python

Many LLM providers, including OpenAI, Gemini, and xAI, include built-in server-side tools that are executed entirely within a single API call. Examples include web search, code execution, and file search. These tools, called "provider tools" in LiveKit Agents, can be added to any agent that uses a supported LLM. Where the underlying provider supports it, you can mix provider tools with function tools by passing them to the `tools` parameter on your `Agent`.

Node.js provider tools are currently available for OpenAI and Gemini.

**Python**:

```python
from livekit.plugins import openai  # replace with any supported provider

agent = MyAgent(
    llm=openai.responses.LLM(model="gpt-4.1"),
    tools=[openai.tools.WebSearch()],  # replace with any supported tool
)

```

---

**Node.js**:

```typescript
import { voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';

const agent = voice.Agent.create({
  instructions: 'You are a helpful assistant.',
  llm: new openai.responses.LLM({ model: 'gpt-4.1' }),
  tools: [new openai.WebSearch()],
});

```

Refer to the documentation for each model provider for usage details.

| Provider | Supported tools |
| [Anthropic](https://docs.livekit.io/agents/models/llm/anthropic.md#provider-tools) | `ComputerUse` |
| [Gemini](https://docs.livekit.io/agents/models/llm/gemini.md#provider-tools) | `GoogleSearch`, `GoogleMaps`, `URLContext`, `FileSearch`, `ToolCodeExecution` |
| [Mistral AI](https://docs.livekit.io/agents/models/llm/mistralai.md#provider-tools) | `WebSearch`, `DocumentLibrary`, `CodeInterpreter` |
| [OpenAI](https://docs.livekit.io/agents/models/llm/openai.md#provider-tools) | `WebSearch`, `FileSearch`, `CodeInterpreter` |
| [xAI](https://docs.livekit.io/agents/models/llm/xai.md#provider-tools) | `WebSearch`, `XSearch`, `FileSearch` |

### Examples

The following additional examples show how to use tools in different ways:

- **[Dynamic tool creation](https://docs.livekit.io/agents/logic/tools/definition.md#adding-tools-dynamically)**: Set the tools list directly and share tools between agents.

- **[MCP Agent](https://docs.livekit.io/reference/recipes/http_mcp_client.md)**: A voice AI agent with an integrated Model Context Protocol (MCP) client for the LiveKit API.

## In this section

Read more about each topic.

| Topic | Description |
| [Function tools](https://docs.livekit.io/agents/logic/tools/definition.md) | Define function tools with decorators, RunContext, speech in tools, interruptions, dynamic tools, and error handling. |
| [Toolsets](https://docs.livekit.io/agents/logic/tools/toolsets.md) | Group related tools and add or remove them as a unit. |
| [Async tools](https://docs.livekit.io/agents/logic/tools/async.md) | Run long-running tools in the background so the agent can keep talking. |
| [Model Context Protocol (MCP)](https://docs.livekit.io/agents/logic/tools/mcp.md) | Expose tools from MCP servers to your agent (Python only). |
| [Forwarding to the frontend](https://docs.livekit.io/agents/logic/tools/forwarding.md) | Fulfill tool calls via RPC from the client. |

## Additional resources

The following articles provide more information about the topics discussed in this guide:

- **[RPC](https://docs.livekit.io/transport/data/rpc.md)**: Complete documentation on function calling between LiveKit participants.

- **[Agent speech](https://docs.livekit.io/agents/build/audio.md)**: More information about precise control over agent speech output.

- **[Workflows](https://docs.livekit.io/agents/logic/workflows.md)**: Read more about handing off control to other agents.

- **[External data and RAG](https://docs.livekit.io/agents/build/external-data.md)**: Best practices for adding context and taking external actions.

---

For the latest version of this document, see [https://docs.livekit.io/agents/logic/tools.md](https://docs.livekit.io/agents/logic/tools.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).
