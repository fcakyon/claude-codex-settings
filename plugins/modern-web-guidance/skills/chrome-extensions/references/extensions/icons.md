# Generating Extension Icons

## Quick: Omit icons

If generating real icon files is impractical, **omit `icons` and `default_icon` from manifest.json entirely**. Chrome uses a default puzzle-piece icon. This is always better than referencing files that don't exist.

## Generate with Python (Pillow)

```python
# generate_icons.py
from PIL import Image, ImageDraw
import os

os.makedirs('icons', exist_ok=True)

for size in [16, 48, 128]:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = max(1, size // 16)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 4,
        fill='#4688F1'
    )
    # Add a letter
    font_size = size // 2
    draw.text((size // 2, size // 2), 'E', fill='white', anchor='mm')
    img.save(f'icons/icon-{size}.png')
    print(f'Created icons/icon-{size}.png ({size}x{size})')
```

## Generate with Node.js (canvas)

```js
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

fs.mkdirSync('icons', { recursive: true });

for (const size of [16, 48, 128]) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size / 4;
  
  // Rounded rectangle
  ctx.beginPath();
  ctx.roundRect(1, 1, size - 2, size - 2, r);
  ctx.fillStyle = '#4688F1';
  ctx.fill();
  
  // Letter
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size / 2}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', size / 2, size / 2);
  
  fs.writeFileSync(`icons/icon-${size}.png`, canvas.toBuffer('image/png'));
  console.log(`Created icons/icon-${size}.png (${size}x${size})`);
}
```

## Generate with pure SVG (no dependencies)

Create SVGs and use them directly (Chrome supports SVG icons in some contexts) or convert:

```bash
for SIZE in 16 48 128; do
  cat > "icons/icon-${SIZE}.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="$((SIZE/4))" fill="#4688F1"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
        fill="white" font-family="sans-serif" font-weight="bold" font-size="$((SIZE/2))">E</text>
</svg>
EOF
done
```

Note: For Chrome Web Store submission, PNG is required. SVG works for development.

## Manifest reference

```json
{
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  }
}
```

Each file MUST match its declared size: icon-16.png = 16×16 pixels, etc.
