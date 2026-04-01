## hcloud primary-ip add-label

Add a label to a Primary IP

```
hcloud primary-ip add-label [--overwrite] <primary-ip> <label>...
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip assign

Assign a Primary IP to an assignee (usually a Server)

```
hcloud primary-ip assign --server <server> <primary-ip>
```

### Options

```
  -h, --help            help for assign
      --server string   Name or ID of the Server
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip create

Create a Primary IP

### Synopsis

Create a Primary IP.

The --datacenter flag is deprecated. Use --location or --assignee-id instead.
See https://docs.hetzner.cloud/changelog#2025-12-16-phasing-out-datacenters.

```
hcloud primary-ip create [options] --type <ipv4|ipv6> --name <name>
```

### Options

```
      --assignee-id int             Assignee (usually a Server) to assign Primary IP to
      --assignee-type string        Assignee Type to assign Primary IP to (default: server) (default "server")
      --auto-delete                 Delete Primary IP if assigned resource is deleted (true, false)
      --datacenter string           Datacenter (name) (deprecated)
      --enable-protection strings   Enable protection (delete) (default: none)
  -h, --help                        help for create
      --label stringToString        User-defined labels ('key=value') (can be specified multiple times) (default [])
      --location string             Location (ID or name) of Primary IP
      --name string                 Name (required)
  -o, --output stringArray          output options: json|yaml
      --type string                 Type (ipv4 or ipv6) (required)
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip delete

Delete a Primary IP

```
hcloud primary-ip delete <primary-ip>...
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip describe

Describe a Primary IP

```
hcloud primary-ip describe [options] <primary-ip>
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip disable-protection

Disable resource protection for a Primary IP

```
hcloud primary-ip disable-protection <primary-ip> [delete]
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip enable-protection

Enable resource protection for a Primary IP

```
hcloud primary-ip enable-protection <primary-ip> [delete]
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip list

List Primary IPs

### Synopsis

Displays a list of Primary IPs.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,assignee (see available columns below).

Columns:
 - age
 - assignee
 - assignee_id
 - assignee_type
 - auto_delete
 - blocked
 - created
 - dns
 - id
 - ip
 - labels
 - name
 - protection
 - type

```
hcloud primary-ip list [options]
```

### Options

```
  -h, --help                 help for list
  -o, --output stringArray   output options: noheader|columns=...|json|yaml
  -l, --selector string      Selector to filter by labels
  -s, --sort strings         Determine the sorting of the result
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip remove-label

Remove a label from a Primary IP

```
hcloud primary-ip remove-label <primary-ip> (--all | <label>...)
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip set-rdns

Change reverse DNS of a Primary IP

```
hcloud primary-ip set-rdns [--ip <ip>] (--hostname <hostname> | --reset) <primary-ip>
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip unassign

Unassign a Primary IP from an assignee (usually a server)

```
hcloud primary-ip unassign <primary-ip>
```

### Options

```
  -h, --help   help for unassign
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs


---

## hcloud primary-ip update

Update a Primary IP

```
hcloud primary-ip update [options] <primary-ip>
```

### Options

```
      --auto-delete   Delete this Primary IP when the resource it is assigned to is deleted (true, false)
  -h, --help          help for update
      --name string   Primary IP name
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

* [hcloud primary-ip](hcloud_primary-ip.md)	 - Manage Primary IPs

