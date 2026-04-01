## hcloud storage-box add-label

Add a label to a Storage Box

```
hcloud storage-box add-label [--overwrite] <storage-box> <label>...
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box change-type

Change type of a Storage Box

### Synopsis

Requests a Storage Box to be upgraded or downgraded to another Storage Box Type.
Please note that it is not possible to downgrade to a Storage Box Type that offers less disk space than you are currently using.

```
hcloud storage-box change-type <storage-box> <storage-box-type>
```

### Options

```
  -h, --help   help for change-type
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box create

Create a new Storage Box

```
hcloud storage-box create [options] --name <name> --type <type> --location <location> --password <password>
```

### Options

```
      --enable-protection strings   Enable protection (delete) (default: none)
      --enable-samba                Whether the Samba subsystem should be enabled (true, false)
      --enable-ssh                  Whether the SSH subsystem should be enabled (true, false)
      --enable-webdav               Whether the WebDAV subsystem should be enabled (true, false)
      --enable-zfs                  Whether the ZFS Snapshot folder should be visible (true, false)
  -h, --help                        help for create
      --label stringToString        User-defined labels ('key=value') (can be specified multiple times) (default [])
      --location string             Location (ID or name) (required)
      --name string                 Storage Box name (required)
  -o, --output stringArray          output options: json|yaml
      --password string             The password that will be set for this Storage Box (required)
      --reachable-externally        Whether the Storage Box should be accessible from outside the Hetzner network (true, false)
      --ssh-key stringArray         SSH public keys in OpenSSH format or as the ID or name of an existing SSH key
      --type string                 Storage Box Type (ID or name) (required)
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box delete

Delete a Storage Box

```
hcloud storage-box delete <storage-box>...
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box describe

Describe a Storage Box

```
hcloud storage-box describe [options] <storage-box>
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box disable-protection

Disable resource protection for a Storage Box

```
hcloud storage-box disable-protection <storage-box> delete
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box disable-snapshot-plan

Disable automatic snapshots for a Storage Box

```
hcloud storage-box disable-snapshot-plan <storage-box>
```

### Options

```
  -h, --help   help for disable-snapshot-plan
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box enable-protection

Enable resource protection for a Storage Box

```
hcloud storage-box enable-protection <storage-box> delete
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box enable-snapshot-plan

Enable automatic snapshots for a Storage Box

### Synopsis

Enable automatic snapshots for a Storage Box

Allowed values for --day-of-week are:
- Sunday, Sun, 0, 7
- Monday, Mon, 1
- Tuesday, Tue, 2
- Wednesday, Wed, 3
- Thursday, Thu, 4
- Friday, Fri, 5
- Saturday, Sat, 6

```
hcloud storage-box enable-snapshot-plan [options] <storage-box>
```

### Options

```
      --day-of-month int     Day of the month the Snapshot Plan should be executed on. Not specified means every day
      --day-of-week string   Day of the week the Snapshot Plan should be executed on. Not specified means every day
  -h, --help                 help for enable-snapshot-plan
      --hour int             Hour the Snapshot Plan should be executed on (UTC)
      --max-snapshots int    Maximum amount of Snapshots that should be created by this Snapshot Plan
      --minute int           Minute the Snapshot Plan should be executed on (UTC)
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box folders

List folders of a Storage Box

```
hcloud storage-box folders <storage-box>
```

### Options

```
  -h, --help                 help for folders
  -o, --output stringArray   output options: json|yaml
      --path string          Relative path for which the listing is to be made
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box list

List Storage Boxes

### Synopsis

Displays a list of Storage Boxes.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,created (see available columns below).

Columns:
 - age
 - created
 - id
 - labels
 - location
 - name
 - server
 - size
 - status
 - system
 - type
 - username

```
hcloud storage-box list [options]
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box remove-label

Remove a label from a Storage Box

```
hcloud storage-box remove-label <storage-box> (--all | <label>...)
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box reset-password

Reset the password of a Storage Box

```
hcloud storage-box reset-password --password <password> <storage-box>
```

### Options

```
  -h, --help              help for reset-password
      --password string   New password for the Storage Box
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box rollback-snapshot

Rolls back the Storage Box to the given Snapshot

```
hcloud storage-box rollback-snapshot --snapshot <snapshot> <storage-box>
```

### Options

```
  -h, --help              help for rollback-snapshot
      --snapshot string   The name or ID of the snapshot to roll back to
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box snapshot

Manage Storage Box Snapshots

### Options

