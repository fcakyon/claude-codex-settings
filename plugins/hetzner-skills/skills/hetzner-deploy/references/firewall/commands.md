## hcloud firewall add-label

Add a label to a Firewall

```
hcloud firewall add-label [--overwrite] <firewall> <label>...
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall add-rule

Add a single rule to a firewall

```
hcloud firewall add-rule [options] (--direction in --source-ips <ips> | --direction out --destination-ips <ips>) (--protocol <tcp|udp> --port <port> | --protocol <icmp|esp|gre>) <firewall>
```

### Options

```
      --description string        Description of the Firewall rule
      --destination-ips strings   Destination IPs (CIDR Notation) (required when direction is out)
      --direction string          Direction (in, out) (required)
  -h, --help                      help for add-rule
      --port string               Port to which traffic will be allowed, only applicable for protocols TCP and UDP, you can specify port ranges, sample: 80-85
      --protocol string           Protocol (icmp, esp, gre, udp or tcp) (required)
      --source-ips strings        Source IPs (CIDR Notation) (required when direction is in)
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall apply-to-resource

Applies a Firewall to a single resource

```
hcloud firewall apply-to-resource (--type server --server <server> | --type label_selector --label-selector <label-selector>) <firewall>
```

### Options

```
  -h, --help                    help for apply-to-resource
  -l, --label-selector string   Label Selector
      --server string           Server name of ID (required when type is server)
      --type string             Resource Type (server, label_selector) (required)
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall create

Create a Firewall

```
hcloud firewall create [options] --name <name>
```

### Options

```
  -h, --help                   help for create
      --label stringToString   User-defined labels ('key=value') (can be specified multiple times) (default [])
      --name string            Name
  -o, --output stringArray     output options: json|yaml
      --rules-file string      JSON file containing your routes (use - to read from stdin). The structure of the file needs to be the same as within the API: https://docs.hetzner.cloud/reference/cloud#firewalls-get-a-firewall 
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall delete-rule

Delete a single rule from a Firewall

```
hcloud firewall delete-rule [options] (--direction in --source-ips <ips> | --direction out --destination-ips <ips>) (--protocol <tcp|udp> --port <port> | --protocol <icmp|esp|gre>) <firewall>
```

### Options

```
      --description string        Description of the Firewall rule
      --destination-ips strings   Destination IPs (CIDR Notation) (required when direction is out)
      --direction string          Direction (in, out) (required)
  -h, --help                      help for delete-rule
      --port string               Port to which traffic will be allowed, only applicable for protocols TCP and UDP
      --protocol string           Protocol (icmp, esp, gre, udp or tcp) (required)
      --source-ips strings        Source IPs (CIDR Notation) (required when direction is in)
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall delete

Delete a Firewall

```
hcloud firewall delete <firewall>...
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall describe

Describe a Firewall

```
hcloud firewall describe [options] <firewall>
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall list

List Firewalls

### Synopsis

Displays a list of Firewalls.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,applied_to_count (see available columns below).

Columns:
 - age
 - applied_to_count
 - created
 - id
 - labels
 - name
 - rules_count

```
hcloud firewall list [options]
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall remove-from-resource

Removes a Firewall from a single resource

```
hcloud firewall remove-from-resource (--type server --server <server> | --type label_selector --label-selector <label-selector>) <firewall>
```

### Options

```
  -h, --help                    help for remove-from-resource
  -l, --label-selector string   Label Selector
      --server string           Server name of ID (required when type is server)
      --type string             Resource Type (server) (required)
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall remove-label

Remove a label from a Firewall

```
hcloud firewall remove-label <firewall> (--all | <label>...)
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall replace-rules

Replaces all rules from a Firewall from a file

```
hcloud firewall replace-rules --rules-file <file> <firewall>
```

### Options

```
  -h, --help                help for replace-rules
      --rules-file string   JSON file containing your routes (use - to read from stdin). The structure of the file needs to be the same as within the API: https://docs.hetzner.cloud/reference/cloud#firewalls-get-a-firewall
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls


---

## hcloud firewall update

Update a Firewall

```
hcloud firewall update [options] <firewall>
```

### Options

```
  -h, --help          help for update
      --name string   Firewall name
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

* [hcloud firewall](hcloud_firewall.md)	 - Manage Firewalls

