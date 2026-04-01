## hcloud zone add-label

Add a label to a Zone

```
hcloud zone add-label [--overwrite] <zone> <label>...
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone add-records

Add records to a Zone RRSet

### Synopsis

Add records to a Zone RRSet.

If the Zone RRSet doesn't exist, it will automatically be created.

The optional records file has to be in JSON format. You can find the schema at https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset

Example file content:

[
  {
    "value": "198.51.100.1",
    "comment": "My web server at Hetzner Cloud."
  },
  {
    "value": "198.51.100.2",
    "comment": "My other server at Hetzner Cloud."
  }
]

```
hcloud zone add-records (--record <value>... | --records-file <file>) <zone> <name> <type>
```

### Options

```
  -h, --help                  help for add-records
      --record stringArray    List of records (can be specified multiple times, conflicts with --records-file)
      --records-file string   JSON file containing the records (conflicts with --record)
      --ttl int               Time To Live (TTL) of the Zone RRSet
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone change-primary-nameservers

Changes the primary nameservers of a secondary Zone

### Synopsis

Changes the primary nameservers of a secondary Zone.

Input file has to be in JSON format. You can find the schema at
https://docs.hetzner.cloud/reference/cloud#zone-actions-change-a-zones-primary-nameservers

Example file content:

[
  {
    "address": "203.0.113.10"
  },
  {
    "address": "203.0.113.11",
    "port": 5353
  },
  {
    "address": "203.0.113.12",
    "tsig_algorithm": "hmac-sha256",
    "tsig_key": "example-key"
  }
]

```
hcloud zone change-primary-nameservers --primary-nameservers-file <file> <zone>
```

### Options

```
  -h, --help                              help for change-primary-nameservers
      --primary-nameservers-file string   JSON file containing the new primary nameservers. (use - to read from stdin)
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone change-ttl

Changes the default Time To Live (TTL) of a Zone

```
hcloud zone change-ttl --ttl <ttl> <zone>
```

### Options

```
  -h, --help      help for change-ttl
      --ttl int   Default Time To Live (TTL) of the Zone (required) (default 3600)
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone create

Create a Zone

```
hcloud zone create [options] --name <name> [--mode secondary --primary-nameservers <file>]
```

### Options

```
      --enable-protection strings         Enable protection (delete) (default: none)
  -h, --help                              help for create
      --label stringToString              User-defined labels ('key=value') (can be specified multiple times) (default [])
      --mode string                       Mode of the Zone (primary, secondary) (default "primary")
      --name string                       Zone name (required)
  -o, --output stringArray                output options: json|yaml
      --primary-nameservers-file string   JSON file containing the new primary nameservers. (See 'hcloud zone change-primary-nameservers -h' for help)
      --ttl int                           Default Time To Live (TTL) of the Zone
      --zonefile string                   Zone file in BIND (RFC 1034/1035) format (use - to read from stdin)
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone delete

Delete a Zone

```
hcloud zone delete <zone>...
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone describe

Describe a Zone

```
hcloud zone describe [options] <zone>
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone disable-protection

Disable resource protection for a Zone

```
hcloud zone disable-protection <zone> delete
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone enable-protection

Enable resource protection for a Zone

```
hcloud zone enable-protection <zone> delete
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone export-zonefile

Returns a generated Zone file in BIND (RFC 1034/1035) format

```
hcloud zone export-zonefile [options] <zone>
```

### Options

```
  -h, --help                 help for export-zonefile
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone import-zonefile

Imports a zone file, replacing all Zone RRSets

```
hcloud zone import-zonefile --zonefile <file> <zone>
```

### Options

```
  -h, --help                 help for import-zonefile
  -o, --output stringArray   output options: json|yaml
      --zonefile string      Zone file in BIND (RFC 1034/1035) format (use - to read from stdin)
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone list

List Zones

### Synopsis

Displays a list of Zones.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,authoritative_nameservers (see available columns below).

Columns:
 - age
 - authoritative_nameservers
 - created
 - id
 - labels
 - mode
 - name
 - name_idna
 - primary_nameservers
 - protection
 - record_count
 - registrar
 - status
 - ttl

```
hcloud zone list [options]
```

### Options

```
  -h, --help                 help for list
      --mode string          Only Zones with this mode are displayed
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone remove-label

Remove a label from a Zone