```
  -h, --help   help for snapshot
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes
* [hcloud storage-box snapshot add-label](hcloud_storage-box_snapshot_add-label.md)	 - Add a label to a Storage Box Snapshot
* [hcloud storage-box snapshot create](hcloud_storage-box_snapshot_create.md)	 - Create a Storage Box Snapshot
* [hcloud storage-box snapshot delete](hcloud_storage-box_snapshot_delete.md)	 - Delete a Storage Box Snapshot
* [hcloud storage-box snapshot describe](hcloud_storage-box_snapshot_describe.md)	 - Describe a Storage Box Snapshot
* [hcloud storage-box snapshot list](hcloud_storage-box_snapshot_list.md)	 - List Storage Box Snapshots
* [hcloud storage-box snapshot remove-label](hcloud_storage-box_snapshot_remove-label.md)	 - Remove a label from a Storage Box Snapshot
* [hcloud storage-box snapshot update](hcloud_storage-box_snapshot_update.md)	 - Update a Storage Box Snapshot


---

## hcloud storage-box snapshot add-label

Add a label to a Storage Box Snapshot

```
hcloud storage-box snapshot add-label [--overwrite] <storage-box> <snapshot> <label>...
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

* [hcloud storage-box snapshot](hcloud_storage-box_snapshot.md)	 - Manage Storage Box Snapshots


---

## hcloud storage-box snapshot create

Create a Storage Box Snapshot

```
hcloud storage-box snapshot create [--description <description>] <storage-box>
```

### Options

```
      --description string     Description of the Storage Box Snapshot
  -h, --help                   help for create
      --label stringToString   User-defined labels ('key=value') (can be specified multiple times) (default [])
  -o, --output stringArray     output options: json|yaml
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

* [hcloud storage-box snapshot](hcloud_storage-box_snapshot.md)	 - Manage Storage Box Snapshots


---

## hcloud storage-box snapshot delete

Delete a Storage Box Snapshot

```
hcloud storage-box snapshot delete <storage-box> <snapshot>...
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

* [hcloud storage-box snapshot](hcloud_storage-box_snapshot.md)	 - Manage Storage Box Snapshots


---

## hcloud storage-box snapshot describe

Describe a Storage Box Snapshot

```
hcloud storage-box snapshot describe [options] <storage-box> <snapshot>
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

* [hcloud storage-box snapshot](hcloud_storage-box_snapshot.md)	 - Manage Storage Box Snapshots


---

## hcloud storage-box snapshot list

List Storage Box Snapshots

### Synopsis

Displays a list of Storage Box Snapshots.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,created (see available columns below).

Columns:
 - age
 - created
 - description
 - id
 - is_automatic
 - labels
 - name
 - size
 - size_filesystem

```
hcloud storage-box snapshot list [options] <storage-box>
```

### Options

```
      --automatic            Only show automatic snapshots (true, false)
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

* [hcloud storage-box snapshot](hcloud_storage-box_snapshot.md)	 - Manage Storage Box Snapshots


---

## hcloud storage-box snapshot remove-label

Remove a label from a Storage Box Snapshot

```
hcloud storage-box snapshot remove-label <storage-box> <snapshot> (--all | <label>...)
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

* [hcloud storage-box snapshot](hcloud_storage-box_snapshot.md)	 - Manage Storage Box Snapshots


---

## hcloud storage-box snapshot update

Update a Storage Box Snapshot

```
hcloud storage-box snapshot update [options] <storage-box> <snapshot>
```

### Options

```
      --description string   Description of the Storage Box Snapshot
  -h, --help                 help for update
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

* [hcloud storage-box snapshot](hcloud_storage-box_snapshot.md)	 - Manage Storage Box Snapshots


---

## hcloud storage-box subaccount

Manage Storage Box Subaccounts

### Options

```
  -h, --help   help for subaccount
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes
* [hcloud storage-box subaccount change-home-directory](hcloud_storage-box_subaccount_change-home-directory.md)	 - Update access settings of the Storage Box Subaccount
* [hcloud storage-box subaccount create](hcloud_storage-box_subaccount_create.md)	 - Create a Storage Box Subaccount
* [hcloud storage-box subaccount delete](hcloud_storage-box_subaccount_delete.md)	 - Delete a Storage Box Subaccount
* [hcloud storage-box subaccount describe](hcloud_storage-box_subaccount_describe.md)	 - Describe a Storage Box Subaccount
* [hcloud storage-box subaccount list](hcloud_storage-box_subaccount_list.md)	 - List Storage Box Subaccounts
* [hcloud storage-box subaccount reset-password](hcloud_storage-box_subaccount_reset-password.md)	 - Reset the password of a Storage Box Subaccount
* [hcloud storage-box subaccount update](hcloud_storage-box_subaccount_update.md)	 - Update a Storage Box Subaccount
* [hcloud storage-box subaccount update-access-settings](hcloud_storage-box_subaccount_update-access-settings.md)	 - Update access settings of the Storage Box Subaccount


---

## hcloud storage-box subaccount change-home-directory

Update access settings of the Storage Box Subaccount

```
hcloud storage-box subaccount change-home-directory --home-directory <home-directory> <storage-box> <subaccount>
```

### Options

```
  -h, --help                    help for change-home-directory
      --home-directory string   Home directory of the Subaccount. Will be created if it doesn't exist yet
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box subaccount create

