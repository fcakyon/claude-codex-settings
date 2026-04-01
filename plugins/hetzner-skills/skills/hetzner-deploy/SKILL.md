---
name: hetzner-deploy
description: This skill should be used when user asks to "deploy to Hetzner", "create Hetzner server", "manage Hetzner Cloud", "hcloud CLI", or works with Hetzner Cloud infrastructure including servers, networks, firewalls, load balancers, DNS zones, and volumes.
references:
  - server
  - network
  - firewall
  - getting-started
license: MIT
---

# Hetzner Cloud CLI Skill

Skill for provisioning and managing infrastructure on Hetzner Cloud using the `hcloud` CLI. Use the decision trees below to find the right command group, then load detailed references.

Your knowledge of Hetzner Cloud pricing, server types, locations, and API behavior may be outdated. **Prefer retrieval over pre-training** when citing specific numbers, available types, or configuration options. The reference files alongside this skill are starting points extracted from the official CLI docs.

## Authentication

The CLI authenticates via API token. Set the `HCLOUD_TOKEN` environment variable or create a named context:

```bash
# Stateless (CI, scripting, agent use)
export HCLOUD_TOKEN="your-api-token"

# Named context (interactive use)
hcloud context create my-project
```

Generate tokens at https://console.hetzner.cloud under your project's Security > API Tokens.

## Installation

```bash
# macOS / Linux (Homebrew)
brew install hcloud

# Linux (binary)
curl -sSLO https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz
sudo tar -C /usr/local/bin --no-same-owner -xzf hcloud-linux-amd64.tar.gz hcloud

# Docker
docker run --rm -e HCLOUD_TOKEN="$HCLOUD_TOKEN" hetznercloud/cli:latest <command>
```

## Quick Decision Trees

### "I need compute"

```
Need a server?
├─ Create a new server → hcloud server create --name <n> --type <t> --image <img>
├─ With cloud-init user data → add --user-data-from-file <path>
├─ With firewall + network → add --firewall <fw> --network <net>
├─ List available types → hcloud server-type list
├─ List available images → hcloud image list
├─ SSH into server → hcloud server ssh <name>
├─ Create snapshot → hcloud server create-image --type snapshot <name>
├─ Rescue mode → hcloud server enable-rescue <name>
└─ Delete server → hcloud server delete <name>
```

### "I need networking"

```
Need networking?
├─ Private network (VPC) → hcloud network create --name <n> --ip-range <cidr>
│  ├─ Add subnet → hcloud network add-subnet --network <n> --type cloud --network-zone <z> --ip-range <cidr>
│  └─ Attach server → hcloud server attach-to-network --network <n> --server <s>
├─ Firewall → hcloud firewall create --name <n> --rules-file <json>
│  ├─ Apply to server → hcloud firewall apply-to-resource --firewall <n> --type server --server <s>
│  └─ Replace rules → hcloud firewall replace-rules --rules-file <json> <name>
├─ Load balancer → hcloud load-balancer create --name <n> --type <t> --location <loc>
│  ├─ Add target → hcloud load-balancer add-target --server <s> <lb>
│  └─ Add service → hcloud load-balancer add-service --protocol <p> --listen-port <port> <lb>
├─ Floating IP → hcloud floating-ip create --type ipv4 --home-location <loc>
│  └─ Assign → hcloud floating-ip assign <ip> --server <s>
└─ Primary IP → hcloud primary-ip create --name <n> --type ipv4 --datacenter <dc>
```

### "I need storage"

```
Need storage?
├─ Block volume → hcloud volume create --name <n> --size <gb> --server <s> --automount --format ext4
│  ├─ Resize → hcloud volume resize --size <gb> <name>
│  └─ Detach → hcloud volume detach <name>
└─ Storage Box (managed NFS/CIFS/SCP) → hcloud storage-box create --name <n> --type <t> --location <loc>
   ├─ Subaccounts → hcloud storage-box subaccount create <box>
   └─ Snapshots → hcloud storage-box snapshot create <box>
```

### "I need DNS"

```
Need DNS?
├─ Create zone → hcloud zone create --name <domain>
├─ Add records → hcloud zone add-records --zone <z> --type A --name <n> --value <ip>
├─ Set full record set → hcloud zone set-records --zone <z> --type A --name <n> --value <ip1> --value <ip2>
├─ Import zone file → hcloud zone import-zonefile --zone <z> <file>
├─ Export zone file → hcloud zone export-zonefile <zone>
└─ Manage individual RRSets → hcloud zone rrset list <zone>
```

