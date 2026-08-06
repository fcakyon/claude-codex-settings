---
name: ultralytics-branding
description: This skill should be used when creating Ultralytics-branded content of any kind, including PDF, PPTX, Canva, or Google Slides presentations, DOCX documents, marketing or newsletter HTML emails, social media post copy or visuals, website or landing page designs, and dataset or model result visuals. Provides official colors, typography, logo rules, naming rules, and tone of voice from ultralytics.com/brand.
---

# Ultralytics Branding

Apply these rules to every Ultralytics-branded deliverable. Source of truth: https://www.ultralytics.com/brand

## Colors

Primary palette:

| Name        | Hex       | Use                                                        |
| ----------- | --------- | ---------------------------------------------------------- |
| Dark Blue   | `#111F68` | Primary brand color, headings, dark logo, dark backgrounds |
| Bright Blue | `#042AFF` | Accents, links, CTAs, highlights                           |
| Neon Yellow | `#E1FF25` | High-energy accent, callouts on dark                       |
| Neon Pink   | `#FF64DA` | Secondary accent, sparingly                                |
| Light Grey  | `#F3F3F3` | Light backgrounds, cards                                   |
| White       | `#FFFFFF` | Backgrounds, text on dark                                  |

Secondary palette (supporting accents only, never dominant): Aqua Blue `#00FFFF`, Light Blue `#ACF9FF`, Neon Green `#76FFD6`, Grey `#CCCCCC`, Dark Grey `#9E9E9E`.

Rules:

- Default scheme: white or Light Grey background, Dark Blue text, Bright Blue accents. Dark scheme: Dark Blue background, white text, Neon Yellow or Aqua accents.
- Neon colors are accents, not fills for large areas or body text.
- Keep text and logos at a 3.5:1 contrast ratio minimum against their background.

Bounding box palette (detection or annotation visuals, one color per class, labels in Arial): Bright Blue `#042AFF`, Vivid Sky Blue `#0BDBEB`, Bleached Silk `#F3F3F3`, Robin Egg Blue `#00DFB7`, Pure Midnight `#111F68`, Candy Pink `#FF6FDD`, Sunburnt Cyclops `#FF444F`, Electric Lime `#CCED00`, Malachite `#00F344`, Electric Purple `#BD00FF`, Blue Bolt `#00B4FF`, Deep Magenta `#DD00BA`, Aqua `#00FFFF`, Yellow-Green `#26C000`, Medium Spring Green `#01FFB3`, Blue-Violet `#7D24FF`, Philippine Violet `#7B0068`, Electric Pink `#FF1B6C`, Smashed Pumpkin `#FC6D2F`, Spring Bud `#A2FF0B`.

## Typography

- Official typeface: **Archivo** (Google Fonts, free). Fallback stack: `Archivo, Helvetica, Arial, sans-serif`. In PPTX/DOCX where Archivo is unavailable, use Arial.
- Headings: Archivo Bold, tight scale from 72px hero down, 116% line-height.
- Body: Archivo Regular at 24px (large), 18px (medium), 16px (regular), 14px (small).
- Never use serif or decorative fonts. Bounding box labels use Arial.

## Logo

- Assets: logo pack at https://cdn.ul.run/f/4bf3c9729ff9eb1affc29e2dcab72bfc.zip, more on the brand page (Ultralytics, YOLO, YOLOv5, YOLOv8, YOLO11, YOLO26, YOLO Vision, Platform logotypes and logomarks).
- Dark Blue logo on light backgrounds, white logo on dark backgrounds.
- Keep clear space around the logo, never stretch, recolor, rotate, add effects, or redraw it.
- Co-branding: Ultralytics logo first and largest, separate partner logos with a simple dividing line, official assets only.

## Naming

- First mention: "Ultralytics YOLO26", after that "YOLO26".
- YOLO is always all caps, no space before the version: YOLO26, never YOLO 26 or Yolo26.
- Lowercase "v" only in YOLOv5 and YOLOv8. Newer models drop the "v": YOLO11, YOLO26, never YOLOv26.
- Never shorten, restyle, or alter product names.
- Non-partners describe usage as "leveraged Ultralytics solutions", never "partnered with" or "collaborated with" without an actual agreement.

## Tone of Voice

Knowledgeable, approachable, confident, energetic. Brand claim: "Simpler. Smarter. Further."

- Positive and straightforward, conversational except in technical content.
- Lighthearted with personality, grounded, never boastful.
- American English, inclusive language, no all caps, no excessive punctuation.

## Social Media

Post structure: intro sentence ending with one emoji, then body details, then CTA with a ➡️ arrow and shortened link.

- One emoji after the intro sentence only, never mid-sentence or replacing words.
- Concise copy, clear CTA, branded hashtags: #Ultralytics, #YOLO11, #YOLO26, #VisionAI.
- No off-topic memes, no posting during breaking news.

## Per-Format Defaults

- **Slides (PPTX, Canva, PDF)**: title slides Dark Blue background with white Archivo Bold and a neon accent, content slides white with Dark Blue headings, Bright Blue for links and highlights, generous whitespace, logo small in a corner.
- **Documents (DOCX, PDF)**: white background, Dark Blue headings, black or Dark Blue body, Bright Blue links, Archivo or Arial.
- **Marketing email HTML**: table-based layout, web-safe fallback stack, Dark Blue header band with white logo, Bright Blue CTA button with white text, Light Grey section dividers, 600px max width.
- **Web and social visuals**: pick one scheme (light or dark) per asset, one neon accent max, banner sizes 1920x960 for platform headers.
