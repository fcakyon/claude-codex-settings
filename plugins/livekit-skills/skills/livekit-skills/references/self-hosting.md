## /home/self-hosting

LiveKit docs › Self-hosting › Running locally

---

# Running LiveKit locally

> This will get a LiveKit instance up and running, ready to receive audio and video streams from participants.

### Install LiveKit Server

**macOS**:

```text
brew update && brew install livekit

```

---

**Linux**:

```text
curl -sSL https://get.livekit.io | bash

```

---

**Windows**:

Download the latest release [here](https://github.com/livekit/livekit/releases/latest).

### Start the server in dev mode

You can start LiveKit in development mode by running:

```text
livekit-server --dev

```

This will start an instance using the following API key/secret pair:

```text
API key: devkey
API secret: secret

```

To customize your setup for production, refer to our [deployment guides](https://docs.livekit.io/transport/self-hosting/deployment.md).

> 💡 **Tip**
> 
> By default LiveKit's signal server binds to `127.0.0.1:7880`. If you'd like to access it from other devices on your network, pass in `--bind 0.0.0.0`

---

For the latest version of this document, see [https://docs.livekit.io/transport/self-hosting/local.md](https://docs.livekit.io/transport/self-hosting/local.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).
