#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { gunzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'parse5'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import robotsParser from 'robots-parser'
import { checkHead, googleRules, invalidProfileDates } from './check_head.mjs'

const MAX_BYTES = 5 * 1024 * 1024
const MAX_SITEMAPS = 10
const TIMEOUT = 10000
const SOURCES = {
  robots: 'https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec',
  indexing: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
  sitemap: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
  canonical: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  hreflang: 'https://developers.google.com/search/docs/specialty/international/localized-versions',
  ai: 'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide',
}
const asArray = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value]
const textOf = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(textOf).join(' ')
const compact = (text) => text.replace(/\s+/g, ' ').trim()
const urlOf = (value, base) => {
  const url = URL.parse(value, base)
  if (!url || !/^https?:$/.test(url.protocol) || url.username || url.password) return null
  url.hash = ''
  return url.href
}

function pageOf(html, url, headers) {
  const nodes = []
  const visit = (node) => {
    if (node.tagName) nodes.push({ tag: node.tagName, inHead: node.parentNode?.tagName === 'head', attrs: Object.fromEntries(node.attrs.map(({ name, value }) => [name, value])), text: node.childNodes })
    if (!['template', 'noscript'].includes(node.tagName)) for (const child of node.childNodes ?? []) visit(child)
  }
  visit(parse(html))
  const texts = (tag) => nodes.filter((n) => n.tag === tag).map((n) => compact(n.text.map(textOf).join(' ')))
  const meta = (name) => nodes.filter((n) => n.tag === 'meta' && (n.attrs.name ?? '').toLowerCase() === name).map((n) => n.attrs.content ?? '')
  const base = urlOf(nodes.find((n) => n.tag === 'base' && n.attrs.href)?.attrs.href ?? url, url) ?? url
  const links = nodes.filter((n) => n.tag === 'link' && n.inHead).map((n) => n.attrs)
  for (const [, href, params] of (headers.get('link') ?? '').matchAll(/<([^>]*)>((?:\s*;\s*[\w-]+\s*=\s*(?:"[^"]*"|[^,;]*))*)/g)) {
    const attrs = Object.fromEntries([...params.matchAll(/;\s*([\w-]+)\s*=\s*(?:"([^"]*)"|([^,;]*))/g)].map(([, k, quoted, bare]) => [k.toLowerCase(), quoted ?? bare.trim()]))
    links.push({ ...attrs, href })
  }
  const hasRel = (link, rel) => (link.rel ?? '').toLowerCase().split(/\s+/).includes(rel)
  const rules = googleRules([...meta('robots'), ...meta('googlebot')], headers.get('x-robots-tag') ?? '')
  const canonical = links.filter((l) => hasRel(l, 'canonical')).map((l) => ({ raw: l.href, url: l.href?.trim() ? urlOf(l.href, base) : null }))
  const alternates = links.filter((l) => hasRel(l, 'alternate') && l.hreflang).map((l) => ({ lang: l.hreflang.toLowerCase(), url: l.href?.trim() ? urlOf(l.href, base) : null }))
  const anchors = nodes.filter((n) => n.tag === 'a' && n.attrs.href && !hasRel(n.attrs, 'nofollow')).map((n) => urlOf(n.attrs.href, base))
  const jsonLd = nodes.filter((n) => n.tag === 'script' && n.attrs.type?.toLowerCase() === 'application/ld+json').map((n) => n.text.map(textOf).join(''))
  return { url, titles: texts('title'), descriptions: meta('description'), h1: texts('h1'), canonical, alternates, anchors, rules,
    noindex: rules.some((r) => /^(noindex|none)$/i.test(r)),
    nofollow: rules.some((r) => /^(nofollow|none)$/i.test(r)),
    snippetLimited: rules.some((r) => /^(nosnippet|max-snippet\s*:\s*0)$/i.test(r)),
    excludedSnippets: nodes.filter((n) => ['div', 'span', 'section'].includes(n.tag) && 'data-nosnippet' in n.attrs).length,
    missingAlt: nodes.filter((n) => n.tag === 'img' && !('alt' in n.attrs)).length, jsonLd }
}

async function readUrl(url, origin, isAllowed) {
  const redirects = []
  const signal = AbortSignal.timeout(TIMEOUT)
  try {
    for (let hop = 0; hop <= 10; hop++) {
      const response = await fetch(url, { redirect: 'manual', signal, headers: { 'user-agent': 'SEOAudit/1.0', accept: 'text/html,application/xml,text/plain,*/*' } })
      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel()
        const next = urlOf(location, url)
        redirects.push({ url, status: response.status, target: next })
        if (!next || (origin && new URL(next).origin !== origin)) return { url, status: response.status, redirects, unchecked: 'Redirect leaves the crawl origin or HTTP(S).' }
        if (isAllowed && !isAllowed(next)) return { url, status: response.status, redirects, unchecked: 'Redirect target is disallowed by robots.txt.' }
        url = next
        continue
      }
      const parts = []
      let bytes = 0
      for await (const part of response.body ?? []) {
        bytes += part.length
        if (bytes > MAX_BYTES) return { url, status: response.status, redirects, unchecked: `Response exceeds the ${MAX_BYTES}-byte audit budget.` }
        parts.push(part)
      }
      const charset = response.headers.get('content-type')?.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1] ?? 'utf-8'
      let body = Buffer.concat(parts)
      if (body[0] === 0x1f && body[1] === 0x8b) body = gunzipSync(body, { maxOutputLength: MAX_BYTES })
      return { url, status: response.status, headers: response.headers, text: new TextDecoder(charset).decode(body), redirects }
    }
    return { url, redirects, unchecked: 'Redirect limit reached.' }
  } catch (error) {
    return { url, redirects, unchecked: error.cause?.code ?? error.message }
  }
}

export async function auditSite(target, { maxPages = 20, expectNoindex = false } = {}) {
  target = urlOf(target)
  if (!target || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 500) throw new Error('Use an HTTP(S) URL and --max-pages from 1 to 500.')
  const findings = []
  const add = (rule, status, url, evidence, source) => findings.push({ rule, status, url, evidence, ...(source ? { source: SOURCES[source] } : {}) })
  const root = await readUrl(target)
  if (root.redirects.length) add('page.redirect', 'review', target, root.redirects, 'canonical')
  const origin = new URL(root.url).origin
  const requests = new Map([[target, Promise.resolve(root)]])
  let robots = null
  const read = (url, respectRobots = false) => {
    if (!requests.has(url)) requests.set(url, readUrl(url, origin, respectRobots ? (next) => robots.isAllowed(next, 'Googlebot') !== false : undefined))
    return requests.get(url)
  }
  const headTask = checkHead(root.url)
  const robotsUrl = `${origin}/robots.txt`
  const robotsResponse = await read(robotsUrl)
  if (robotsResponse.unchecked || robotsResponse.status === 429 || robotsResponse.status >= 500) {
    add('robots.fetch', 'unchecked', robotsUrl, robotsResponse.unchecked ?? `HTTP ${robotsResponse.status}. Crawl policy could not be established.`, 'robots')
  } else if (robotsResponse.status >= 400) {
    robots = robotsParser(robotsUrl, '')
    add('robots.fetch', 'pass', robotsUrl, `HTTP ${robotsResponse.status}. Google treats this as no robots restrictions.`, 'robots')
  } else if (/html/i.test(robotsResponse.headers?.get('content-type') ?? '')) {
    add('robots.format', 'unchecked', robotsUrl, 'The robots URL returned HTML. Crawl policy could not be established.', 'robots')
  } else {
    robots = robotsParser(robotsUrl, Buffer.from(robotsResponse.text).subarray(0, 500 * 1024).toString('utf8'))
    add('robots.fetch', 'pass', robotsUrl, `HTTP ${robotsResponse.status}.`, 'robots')
    if (Buffer.byteLength(robotsResponse.text) > 500 * 1024) add('robots.size', 'review', robotsUrl, 'Google ignores robots.txt content after 500 KiB.', 'robots')
  }
  if (robots) {
    for (const [agent, role] of [['Googlebot', 'Google Search'], ['OAI-SearchBot', 'AI search'], ['PerplexityBot', 'AI search'], ['GPTBot', 'model training']]) {
      add('robots.agent', 'pass', root.url, { agent, role, allowed: robots.isAllowed(root.url, agent) !== false }, 'robots')
    }
  }

  const queue = new Map([[root.url, new Set(['entry'])]])
  if (root.url !== target) requests.set(root.url, Promise.resolve({ ...root, redirects: [] }))
  const sitemapAlternates = new Map()
  const enqueue = (url, source, reportExternal = false) => {
    if (!url || new URL(url).origin !== origin) {
      if (reportExternal) add('crawl.scope', 'unchecked', url ?? root.url, `${source} target is invalid or outside ${origin}.`)
      return
    }
    if (!queue.has(url)) queue.set(url, new Set())
    queue.get(url).add(source)
  }
  const maps = new Set(robots ? robots.getSitemaps() : [])
  if (!maps.size) maps.add(`${origin}/sitemap.xml`)
  const parsedMaps = new Set()
  const xml = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, trimValues: true })
  while ([...maps].some((u) => !parsedMaps.has(u)) && parsedMaps.size < MAX_SITEMAPS) {
    const raw = [...maps].find((u) => !parsedMaps.has(u))
    parsedMaps.add(raw)
    const url = urlOf(raw)
    if (!url || new URL(url).origin !== origin) {
      add('sitemap.scope', 'unchecked', raw, 'Cross-origin sitemap needs a separate audit.', 'sitemap')
      continue
    }
    const res = await read(url)
    if (res.unchecked || [401, 403, 429].includes(res.status)) {
      add('sitemap.fetch', 'unchecked', url, res.unchecked ?? `HTTP ${res.status}.`, 'sitemap')
      continue
    }
    if (res.status !== 200) {
      add('sitemap.fetch', 'review', url, `HTTP ${res.status}. A sitemap is optional, but a declared one should resolve.`, 'sitemap')
      continue
    }
    let entries, index = false
    if (/^\s*</.test(res.text)) {
      if (/<!DOCTYPE/i.test(res.text)) {
        add('sitemap.xml', 'unchecked', url, 'Sitemaps with a DTD are not processed.', 'sitemap')
        continue
      }
      const valid = XMLValidator.validate(res.text)
      if (valid !== true) {
        add('sitemap.xml', 'fail', url, valid.err.msg, 'sitemap')
        continue
      }
      const doc = xml.parse(res.text)
      if (Object.hasOwn(doc, 'sitemapindex')) { index = true; entries = asArray(doc.sitemapindex.sitemap) }
      else if (Object.hasOwn(doc, 'urlset')) entries = asArray(doc.urlset.url)
      else {
        add('sitemap.format', 'unchecked', url, 'Only XML urlset/index and plain-text sitemaps are checked. Feeds need a separate check.', 'sitemap')
        continue
      }
    } else if (/text\/plain/.test(res.headers.get('content-type') ?? '')) {
      entries = res.text.split(/\r?\n/).filter((l) => l.trim()).map((loc) => ({ loc: loc.trim() }))
    } else {
      add('sitemap.format', 'fail', url, 'Expected sitemap XML or plain-text URLs.', 'sitemap')
      continue
    }
    add('sitemap.parse', 'pass', url, { type: index ? 'index' : 'urlset', entries: entries.length }, 'sitemap')
    if (entries.length > 50000) add('sitemap.count', 'fail', url, `${entries.length} entries exceeds 50,000.`, 'sitemap')
    for (const entry of entries) {
      const loc = typeof entry.loc === 'string' ? urlOf(entry.loc) : null
      if (!loc) { add('sitemap.loc', 'fail', url, 'An entry has no absolute HTTP(S) loc.', 'sitemap'); continue }
      if (index) { maps.add(loc); continue }
      enqueue(loc, 'sitemap', true)
      if (entry.lastmod && Number.isNaN(Date.parse(entry.lastmod))) add('sitemap.lastmod', 'review', loc, `Invalid lastmod: ${entry.lastmod}. Actual content freshness is not verified.`, 'sitemap')
      const alternates = asArray(entry.link).filter((l) => l['@_hreflang']).map((l) => ({ lang: l['@_hreflang'].toLowerCase(), url: urlOf(l['@_href']) }))
      if (alternates.length) sitemapAlternates.set(loc, alternates)
    }
  }
  requests.clear()
  requests.set(root.url, Promise.resolve({ ...root, redirects: [] }))
  if (maps.size > parsedMaps.size) add('sitemap.limit', 'unchecked', root.url, `${parsedMaps.size} of ${maps.size} discovered sitemaps checked.`)

  const pages = new Map()
  const visited = new Set()
  while ([...queue.keys()].some((u) => !visited.has(u)) && visited.size < maxPages) {
    const batch = [...queue.keys()].filter((u) => !visited.has(u)).slice(0, Math.min(4, maxPages - visited.size))
    for (const url of batch) visited.add(url)
    const responses = await Promise.all(batch.map(async (url) => {
      if (url !== root.url && (!robots || robots.isAllowed(url, 'Googlebot') === false)) return { url, unchecked: robots ? 'Disallowed for Googlebot by robots.txt.' : 'Crawl policy is unavailable.' }
      return read(url, true)
    }))
    for (let i = 0; i < responses.length; i++) {
      const res = responses[i], requested = batch[i]
      requests.delete(requested)
      const sources = queue.get(requested)
      if (sources.has('sitemap') && robots?.isAllowed(requested, 'Googlebot') === false) add('sitemap.blocked', 'fail', requested, 'Sitemap URL is disallowed for Googlebot.', 'sitemap')
      if (res.unchecked || [401, 403, 429].includes(res.status)) {
        add('page.fetch', 'unchecked', requested, res.unchecked ?? `HTTP ${res.status}.`, 'indexing')
        continue
      }
      if (res.status >= 400) { add('page.status', 'fail', requested, `HTTP ${res.status}. Referenced by ${[...sources].join(', ')}.`, 'indexing'); continue }
      if (res.redirects.length) add('page.redirect', sources.has('sitemap') ? 'fail' : 'review', requested, res.redirects, 'canonical')
      if (!/html/i.test(res.headers.get('content-type') ?? '')) {
        add('page.format', 'unchecked', requested, `Not an HTML page (${res.headers.get('content-type') ?? 'no type'}).`)
        continue
      }
      const page = pageOf(res.text, res.url, res.headers)
      page.alternates.push(...(sitemapAlternates.get(requested) ?? []))
      pages.set(requested, page)
      const allowed = robots?.isAllowed(res.url, 'Googlebot')
      const expectsIndex = sources.has('sitemap') || (requested === root.url && !expectNoindex)
      add('page.indexing', expectsIndex && (page.noindex || allowed === false) ? 'fail' : requested === root.url && expectNoindex && !page.noindex ? 'fail' : !robots ? 'unchecked' : 'pass', requested,
        { noindex: page.noindex, googlebotAllowed: allowed ?? null, expected: expectsIndex ? 'indexable' : requested === root.url && expectNoindex ? 'noindex' : 'not specified' }, 'indexing')
      if (page.noindex && allowed === false) add('page.hidden-noindex', 'review', requested, 'robots.txt prevents crawlers from reading the noindex directive.', 'indexing')
      if (page.snippetLimited || page.excludedSnippets) add('page.snippets', 'review', requested, { snippetLimited: page.snippetLimited, dataNosnippetElements: page.excludedSnippets, note: 'Confirm these intentional preview controls. They can limit content used in Google AI search.' }, 'ai')
      const canonicals = [...new Set(page.canonical.map((c) => c.url))]
      if (canonicals.length > 1 || canonicals.includes(null)) add('canonical.conflict', 'fail', requested, page.canonical, 'canonical')
      else if (!canonicals.length && !page.noindex) add('canonical.missing', 'review', requested, 'No canonical in HTML or HTTP Link headers. Google can still choose one.', 'canonical')
      for (const canonical of page.canonical) {
        if (!/^https?:\/\//i.test(canonical.raw ?? '')) add('canonical.relative', 'review', requested, canonical.raw ?? 'Empty canonical.', 'canonical')
        enqueue(canonical.url, 'canonical', true)
        if (sources.has('sitemap') && canonical.url !== res.url) add('sitemap.canonical', 'fail', requested, `Sitemap URL canonicalizes to ${canonical.url}.`, 'sitemap')
      }
      if (!page.noindex) {
        if (page.titles.length !== 1 || !page.titles[0]) add('page.title', 'review', requested, { titles: page.titles })
        if (!page.descriptions.length || !page.descriptions[0]) add('page.description', 'review', requested, 'No description in server HTML.')
        if (!page.h1.length) add('page.h1', 'review', requested, 'No H1 in server HTML. Check the rendered page before concluding it is missing.')
      }
      if (page.missingAlt) add('page.image-alt', 'review', requested, `${page.missingAlt} images lack an alt attribute. Decorative images may use empty alt.`)
      for (const block of page.jsonLd) {
        try {
          const invalid = invalidProfileDates(JSON.parse(block))
          if (invalid.length) add('schema.profile-date', 'review', requested, `${invalid.join(', ')} must include an ISO 8601 date and time for Google ProfilePage markup.`)
        } catch (error) { add('schema.json', 'fail', requested, error.message) }
      }
      for (const alternate of page.alternates) enqueue(alternate.url, 'hreflang', true)
      if (!page.nofollow) for (const anchor of page.anchors) enqueue(anchor, `link from ${requested}`)
    }
  }

  for (const [url, page] of pages) {
    for (const canonical of page.canonical) {
      const destination = pages.get(canonical.url)
      if (!page.noindex && destination?.noindex) add('canonical.noindex', 'fail', url, `Canonical target ${canonical.url} has noindex.`, 'canonical')
      else if (canonical.url && !destination) add('canonical.target', 'unchecked', url, `Target ${canonical.url} was not parsed in this crawl.`, 'canonical')
    }
    const alternates = page.alternates
    if (!alternates.length) continue
    const grouped = new Map()
    for (const { lang, url: href } of alternates) {
      if (!grouped.has(lang)) grouped.set(lang, new Set())
      grouped.get(lang).add(href)
      let valid = lang === 'x-default'
      if (!valid && /^[a-z]{2}(?:-[a-z]{4})?(?:-[a-z]{2})?$/.test(lang)) {
        try { valid = new Intl.Locale(lang).toString().toLowerCase() === lang && !!new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' }).of(lang.slice(0, 2)) } catch { valid = false }
      }
      if (!valid || !href) add('hreflang.value', 'review', url, { lang, target: href }, 'hreflang')
      const destination = pages.get(href)
      if (!destination) add('hreflang.target', 'unchecked', url, `Target ${href} was not parsed in this crawl.`, 'hreflang')
      else if (destination.noindex) add('hreflang.noindex', 'fail', url, `Target ${href} has noindex.`, 'hreflang')
      else if (destination.canonical.some((c) => c.url !== destination.url)) add('hreflang.canonical', 'fail', url, `Target ${href} is not canonical.`, 'hreflang')
      else if (!destination.alternates.some((a) => a.url === page.url)) add('hreflang.return', 'fail', url, `Target ${href} has no return annotation.`, 'hreflang')
    }
    if (!alternates.some((a) => a.url === page.url)) add('hreflang.self', 'review', url, 'No self-reference in the observed alternate set.', 'hreflang')
    for (const [lang, urls] of grouped) if (urls.size > 1) add('hreflang.conflict', 'fail', url, { lang, urls: [...urls] }, 'hreflang')
  }
  for (const field of ['titles', 'descriptions']) {
    const groups = new Map()
    for (const page of pages.values()) {
      if (page.noindex || page.canonical.some((c) => c.url !== page.url)) continue
      const text = compact(page[field][0] ?? '').toLowerCase()
      if (!text) continue
      if (!groups.has(text)) groups.set(text, new Set())
      groups.get(text).add(page.url)
    }
    for (const [text, urls] of groups) if (urls.size > 1) add(`duplicate.${field}`, 'review', [...urls][0], { text, urls: [...urls] })
  }
  const pending = [...queue.keys()].filter((url) => !visited.has(url))
  if (pending.length) add('crawl.limit', 'unchecked', root.url, { visited: visited.size, pending: pending.length, maxPages })
  const head = await headTask
  for (const report of [...head.agents, head.site].filter(Boolean)) {
    for (const message of report.errors) add('head.error', report.agent !== 'site' && (!report.status || [401, 403, 429].includes(report.status)) ? 'unchecked' : 'fail', root.url, { agent: report.agent, message })
    for (const message of report.warnings) add('head.warning', 'review', root.url, { agent: report.agent, message })
  }
  findings.sort((a, b) => a.url.localeCompare(b.url) || a.rule.localeCompare(b.rule) || JSON.stringify(a.evidence).localeCompare(JSON.stringify(b.evidence)))
  return { url: root.url, rulesCheckedOn: '2026-11-08', valid: !findings.some((f) => f.status === 'fail'), findings,
    coverage: { visited: visited.size, discovered: queue.size, parsedPages: pages.size, sitemaps: parsedMaps.size, maxPages, maxSitemaps: MAX_SITEMAPS,
      crawlComplete: !findings.some((f) => f.status === 'unchecked'), mode: 'server HTML, no JavaScript rendering',
      unchecked: ['Rendered content and layout', 'Core Web Vitals', 'Actual Google indexing and canonical selection', 'Content quality and search intent', 'Share-card composition', 'Rich-result eligibility and structured-data truthfulness', 'Whether lastmod matches an actual content change'] },
    pages: [...pages.values()].map(({ anchors, jsonLd, ...page }) => page), head }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: { 'max-pages': { type: 'string', default: '20' }, 'expect-noindex': { type: 'boolean', default: false }, json: { type: 'boolean', default: false } } })
    if (positionals.length !== 1) throw new Error('Usage: node scripts/audit.mjs <url> [--max-pages 20] [--expect-noindex] [--json]')
    const result = await auditSite(positionals[0], { maxPages: Number(values['max-pages']), expectNoindex: values['expect-noindex'] })
    if (values.json) console.log(JSON.stringify(result, null, 2))
    else {
      for (const f of result.findings) console.log(`${f.status}: ${f.rule} ${f.url}\n  ${typeof f.evidence === 'string' ? f.evidence : JSON.stringify(f.evidence)}`)
      console.log(`Checked ${result.coverage.parsedPages} HTML pages. Discovered-URL crawl ${result.coverage.crawlComplete ? 'complete' : 'partial'}. ${result.valid ? 'No confirmed failures.' : 'Confirmed failures found.'}`)
      console.log(`Not checked: ${result.coverage.unchecked.join(', ')}.`)
    }
    process.exitCode = result.valid ? 0 : 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 2
  }
}
