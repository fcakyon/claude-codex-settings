## hcloud datacenter describe

Describe a Datacenter

```
hcloud datacenter describe [options] <datacenter>
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

* [hcloud datacenter](hcloud_datacenter.md)	 - View Datacenters


---

## hcloud datacenter list

List Datacenters

### Synopsis

Displays a list of Datacenters.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=description,id (see available columns below).

Columns:
 - description
 - id
 - location
 - name

```
hcloud datacenter list [options]
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

* [hcloud datacenter](hcloud_datacenter.md)	 - View Datacenters


---

## hcloud iso describe

Describe an ISO

```
hcloud iso describe [options] <iso>
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

* [hcloud iso](hcloud_iso.md)	 - View ISOs


---

## hcloud iso list

List ISOs

### Synopsis

Displays a list of ISOs.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=architecture,description (see available columns below).

Columns:
 - architecture
 - description
 - id
 - name
 - type

```
hcloud iso list [options]
```

### Options

```
      --architecture strings            Only show Images of given architecture: x86|arm
  -h, --help                            help for list
      --include-architecture-wildcard   Include ISOs with unknown architecture, only required if you want so show custom ISOs and still filter for architecture. (true, false)
  -o, --output stringArray              output options: noheader|columns=...|json|yaml
  -l, --selector string                 Selector to filter by labels
  -s, --sort strings                    Determine the sorting of the result
      --type strings                    Types to include (public, private) (default [public,private])
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

* [hcloud iso](hcloud_iso.md)	 - View ISOs


---

## hcloud load-balancer-type describe

Describe a Load Balancer Type

```
hcloud load-balancer-type describe [options] <load-balancer-type>
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

* [hcloud load-balancer-type](hcloud_load-balancer-type.md)	 - View Load Balancer Types


---

## hcloud load-balancer-type list

List Load Balancer Types

### Synopsis

Displays a list of Load Balancer Types.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=description,id (see available columns below).

Columns:
 - description
 - id
 - max_assigned_certificates
 - max_connections
 - max_services
 - max_targets
 - name

```
hcloud load-balancer-type list [options]
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

* [hcloud load-balancer-type](hcloud_load-balancer-type.md)	 - View Load Balancer Types


---

## hcloud location describe

Describe a Location

```
hcloud location describe [options] <location>
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

* [hcloud location](hcloud_location.md)	 - View Locations


---

## hcloud location list

List Locations

### Synopsis

Displays a list of Locations.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=city,country (see available columns below).

Columns:
 - city
 - country
 - description
 - id
 - latitude
 - longitude
 - name
 - network_zone

```
hcloud location list [options]
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

* [hcloud location](hcloud_location.md)	 - View Locations


---

## hcloud server-type describe

Describe a Server Type

```
hcloud server-type describe [options] <server-type>
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

* [hcloud server-type](hcloud_server-type.md)	 - View Server Types


---

## hcloud server-type list

List Server Types

### Synopsis

Displays a list of Server Types.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=architecture,category (see available columns below).

Columns:
 - architecture
 - category
 - cores
 - cpu_type
 - deprecated
 - description
 - disk
 - id
 - included_traffic
 - location
 - memory
 - name
 - storage_type
 - traffic

```
hcloud server-type list [options]
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

* [hcloud server-type](hcloud_server-type.md)	 - View Server Types


---

## hcloud storage-box-type describe

Describe a Storage Box Type

```
hcloud storage-box-type describe [options] <storage-box-type>
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

* [hcloud storage-box-type](hcloud_storage-box-type.md)	 - View Storage Box Types


---

## hcloud storage-box-type list

List Storage Box Types

### Synopsis

Displays a list of Storage Box Types.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=automatic_snapshot_limit,deprecated (see available columns below).

Columns:
 - automatic_snapshot_limit
 - deprecated
 - description
 - id
 - name
 - size
 - snapshot_limit
 - subaccounts_limit

```
hcloud storage-box-type list [options]
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

* [hcloud storage-box-type](hcloud_storage-box-type.md)	 - View Storage Box Types