### "I need info"

```
Need reference data?
├─ Server types + pricing → hcloud server-type list / describe <type>
├─ Locations → hcloud location list / describe <loc>
├─ Datacenters → hcloud datacenter list / describe <dc>
├─ Available images → hcloud image list
├─ ISO images → hcloud iso list
├─ Load balancer types → hcloud load-balancer-type list
└─ Storage box types → hcloud storage-box-type list
```

### "I need to configure the CLI"

```
Need CLI config?
├─ Create context → hcloud context create <name>
├─ Switch context → hcloud context use <name>
├─ Set default SSH key → hcloud config set default-ssh-keys <key>
├─ View config → hcloud config list
└─ Shell completion → hcloud completion bash/zsh/fish
```

## Common Workflows

### Quick server deploy

```bash
# Upload SSH key, create server, connect
hcloud ssh-key create --name deploy-key --public-key-from-file ~/.ssh/id_ed25519.pub
hcloud server create --name web-1 --type cpx21 --image ubuntu-24.04 --ssh-key deploy-key --location fsn1
hcloud server ssh web-1
```

### Full stack with network + firewall

```bash
# Network
hcloud network create --name prod-net --ip-range 10.0.0.0/16
hcloud network add-subnet --network prod-net --type cloud --network-zone eu-central --ip-range 10.0.1.0/24

# Firewall (allow SSH + HTTP/S)
cat > rules.json << 'EOF'
[
  {"direction":"in","protocol":"tcp","port":"22","source_ips":["0.0.0.0/0","::/0"]},
  {"direction":"in","protocol":"tcp","port":"80","source_ips":["0.0.0.0/0","::/0"]},
  {"direction":"in","protocol":"tcp","port":"443","source_ips":["0.0.0.0/0","::/0"]}
]
EOF
hcloud firewall create --name web-fw --rules-file rules.json

# Server with network + firewall
hcloud server create --name app-1 --type cpx21 --image ubuntu-24.04 \
  --ssh-key deploy-key --network prod-net --firewall web-fw --location fsn1

# Load balancer
hcloud load-balancer create --name web-lb --type lb11 --location fsn1
hcloud load-balancer attach-to-network --network prod-net web-lb
hcloud load-balancer add-target --server app-1 web-lb
hcloud load-balancer add-service --protocol tcp --listen-port 80 --destination-port 80 web-lb
```

## Output Formats

All `describe`, `list`, and `create` commands support structured output for scripting and agent use:

```bash
hcloud server list --output json          # JSON array
hcloud server describe my-srv --output yaml  # YAML
hcloud server describe my-srv --output format='{{.ServerType.Cores}}'  # Go template
hcloud server list --output columns=id,name,status  # Custom table columns
```

## Resource Index

### Compute
| Resource | Reference |
|----------|-----------|
| Server | `references/server/` |
| Server Types | `references/info/` |

### Networking
| Resource | Reference |
|----------|-----------|
| Network (VPC) | `references/network/` |
| Firewall | `references/firewall/` |
| Load Balancer | `references/load-balancer/` |
| Floating IP | `references/floating-ip/` |
| Primary IP | `references/primary-ip/` |

### Storage
| Resource | Reference |
|----------|-----------|
| Volume | `references/volume/` |
| Storage Box | `references/storage-box/` |

### DNS
| Resource | Reference |
|----------|-----------|
| Zone & Records | `references/dns/` |

### Security & Access
| Resource | Reference |
|----------|-----------|
| SSH Key | `references/ssh-key/` |
| Certificate | `references/certificate/` |
| Image | `references/image/` |
| Placement Group | `references/placement-group/` |

### Reference Data
| Resource | Reference |
|----------|-----------|
| Server Types, LB Types, Storage Box Types, Datacenters, Locations, ISOs | `references/info/` |

### CLI Configuration
| Resource | Reference |
|----------|-----------|
| Config, Context, Completion | `references/config/` |
| All Resources | `references/all/` |

### Getting Started
| Resource | Reference |
|----------|-----------|
| Setup, Server Tutorial, Output Options, Configuration | `references/getting-started/` |
