import { readFileSync, writeFileSync } from 'node:fs'

const path = process.argv[2]
const text = readFileSync(path, 'utf8')
const heading = text.match(/^# .+$/m)[0]
const routing = "For product screens, controls and UX flows, use the installed `product-ui-design` skill first. It covers existing design systems and creating product-specific design rules. Use this skill for new visual concepts or substantial art direction. Image concepts are optional for routine product UI changes.\n\n"
const description = path.includes('openai-frontend-design')
  ? 'This skill should be used when the user asks for "visual concepts", "image-led website design", or "concept fidelity". Create visual concepts and implement accepted art direction. Use product-ui-design for everyday product screens and controls.'
  : 'This skill should be used when the user asks for "art direction", "a distinctive visual identity", or "a visual redesign". Develop typography and composition for a new direction. Use product-ui-design for everyday product screens and controls.'
writeFileSync(path, text.replace(heading + '\n\n' + routing, heading + '\n').replace(heading + '\n', heading + '\n\n' + routing).replace(/^description:.*$/m, 'description: ' + description))