```
hcloud zone remove-label <zone> (--all | <label>...)
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone remove-records

Remove records from a Zone RRSet.

### Synopsis

Remove records from a Zone RRSet.

If the Zone RRSet doesn't contain any records, it will automatically be deleted.

The optional records file has to be in JSON format. You can find the schema at https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset

Example file content:

[
  {
    "value": "198.51.100.1",
    "comment": "My web server at Hetzner Cloud."
  },
  {
    "value": "198.51.100.2",
    "comment": "My other server at Hetzner Cloud."
  }
]

```
hcloud zone remove-records (--record <value>... | --records-file <file>) <zone> <name> <type>
```

### Options

```
  -h, --help                  help for remove-records
      --record stringArray    List of records (can be specified multiple times, conflicts with --records-file)
      --records-file string   JSON file containing the records (conflicts with --record)
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)


---

## hcloud zone rrset

Manage Zone RRSets (records)

### Synopsis


For more details, see the documentation for Zones https://docs.hetzner.cloud/reference/cloud#zones
or Zone RRSets https://docs.hetzner.cloud/reference/cloud#zone-rrsets.

TXT records format must consist of one or many quoted strings of 255 characters. If the
user provider TXT records are not quoted, they will be formatted for you.

### Options

```
  -h, --help   help for rrset
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)
* [hcloud zone rrset add-label](hcloud_zone_rrset_add-label.md)	 - Add a label to a Zone RRSet
* [hcloud zone rrset add-records](hcloud_zone_rrset_add-records.md)	 - Add records to a Zone RRSet
* [hcloud zone rrset change-ttl](hcloud_zone_rrset_change-ttl.md)	 - Changes the Time To Live (TTL) of a Zone RRSet
* [hcloud zone rrset create](hcloud_zone_rrset_create.md)	 - Create a Zone RRSet
* [hcloud zone rrset delete](hcloud_zone_rrset_delete.md)	 - Delete a Zone RRSet
* [hcloud zone rrset describe](hcloud_zone_rrset_describe.md)	 - Describe a Zone RRSet
* [hcloud zone rrset disable-protection](hcloud_zone_rrset_disable-protection.md)	 - Disable resource protection for a Zone RRSet
* [hcloud zone rrset enable-protection](hcloud_zone_rrset_enable-protection.md)	 - Enable resource protection for a Zone RRSet
* [hcloud zone rrset list](hcloud_zone_rrset_list.md)	 - List Zone RRSets
* [hcloud zone rrset remove-label](hcloud_zone_rrset_remove-label.md)	 - Remove a label from a Zone RRSet
* [hcloud zone rrset remove-records](hcloud_zone_rrset_remove-records.md)	 - Remove records from a Zone RRSet.
* [hcloud zone rrset set-records](hcloud_zone_rrset_set-records.md)	 - Set the records of a Zone RRSet


---

## hcloud zone rrset add-label

Add a label to a Zone RRSet

```
hcloud zone rrset add-label [--overwrite] <zone> <name> <type> <label>...
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset add-records

Add records to a Zone RRSet

### Synopsis

Add records to a Zone RRSet.

If the Zone RRSet doesn't exist, it will automatically be created.

The optional records file has to be in JSON format. You can find the schema at https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset

Example file content:

[
  {
    "value": "198.51.100.1",
    "comment": "My web server at Hetzner Cloud."
  },
  {
    "value": "198.51.100.2",
    "comment": "My other server at Hetzner Cloud."
  }
]

```
hcloud zone rrset add-records (--record <value>... | --records-file <file>) <zone> <name> <type>
```

### Options

```
  -h, --help                  help for add-records
      --record stringArray    List of records (can be specified multiple times, conflicts with --records-file)
      --records-file string   JSON file containing the records (conflicts with --record)
      --ttl int               Time To Live (TTL) of the Zone RRSet
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset change-ttl

Changes the Time To Live (TTL) of a Zone RRSet

```
hcloud zone rrset change-ttl (--ttl <ttl> | --unset) <zone> <name> <type>
```

### Options

```
  -h, --help      help for change-ttl
      --ttl int   Time To Live (TTL) of the Zone RRSet (required)
      --unset     Unset the Time To Live of Zone RRSet (use the Zone default TTL instead)
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset create

Create a Zone RRSet

### Synopsis

Create a Zone RRSet.

The optional records file has to be in JSON format. You can find the schema at https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset

Example file content:

[
  {
    "value": "198.51.100.1",
    "comment": "My web server at Hetzner Cloud."
  },
  {
    "value": "198.51.100.2",
    "comment": "My other server at Hetzner Cloud."
  }
]

```
hcloud zone rrset create [options] --name <name> --type <A|AAAA|CAA|CNAME|DS|HINFO|HTTPS|MX|NS|PTR|RP|SOA|SRV|SVCB|TLSA|TXT> (--record <record>... | --records-file <file>) <zone>
```

