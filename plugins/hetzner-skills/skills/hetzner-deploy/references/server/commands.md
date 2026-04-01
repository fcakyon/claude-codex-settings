## hcloud server add-label

Add a label to a Server

```
hcloud server add-label [--overwrite] <server> <label>...
```

### Options

```
  -h, --help        help for add-label
  -o, --overwrite   Overwrite label if it exists already (true, false)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server add-to-placement-group

Add a Server to a Placement Group

```
hcloud server add-to-placement-group --placement-group <placement-group> <server>
```

### Options

```
  -h, --help                     help for add-to-placement-group
  -g, --placement-group string   Placement Group (ID or name) (required)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server attach-iso

Attach an ISO to a server

```
hcloud server attach-iso <server> <iso>
```

### Options

```
  -h, --help   help for attach-iso
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server attach-to-network

Attach a Server to a Network

```
hcloud server attach-to-network [options] --network <network> <server>
```

### Options

```
      --alias-ips ipSlice   Additional IP addresses to be assigned to the Server (default [])
  -h, --help                help for attach-to-network
      --ip ip               IP address to assign to the Server (auto-assigned if omitted)
      --ip-range ipNet      IP range in CIDR block notation of the subnet to attach to (auto-assigned if omitted)
  -n, --network string      Network (ID or name) (required)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server change-alias-ips

Change a server's alias IPs in a Network

```
hcloud server change-alias-ips [options] --network <network> <server>
```

### Options

```
      --alias-ips strings   New alias IPs
      --clear               Remove all alias IPs
  -h, --help                help for change-alias-ips
  -n, --network string      Network (ID or name) (required)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server change-type

Change type of a server

```
hcloud server change-type [--keep-disk] <server> <server-type>
```

### Options

```
  -h, --help        help for change-type
      --keep-disk   Keep disk size of current Server Type. This enables downgrading the server. (true, false)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server create-image

Create an Image from a Server

```
hcloud server create-image [options] --type <snapshot|backup> <server>
```

### Options

```
      --description string     Image description
  -h, --help                   help for create-image
      --label stringToString   User-defined labels ('key=value') (can be specified multiple times) (default [])
      --type string            Image type (backup, snapshot) (required)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server create

Create a Server

### Synopsis

Create a Server.

The --datacenter flag is deprecated. Use --location instead.
See https://docs.hetzner.cloud/changelog#2025-12-16-phasing-out-datacenters.

```
hcloud server create [options] --name <name> --type <server-type> --image <image>
```

### Options

```
      --allow-deprecated-image            Enable the use of deprecated Images (default: false) (true, false)
      --automount                         Automount Volumes after attach (default: false) (true, false)
      --datacenter string                 Datacenter (ID or name) (deprecated)
      --enable-backup                     Enable automatic backups (true, false)
      --enable-protection strings         Enable protection (delete, rebuild) (default: none)
      --firewall strings                  ID or name of Firewall to attach the Server to (can be specified multiple times)
  -h, --help                              help for create
      --image string                      Image (ID or name) (required)
      --label stringToString              User-defined labels ('key=value') (can be specified multiple times) (default [])
      --location string                   Location (ID or name)
      --name string                       Server name (required)
      --network strings                   ID or name of Network to attach the Server to (can be specified multiple times)
  -o, --output stringArray                output options: json|yaml
      --placement-group string            Placement Group (ID of name)
      --primary-ipv4 string               Primary IPv4 (ID of name)
      --primary-ipv6 string               Primary IPv6 (ID of name)
      --ssh-key strings                   ID or name of SSH Key to inject (can be specified multiple times)
      --start-after-create                Start Server right after creation (true, false) (default true)
      --type string                       Server Type (ID or name) (required)
      --user-data-from-file stringArray   Read user data from specified file (use - to read from stdin)
      --volume strings                    ID or name of Volume to attach (can be specified multiple times)
      --without-ipv4                      Creates the Server without an IPv4 (default: false) (true, false)
      --without-ipv6                      Creates the Server without an IPv6 (default: false) (true, false)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server delete

Delete a server

```
hcloud server delete <server>...
```

### Options

```
  -h, --help   help for delete
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server describe

Describe a Server

```
hcloud server describe [options] <server>
```

### Options

```
  -h, --help                 help for describe
  -o, --output stringArray   output options: json|yaml|format
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server detach-from-network

Detach a Server from a Network

```
hcloud server detach-from-network --network <network> <server>
```

### Options

```
  -h, --help             help for detach-from-network
  -n, --network string   Network (ID or name) (required)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server detach-iso

Detach an ISO from a Server

```
hcloud server detach-iso <server>
```

### Options

```
  -h, --help   help for detach-iso
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server disable-backup

Disable backup for a server

```
hcloud server disable-backup <server>
```

### Options

```
  -h, --help   help for disable-backup
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server disable-protection

Disable resource protection for a Server

```
hcloud server disable-protection <server> (delete|rebuild)...
```

### Options

```
  -h, --help   help for disable-protection
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server disable-rescue

Disable rescue for a server

```
hcloud server disable-rescue <server>
```

### Options

```
  -h, --help   help for disable-rescue
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server enable-backup

Enable backup for a server

```
hcloud server enable-backup <server>
```

### Options

```
  -h, --help            help for enable-backup
      --window string   (deprecated) The time window for the daily backup to run. All times are in UTC. 22-02 means that the backup will be started between 10 PM and 2 AM.
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server enable-protection

Enable resource protection for a Server

```
hcloud server enable-protection <server> (delete|rebuild)...
```

