#!/bin/bash
# Sync official LiveKit agent-skills into plugins/livekit-skills.
# Patches the upstream skill to be cloud-agnostic and CLI-based (no MCP dependency).
# Usage: bash .github/scripts/sync-livekit-skills.sh
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

clone_or_update https://github.com/livekit/agent-skills livekit-agent-skills
SRC="$HOME/dev/livekit-agent-skills/skills"
DST="plugins/livekit-skills/skills"

sync_dir "$SRC/livekit-agents" "$DST/livekit-agents" "SKILL.md"

# Patch SKILL.md: remove cloud bias, replace MCP with CLI, add self-hosted setup
python3 -c "
import sys

p = '$REPO_ROOT/$DST/livekit-agents/SKILL.md'
c = open(p).read()

# Simple string replacements
replacements = [
    # Title
    ('# LiveKit Agents Development for LiveKit Cloud',
     '# LiveKit Agents Development'),
    # Description frontmatter
    ('Build voice AI agents with LiveKit Cloud and the Agents SDK.',
     'Build voice AI agents with LiveKit Agents SDK.'),
    (\"Provides opinionated guidance for the recommended path: LiveKit Cloud + LiveKit Inference. REQUIRES writing tests for all implementations.'\",
     \"Covers both LiveKit Cloud and self-hosted deployments using lk CLI.'\"),
    # Intro paragraph
    ('This skill provides opinionated guidance for building voice AI agents with LiveKit Cloud. It assumes you are using LiveKit Cloud (the recommended path) and encodes *how to approach* agent development, not API specifics.',
     'This skill provides guidance for building voice AI agents with the LiveKit Agents SDK. It covers both LiveKit Cloud and self-hosted deployments, using the \`lk\` CLI for documentation access and project management.'),
    # Remove cloud-only disclaimer
    ('**This skill is for LiveKit Cloud developers.** If you\'re self-hosting LiveKit, some recommendations (particularly around LiveKit Inference) won\'t apply directly.\n',
     ''),
    # Checklist items
    ('**Ensure LiveKit Cloud project is connected** - You need \`LIVEKIT_URL\`, \`LIVEKIT_API_KEY\`, and \`LIVEKIT_API_SECRET\` from your Cloud project',
     '**Set up LiveKit credentials** (Cloud project or self-hosted server) - You need \`LIVEKIT_URL\`, \`LIVEKIT_API_KEY\`, and \`LIVEKIT_API_SECRET\`'),
    ('**Set up documentation access** - Use MCP if available, otherwise use web search',
     '**Set up documentation access** - Install \`lk\` CLI for \`lk docs\` commands'),
    # Setup section
    ('## LiveKit Cloud Setup\n\nLiveKit Cloud is the fastest way to get a voice agent running.',
     '## Setup\n\n### LiveKit Cloud\n\nLiveKit Cloud is the fastest way to get a voice agent running.'),
    # LiveKit Inference framing
    ('**LiveKit Inference is the recommended way to use AI models with LiveKit Cloud.**',
     'LiveKit Inference is one option for AI model access when using LiveKit Cloud.'),
]

for old, new in replacements:
    if old in c:
        c = c.replace(old, new, 1)
    else:
        print(f'WARNING: patch not found: \"{old[:80]}...\"', file=sys.stderr)

# Replace entire MCP section with CLI section
mcp_header = '## REQUIRED: Use LiveKit MCP Server for Documentation'
next_section = '## Voice Agent Architecture Principles'

if mcp_header in c and next_section in c:
    before = c[:c.index(mcp_header)]
    after = c[c.index(next_section):]
    cli_section = '''## Use LiveKit CLI for Documentation

Before writing any LiveKit code, use the \`lk docs\` CLI commands for current, verified API information. This prevents reliance on stale model knowledge.

### Search documentation
\`\`\`bash
lk docs search \"voice agent quickstart\"
lk docs search \"handoffs and tasks\"
\`\`\`

### Fetch specific pages
\`\`\`bash
lk docs get-page /agents/start/voice-ai-quickstart
lk docs get-page /agents/build/tools /agents/build/vision
\`\`\`

### Search SDK source code
\`\`\`bash
lk docs code-search \"class AgentSession\" --repo livekit/agents
lk docs code-search \"@function_tool\" --language Python --full-file
\`\`\`

### Check changelogs
\`\`\`bash
lk docs changelog livekit/agents
lk docs changelog pypi:livekit-agents --releases 5
lk docs changelog npm:livekit-agents --releases 5
\`\`\`

### If CLI is not installed
Install the LiveKit CLI first:
- macOS: \`brew install livekit-cli\`
- Linux: \`curl -sSL https://get.livekit.io/cli | bash\`
- Windows: \`winget install LiveKit.LiveKitCLI\`

As a fallback, reference pages are available in the \`references/\` directory alongside this skill.

'''
    c = before + cli_section + after
else:
    print('WARNING: MCP section boundaries not found', file=sys.stderr)

# Inject self-hosted setup + BYOK model providers after the Cloud setup section
# Find the end of the Inference subsection to inject after it
inference_marker = 'Consult the documentation for available models, supported providers, and current usage patterns. The documentation always has the most up-to-date information.'
if inference_marker in c:
    inject_point = c.index(inference_marker) + len(inference_marker)
    self_hosted_section = '''

### Self-Hosted Setup

Self-hosting removes Cloud tier limits on deployments and concurrency. You control scaling directly.

#### Local development
Install and run the LiveKit server:
- macOS: \`brew install livekit\`
- Linux: \`curl -sSL https://get.livekit.io | bash\`

Start in dev mode:
\`\`\`bash
livekit-server --dev
\`\`\`
Default credentials: API key \`devkey\`, API secret \`secret\`.

Set environment variables:
\`\`\`bash
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
\`\`\`

#### Production deployment
Deploy \`livekit-server\` via Docker, Kubernetes, or VMs on any provider (Hetzner, AWS, GCP, etc.). Consult \`lk docs get-page /home/self-hosting\` or see \`references/self-hosting.md\` for details. Agent servers run as regular processes managed by your infra tooling.

### Using Your Own Model Providers

When self-hosting or when you prefer your own API keys over LiveKit Inference, configure model providers directly via environment variables:

\`\`\`bash
# STT (Speech-to-Text)
DEEPGRAM_API_KEY=your-key

# LLM
OPENAI_API_KEY=your-key

# TTS (Text-to-Speech)
ELEVEN_API_KEY=your-key
# or
CARTESIA_API_KEY=your-key
\`\`\`

The Agents SDK has plugins for all major providers. Pass model identifiers directly:

**Node.js / TypeScript:**
\`\`\`typescript
import { voice } from \"@livekit/agents\";

const session = new voice.AgentSession({
  stt: \"deepgram/nova-3:multi\",
  llm: \"openai/gpt-4.1-mini\",
  tts: \"cartesia/sonic-3:voice-id\",  // or \"elevenlabs/...\"
});
\`\`\`

**Python:**
\`\`\`python
session = AgentSession(
    stt=\"deepgram/nova-3\",
    llm=\"openai/gpt-4.1-mini\",
    tts=\"elevenlabs/...\",  # or \"cartesia/sonic-3:voice-id\"
)
\`\`\`

Consult \`lk docs search \"plugins\"\` for the full list of supported providers.

### Project Templates

Initialize a new agent project with the CLI:

**Backend agents:**
\`\`\`bash
lk agent init my-agent --template agent-starter-python
lk agent init my-agent --template agent-starter-node
\`\`\`

**Frontend apps (React/Next.js, React Native, Swift, Flutter, Android):**
\`\`\`bash
lk agent init my-frontend --template agent-starter-react
lk agent init my-frontend --template agent-starter-react-native
\`\`\`

Omit \`--template\` to see all available templates interactively.'''
    c = c[:inject_point] + self_hosted_section + c[inject_point:]
else:
    print('WARNING: inference marker not found for self-hosted injection', file=sys.stderr)

# Clean up remaining MCP references throughout the document
c = c.replace('Do not skip sections even if MCP is available', 'Do not skip sections')
c = c.replace('This checklist applies regardless of whether MCP is available. MCP provides documentation access but does NOT replace the guidance in this skill.\n', '')
c = c.replace('Consult the testing documentation via MCP for current patterns:', 'Consult the testing documentation via \`lk docs\` for current patterns:')
c = c.replace('When using LiveKit documentation via MCP, note', 'When using LiveKit documentation via \`lk docs\`, note')
c = c.replace('consult the LiveKit documentation via MCP.', 'consult the LiveKit documentation via \`lk docs\`.')

open(p, 'w').write(c)
print('Patched SKILL.md')
"

# Download reference docs via lk CLI (or create placeholder files)
REF_DIR="$REPO_ROOT/$DST/livekit-agents/references"
mkdir -p "$REF_DIR"

PAGES=(
  "/home/cli:cli-reference"
  "/agents/start/voice-ai-quickstart:quickstart"
  "/home/self-hosting:self-hosting"
  "/agents/build/tools:agent-tools"
)

for entry in "${PAGES[@]}"; do
  page="${entry%%:*}"
  name="${entry##*:}"
  if command -v lk &> /dev/null; then
    lk docs get-page "$page" > "$REF_DIR/$name.md" 2> /dev/null \
      || printf '# %s\n\nSee: https://docs.livekit.io%s\n' "$name" "$page" > "$REF_DIR/$name.md"
  else
    printf '# %s\n\nSee: https://docs.livekit.io%s\n' "$name" "$page" > "$REF_DIR/$name.md"
  fi
  echo "Downloaded reference: $name.md"
done

ensure_license "$DST/livekit-agents" MIT
create_zip "$DST/livekit-agents"

echo "Done syncing livekit-skills."