### Options

```
  -h, --help                   help for create
      --label stringToString   User-defined labels ('key=value') (can be specified multiple times) (default [])
      --name string            Name of the Zone RRSet (required)
  -o, --output stringArray     output options: json|yaml
      --record stringArray     List of records (can be specified multiple times, conflicts with --records-file)
      --records-file string    JSON file containing the records (conflicts with --record)
      --ttl int                Time To Live (TTL) of the RRSet
      --type string            Type of the Zone RRSet (required)
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset delete

Delete a Zone RRSet

```
hcloud zone rrset delete <zone> <name> <type>
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset describe

Describe a Zone RRSet

```
hcloud zone rrset describe [options] <zone> <name> <type>
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset disable-protection

Disable resource protection for a Zone RRSet

```
hcloud zone rrset disable-protection <zone> <name> <type> change
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset enable-protection

Enable resource protection for a Zone RRSet

```
hcloud zone rrset enable-protection <zone> <name> <type> change
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset list

List Zone RRSets

### Synopsis

Displays a list of Zone RRSets.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=id,labels (see available columns below).

Columns:
 - id
 - labels
 - name
 - protection
 - records
 - ttl
 - type

```
hcloud zone rrset list [options] <zone>
```

### Options

```
  -h, --help                 help for list
  -o, --output stringArray   output options: noheader|columns=...|json|yaml
  -l, --selector string      Selector to filter by labels
  -s, --sort strings         Determine the sorting of the result
      --type strings         Only Zone RRSets with one of these types are displayed
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset remove-label

Remove a label from a Zone RRSet

```
hcloud zone rrset remove-label <zone> <name> <type> (--all | <label>...)
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset remove-records

Remove records from a Zone RRSet.

### Synopsis

Remove records from a Zone RRSet.

If the Zone RRSet doesn't contain any records, it will automatically be deleted.

The optional records file has to be in JSON format. You can find the schema at https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset

Example file content:

[
  {
    "value": "198.51.100.1",
    "comment": "My web server at Hetzner Cloud."
  },
  {
    "value": "198.51.100.2",
    "comment": "My other server at Hetzner Cloud."
  }
]

```
hcloud zone rrset remove-records (--record <value>... | --records-file <file>) <zone> <name> <type>
```

### Options

```
  -h, --help                  help for remove-records
      --record stringArray    List of records (can be specified multiple times, conflicts with --records-file)
      --records-file string   JSON file containing the records (conflicts with --record)
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone rrset set-records

Set the records of a Zone RRSet

### Synopsis

Set the records of a Zone RRSet.

- If the Zone RRSet doesn't exist, it will be created.
- If the Zone RRSet already exists, its records will be replaced.
- If the provided records are empty, the Zone RRSet will be deleted.

The optional records file has to be in JSON format. You can find the schema at https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset

Example file content:

[
  {
    "value": "198.51.100.1",
    "comment": "My web server at Hetzner Cloud."
  },
  {
    "value": "198.51.100.2",
    "comment": "My other server at Hetzner Cloud."
  }
]

```
hcloud zone rrset set-records (--record <value>... | --records-file <file>) <zone> <name> <type>
```

### Options

```
  -h, --help                  help for set-records
      --record stringArray    List of records (can be specified multiple times, conflicts with --records-file)
      --records-file string   JSON file containing the records (conflicts with --record)
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

* [hcloud zone rrset](hcloud_zone_rrset.md)	 - Manage Zone RRSets (records)


---

## hcloud zone set-records

Set the records of a Zone RRSet

### Synopsis

Set the records of a Zone RRSet.

- If the Zone RRSet doesn't exist, it will be created.
- If the Zone RRSet already exists, its records will be replaced.
- If the provided records are empty, the Zone RRSet will be deleted.

The optional records file has to be in JSON format. You can find the schema at https://docs.hetzner.cloud/reference/cloud#zone-rrset-actions-set-records-of-an-rrset

Example file content:

[
  {
    "value": "198.51.100.1",
    "comment": "My web server at Hetzner Cloud."
  },
  {
    "value": "198.51.100.2",
    "comment": "My other server at Hetzner Cloud."
  }
]

```
hcloud zone set-records (--record <value>... | --records-file <file>) <zone> <name> <type>
```

### Options

```
  -h, --help                  help for set-records
      --record stringArray    List of records (can be specified multiple times, conflicts with --records-file)
      --records-file string   JSON file containing the records (conflicts with --record)
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

* [hcloud zone](hcloud_zone.md)	 - Manage DNS Zones and Zone RRSets (records)

