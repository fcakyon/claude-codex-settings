## hcloud certificate add-label

Add a label to a Certificate

```
hcloud certificate add-label [--overwrite] <certificate> <label>...
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates


---

## hcloud certificate create

Create or upload a Certificate

```
hcloud certificate create [options] --name <name> (--type managed --domain <domain> | --type uploaded --cert-file <file> --key-file <file>)
```

### Options

```
      --cert-file string       File containing the PEM encoded certificate (required if type is uploaded)
      --domain strings         One or more domains the Certificate is valid for.
  -h, --help                   help for create
      --key-file string        File containing the PEM encoded private key for the certificate (required if type is uploaded)
      --label stringToString   User-defined labels ('key=value') (can be specified multiple times) (default [])
      --name string            Certificate name (required)
  -o, --output stringArray     output options: json|yaml
  -t, --type string            Type of Certificate to create. Valid choices: uploaded, managed (default "uploaded")
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates


---

## hcloud certificate delete

Delete a Certificate

```
hcloud certificate delete <certificate>...
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates


---

## hcloud certificate describe

Describe a Certificate

```
hcloud certificate describe [options] <certificate>
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates


---

## hcloud certificate list

List Certificates

### Synopsis

Displays a list of Certificates.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,created (see available columns below).

Columns:
 - age
 - created
 - domain_names
 - fingerprint
 - id
 - issuance_status
 - labels
 - name
 - not_valid_after
 - not_valid_before
 - renewal_status
 - type

```
hcloud certificate list [options]
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates


---

## hcloud certificate remove-label

Remove a label from a Certificate

```
hcloud certificate remove-label <certificate> (--all | <label>...)
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates


---

## hcloud certificate retry

Retry a managed Certificate's issuance

```
hcloud certificate retry <certificate>
```

### Options

```
  -h, --help   help for retry
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates


---

## hcloud certificate update

Update a Certificate

```
hcloud certificate update [options] <certificate>
```

### Options

```
  -h, --help          help for update
      --name string   Certificate Name
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

* [hcloud certificate](hcloud_certificate.md)	 - Manage Certificates

