# Control examples

These examples use HeroUI v3 compound components and Tailwind semantic tokens. Adapt them to the installed design system. The host provides verified logo assets and callbacks. Do not install HeroUI just to copy these examples.

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

A short label and visible busy state communicate the action without another explanation. Keep a draft's content while saving and after failure.

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
