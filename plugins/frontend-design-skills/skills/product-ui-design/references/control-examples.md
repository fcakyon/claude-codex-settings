# Control examples

These examples use HeroUI v3 compound components and Tailwind semantic tokens. Adapt them to the installed design system. The host provides verified logo assets and callbacks. Do not install HeroUI just to copy these examples.

## Compact preferences and collection entry points

Group related settings with shared alignment. A label and contextual hint take the available space, while the control keeps its natural width. This excerpt uses the host's existing time-format control rather than defining another picker.

```tsx
<section aria-label="Preferences" className="divide-y divide-separator">
  <div className="flex flex-wrap items-center justify-between gap-3 py-4">
    <div>
      <h3 className="text-sm font-medium">Time format</h3>
      <p className="text-sm text-muted">{timeExample}</p>
    </div>
    <TimeFormatControl value={timeFormat} onChange={setTimeFormat} />
  </div>
  <div className="flex items-center justify-between gap-3 py-4">
    <div>
      <h3 className="text-sm font-medium">Hidden events</h3>
      <p className="text-sm text-muted">{hiddenCount} hidden</p>
    </div>
    <Button variant="secondary" onPress={openHiddenEvents}>Manage</Button>
  </div>
</section>
```

The count summarizes the collection without growing the Settings page. In the manager, keep its heading, search and close action outside a bounded scrolling list. Reuse the installed dialog or sheet for focus, Escape and dismissal. A row identifies the item, scope and account before its restore action. A restore should keep the query and scroll position, disable only the pending action and retain the item with an inline error on failure. Test a realistic larger list and long account names, not only this one-row excerpt.

Use the product's own button ranking. Here `secondary` means a restrained surface and readable label, not a prescribed fill, accent color or pill shape. Confirm font, size, weight, borders and all interaction states in the rendered product.

## Account identity and action

A real integration logo aids recognition. Give the identity the flexible space and keep the action reachable. The email's full value remains available through its text and title.

```tsx
import { Button } from "@heroui/react"

<div className="flex min-h-12 items-center gap-3 border-b border-separator py-2">
  <img src={account.logoUrl} alt="" className="size-5 shrink-0 object-contain" />
  <p className="min-w-0 flex-1 truncate text-sm font-medium" title={account.email}>
    {account.email}
  </p>
  <Button variant="ghost" size="sm" onPress={openDisconnectConfirmation}>
    Disconnect
  </Button>
</div>
```

The logo URL comes from the app's verified integration asset map. Reuse the existing confirmation flow. If identifying similar addresses requires the full value on mobile, allow a deliberate line break or provide an accessible detail view instead of hiding the distinguishing portion.

## Selectable row

The selection control, label and state belong together. A checkmark provides a signal beyond the background color. Keep other actions outside the checkbox so disconnecting does not toggle selection.

```tsx
import { Checkbox, Label } from "@heroui/react"

<Checkbox
  isSelected={visible}
  onChange={setVisible}
  className="min-h-12 w-full flex-row items-center gap-3 rounded-xl px-3 py-2"
>
  <Checkbox.Control>
    <Checkbox.Indicator />
  </Checkbox.Control>
  <Checkbox.Content className="min-w-0">
    <Label className="block truncate text-sm" title={account.email}>
      {account.email}
    </Label>
  </Checkbox.Content>
</Checkbox>
```

Verify the label remains horizontal in the actual library build. Component defaults can override the intended layout even when the JSX appears correct.

## One clear next action

A short label and visible busy state communicate the action without another explanation. Do not add a Save changes tooltip to a visible Save changes button. Keep a unique failure reason or external consequence beside the action. Keep a draft's content while saving and after failure.

```tsx
import { Button, Spinner } from "@heroui/react"

<div className="flex flex-wrap items-center justify-end gap-2">
  <Button variant="ghost" onPress={cancel}>Cancel</Button>
  <Button variant="primary" isPending={saving} onPress={save}>
    {({ isPending }) => (
      <>
        {isPending ? <Spinner size="sm" color="current" /> : null}
        Save changes
      </>
    )}
  </Button>
</div>
```

Use the product's primary action styling and show failures beside this action. Avoid adding a second spinner or repeated progress sentence.