### Options

```
  -h, --help   help for enable-protection
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server enable-rescue

Enable rescue for a server

```
hcloud server enable-rescue [options] <server>
```

### Options

```
  -h, --help              help for enable-rescue
      --ssh-key strings   ID or name of SSH Key to inject (can be specified multiple times)
      --type string       Rescue type (default "linux64")
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server ip

Print a server's IP address

```
hcloud server ip [--ipv6] <server>
```

### Options

```
  -h, --help   help for ip
  -6, --ipv6   Print the first address of the Server's Primary IPv6 network
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server list

List Servers

### Synopsis

Displays a list of Servers.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,backup_window (see available columns below).

Columns:
 - age
 - backup_window
 - created
 - datacenter
 - id
 - included_traffic
 - ingoing_traffic
 - ipv4
 - ipv6
 - labels
 - location
 - locked
 - name
 - outgoing_traffic
 - placement_group
 - primary_disk_size
 - private_net
 - protection
 - rescue_enabled
 - status
 - type
 - volumes

```
hcloud server list [options]
```

### Options

```
  -h, --help                 help for list
  -o, --output stringArray   output options: noheader|columns=...|json|yaml
  -l, --selector string      Selector to filter by labels
  -s, --sort strings         Determine the sorting of the result
      --status strings       Only Servers with one of these statuses are displayed
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server metrics

[ALPHA] Metrics from a Server

```
hcloud server metrics [options] (--type <cpu|disk|network>)... <server>
```

### Options

```
      --end string           ISO 8601 timestamp
  -h, --help                 help for metrics
  -o, --output stringArray   output options: json|yaml
      --start string         ISO 8601 timestamp
      --type strings         Types of metrics you want to show
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server poweroff

Poweroff a Server

```
hcloud server poweroff <server>
```

### Options

```
  -h, --help   help for poweroff
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server poweron

Poweron a server

```
hcloud server poweron <server>
```

### Options

```
  -h, --help   help for poweron
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server reboot

Reboot a server

```
hcloud server reboot <server>
```

### Options

```
  -h, --help   help for reboot
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server rebuild

Rebuild a server

```
hcloud server rebuild [options] --image <image> <server>
```

### Options

```
      --allow-deprecated-image            Enable the use of deprecated images (default: false) (true, false)
  -h, --help                              help for rebuild
      --image string                      ID or name of Image to rebuild from (required)
      --user-data-from-file stringArray   Read user data from specified file (use - to read from stdin)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server remove-from-placement-group

Removes a Server from a Placement Group

```
hcloud server remove-from-placement-group <server>
```

### Options

```
  -h, --help   help for remove-from-placement-group
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server remove-label

Remove a label from a Server

```
hcloud server remove-label <server> (--all | <label>...)
```

### Options

```
  -a, --all    Remove all labels
  -h, --help   help for remove-label
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server request-console

Request a WebSocket VNC console for a Server

```
hcloud server request-console [options] <server>
```

### Options

```
  -h, --help                 help for request-console
  -o, --output stringArray   output options: json|yaml
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server reset-password

Reset the root password of a Server

```
hcloud server reset-password [options] <server>
```

### Options

```
  -h, --help                 help for reset-password
  -o, --output stringArray   output options: json|yaml
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server reset

Reset a Server

```
hcloud server reset [options] <server>
```

### Options

```
  -h, --help   help for reset
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server set-rdns

Change reverse DNS of a Server

```
hcloud server set-rdns [--ip <ip>] (--hostname <hostname> | --reset) <server>
```

### Options

```
  -h, --help              help for set-rdns
  -r, --hostname string   Hostname to set as a reverse DNS PTR entry
  -i, --ip ip             IP address for which the reverse DNS entry should be set
      --reset             Reset the reverse DNS entry to the default value (true, false)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server shutdown

Shutdown a server

### Synopsis

Shuts down a Server gracefully by sending an ACPI shutdown request. The Server operating system must support ACPI and react to the request, otherwise the Server will not shut down. Use the --wait flag to wait for the Server to shut down before returning.

```
hcloud server shutdown [options] <server>
```

### Options

```
  -h, --help                    help for shutdown
      --wait                    Wait for the Server to shut down before exiting (true, false)
      --wait-timeout duration   Timeout for waiting for off state after shutdown (default 30s)
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server ssh

Spawn an SSH connection for the Server

```
hcloud server ssh [options] <server> [--] [ssh options] [command [argument...]]
```

### Options

```
  -h, --help          help for ssh
      --ipv6          Establish SSH connection to IPv6 address (true, false)
  -p, --port int      Port for SSH connection (default 22)
  -u, --user string   Username for SSH connection (default "root")
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers


---

## hcloud server update

Update a Server

```
hcloud server update [options] <server>
```

### Options

```
  -h, --help          help for update
      --name string   Server name
```

### Options inherited from parent commands

```
      --config string              Config file path (default "~/.config/hcloud/cli.toml")
      --context string             Currently active context
      --debug                      Enable debug output
      --debug-file string          File to write debug output to
      --endpoint string            Hetzner Cloud API endpoint (default "https://api.hetzner.cloud/v1")
      --hetzner-endpoint string    Hetzner API endpoint (default "https://api.hetzner.com/v1")
      --no-experimental-warnings   If true, experimental warnings are not shown
      --poll-interval duration     Interval at which to poll information, for example action progress (default 500ms)
      --quiet                      If true, only print error messages
```

### SEE ALSO

* [hcloud server](hcloud_server.md)	 - Manage Servers