Create a Storage Box Subaccount

```
hcloud storage-box subaccount create [options] --password <password> --home-directory <home-directory> <storage-box>
```

### Options

```
      --description string      Description for the Subaccount
      --enable-samba            Whether the Samba subsystem should be enabled (true, false)
      --enable-ssh              Whether the SSH subsystem should be enabled (true, false)
      --enable-webdav           Whether the WebDAV subsystem should be enabled (true, false)
  -h, --help                    help for create
      --home-directory string   Home directory for the Subaccount (required)
      --label stringToString    User-defined labels ('key=value') (can be specified multiple times) (default [])
      --name string             Name for the Subaccount
  -o, --output stringArray      output options: json|yaml
      --password string         Password for the Subaccount (required)
      --reachable-externally    Whether the Storage Box should be accessible from outside the Hetzner network (true, false)
      --readonly                Whether the Subaccount should be read-only (true, false)
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box subaccount delete

Delete a Storage Box Subaccount

```
hcloud storage-box subaccount delete <storage-box> <subaccount>...
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box subaccount describe

Describe a Storage Box Subaccount

```
hcloud storage-box subaccount describe [options] <storage-box> <subaccount>
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box subaccount list

List Storage Box Subaccounts

### Synopsis

Displays a list of Storage Box Subaccounts.

Output can be controlled with the -o flag. Use -o noheader to suppress the
table header. Displayed columns and their order can be set with
-o columns=age,created (see available columns below).

Columns:
 - age
 - created
 - description
 - home_directory
 - id
 - labels
 - name
 - server
 - username

```
hcloud storage-box subaccount list [options] <storage-box>
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box subaccount reset-password

Reset the password of a Storage Box Subaccount

```
hcloud storage-box subaccount reset-password --password <password> <storage-box> <subaccount>
```

### Options

```
  -h, --help              help for reset-password
      --password string   New password for the Storage Box Subaccount
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box subaccount update-access-settings

Update access settings of the Storage Box Subaccount

```
hcloud storage-box subaccount update-access-settings [options] <storage-box> <subaccount>
```

### Options

```
      --enable-samba           Whether the Samba subsystem should be enabled (true, false)
      --enable-ssh             Whether the SSH subsystem should be enabled (true, false)
      --enable-webdav          Whether the WebDAV subsystem should be enabled (true, false)
  -h, --help                   help for update-access-settings
      --reachable-externally   Whether the Storage Box should be accessible from outside the Hetzner network (true, false)
      --readonly               Whether the Subaccount should be read-only (true, false)
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box subaccount update

Update a Storage Box Subaccount

```
hcloud storage-box subaccount update [options] <storage-box> <subaccount>
```

### Options

```
      --description string   Description of the Storage Box Subaccount
  -h, --help                 help for update
      --name string          Name of the Storage Box Subaccount
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

* [hcloud storage-box subaccount](hcloud_storage-box_subaccount.md)	 - Manage Storage Box Subaccounts


---

## hcloud storage-box update-access-settings

Update access settings of the primary Storage Box account

```
hcloud storage-box update-access-settings [options] <storage-box>
```

### Options

```
      --enable-samba           Whether the Samba subsystem should be enabled (true, false)
      --enable-ssh             Whether the SSH subsystem should be enabled (true, false)
      --enable-webdav          Whether the WebDAV subsystem should be enabled (true, false)
      --enable-zfs             Whether the ZFS Snapshot folder should be visible (true, false)
  -h, --help                   help for update-access-settings
      --reachable-externally   Whether the Storage Box should be accessible from outside the Hetzner network (true, false)
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes


---

## hcloud storage-box update

Update a Storage Box

```
hcloud storage-box update [options] <storage-box>
```

### Options

```
  -h, --help          help for update
      --name string   Storage Box name
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

* [hcloud storage-box](hcloud_storage-box.md)	 - Manage Storage Boxes

