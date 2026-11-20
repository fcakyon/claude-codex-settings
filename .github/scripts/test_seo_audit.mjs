import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { gzipSync } from 'node:zlib'
import { auditSite } from '../../plugins/seo-skills/skills/seo-audit/scripts/audit.mjs'
import { checkHead } from '../../plugins/seo-skills/skills/seo-audit/scripts/check_head.mjs'
import { validateDocument } from '../../plugins/seo-skills/skills/schema/scripts/validate_schema.mjs'

const exec = promisify(execFile)
const scripts = resolve('plugins/seo-skills/skills/seo-audit/scripts')
const schemaScripts = resolve('plugins/seo-skills/skills/schema/scripts')
const html = (origin, path, extra = '', body = '', title = path) => `<!doctype html><html><head><title>${title}</title><meta name="description" content="About ${path}"><link rel="canonical" href="${origin}${path}">${extra}</head><body><h1>${title}</h1>${body}</body></html>`
const fakePng = (width, height) => {
  const buf = Buffer.alloc(24)
  buf.write('\x89PNG\r\n\x1a\n', 0, 'latin1')
  buf.writeUInt32BE(width, 16)
  buf.writeUInt32BE(height, 20)
  return buf
}

async function serve(t, route) {
  const hits = []
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    hits.push(url.pathname)
    const reply = route(url, req) ?? { status: 404, body: 'Not found' }
    res.writeHead(reply.status ?? 200, { 'content-type': reply.type ?? 'text/html', ...reply.headers })
    res.end(reply.body ?? '')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => { server.closeAllConnections(); server.close() })
  return { origin: `http://127.0.0.1:${server.address().port}`, hits }
}

const failures = (result) => result.findings.filter((f) => f.status === 'fail')

test('reports date-only profile timestamps on discovered pages', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/') return { body: html(u.origin, '/', '', '<a href="/profile">Profile</a>') }
    if (u.pathname === '/profile') return { body: html(u.origin, '/profile', `<script type="application/ld+json">${JSON.stringify({ '@type': 'ProfilePage', dateCreated: '2026-11-08', dateModified: '2026-11-08T21:03:10+03:00' })}</script>`) }
  })
  const result = await auditSite(origin)
  const dates = result.findings.filter((f) => f.rule === 'schema.profile-date')
  assert.equal(dates.length, 1)
  assert.equal(dates[0].url, `${origin}/profile`)
  assert.match(dates[0].evidence, /dateCreated/)
  assert.doesNotMatch(dates[0].evidence, /dateModified/)
})

test('audits XML indexes, locale pairs, HTTP canonicals, and crawler policies without false failures', async (t) => {
  const { origin } = await serve(t, (u) => {
    const locales = ['en', 'fr'].map((lang) => `<link rel="alternate" hreflang="${lang}" href="${u.origin}/${lang}">`).join('')
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: `User-agent: *\nAllow: /\nUser-agent: GPTBot\nDisallow: /\nSitemap: ${u.origin}/index.xml` }
    if (u.pathname === '/index.xml') return { type: 'application/xml', body: `<sitemapindex><sitemap><loc>${u.origin}/pages.xml</loc></sitemap></sitemapindex>` }
    if (u.pathname === '/pages.xml') return { type: 'application/xml', body: `<urlset>${['/en', '/fr', '/headers'].map((p) => `<url><loc>${u.origin}${p}</loc></url>`).join('')}</urlset>` }
    if (u.pathname === '/headers') return { headers: { Link: `<${u.origin}/headers>; rel="canonical"` }, body: '<html><head><title>HTTP canonical</title></head><body><h1>HTTP canonical</h1></body></html>' }
    if (['/en', '/fr'].includes(u.pathname)) return { body: html(u.origin, u.pathname, locales) }
    if (u.pathname === '/') return { body: html(u.origin, '/', '', '<a href="/en">English</a>') }
  })
  const result = await auditSite(origin)
  assert.deepEqual(failures(result), [])
  assert.equal(result.coverage.parsedPages, 4)
  assert.equal(result.coverage.sitemaps, 2)
  assert.equal(result.coverage.crawlComplete, true)
  assert.equal(result.findings.find((f) => f.rule === 'robots.agent' && f.evidence.agent === 'GPTBot').evidence.allowed, false)
  assert.equal(result.pages.find((p) => p.url.endsWith('/headers')).canonical[0].url, `${origin}/headers`)
})

test('finds broken sitemap, canonical, locale and internal-link contracts without crawling disallowed pages', async (t) => {
  const { origin, hits } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: `User-agent: *\nDisallow: /blocked\nSitemap: ${u.origin}/sitemap.xml` }
    if (u.pathname === '/sitemap.xml') return { type: 'application/xml', body: `<urlset>${['/blocked', '/private', '/old'].map((p) => `<url><loc>${u.origin}${p}</loc></url>`).join('')}</urlset>` }
    if (u.pathname === '/private') return { headers: { 'X-Robots-Tag': 'googlebot: noindex' }, body: html(u.origin, u.pathname) }
    if (u.pathname === '/old') return { status: 301, headers: { location: '/new' } }
    if (u.pathname === '/new') return { body: html(u.origin, u.pathname) }
    if (u.pathname === '/en') return { body: html(u.origin, u.pathname, `<link rel="alternate" hreflang="en" href="${u.origin}/en"><link rel="alternate" hreflang="fr" href="${u.origin}/fr">`) }
    if (u.pathname === '/fr') return { body: html(u.origin, u.pathname) }
    if (u.pathname === '/') return { body: html(u.origin, '/', `<link rel="canonical" href="${u.origin}/private"><script type="application/ld+json">{broken}</script>`, '<a href="/missing">Missing page</a><a href="/en">English</a>') }
  })
  const result = await auditSite(origin)
  const rules = new Set(failures(result).map((f) => f.rule))
  for (const rule of ['sitemap.blocked', 'page.indexing', 'page.redirect', 'page.status', 'canonical.conflict', 'canonical.noindex', 'hreflang.return', 'schema.json']) assert(rules.has(rule), rule)
  assert.equal(hits.includes('/blocked'), false)
  assert.equal(result.valid, false)
})

test('bounds discovery, reports unvisited targets, and does not fetch external canonicals', async (t) => {
  const foreign = await serve(t, () => ({ body: '<title>External</title>' }))
  const { origin, hits } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/') return { body: html(u.origin, '/', `<link rel="canonical" href="${foreign.origin}/">`, '<a href="/ignored" rel="nofollow">Ignored</a><a href="/one">One</a><a href="/two">Two</a><a href="/three">Three</a>') }
    if (['/one', '/two', '/three'].includes(u.pathname)) return { body: html(u.origin, u.pathname) }
  })
  const result = await auditSite(origin, { maxPages: 2 })
  assert.equal(result.coverage.visited, 2)
  assert.equal(result.coverage.crawlComplete, false)
  assert(result.findings.some((f) => f.rule === 'crawl.limit'))
  assert.equal(hits.includes('/ignored'), false)
  assert.equal(hits.includes('/two'), false)
  assert.equal(hits.includes('/three'), false)
  assert.deepEqual(foreign.hits, [])
})

test('treats expected noindex, missing optional files, and training restrictions as policy rather than SEO errors', async (t) => {
  const { origin } = await serve(t, (u) => u.pathname === '/' ? { headers: { 'X-Robots-Tag': 'none, nosnippet' }, body: html(u.origin, '/') } : undefined)
  const result = await auditSite(origin, { expectNoindex: true })
  assert.deepEqual(failures(result), [])
  assert(result.findings.some((f) => f.rule === 'page.snippets' && f.status === 'review'))
  assert.equal(result.pages[0].noindex, true)
  assert.equal(result.pages[0].nofollow, true)
  const publicAudit = await auditSite(origin)
  assert(publicAudit.findings.some((f) => f.rule === 'page.indexing' && f.status === 'fail'))
})

test('reports unavailable robots as unchecked and does not crawl discovered pages', async (t) => {
  const { origin, hits } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { status: 503, type: 'text/plain', body: 'Try later' }
    if (u.pathname === '/') return { body: html(u.origin, '/', '', '<a href="/not-crawled">Later</a>') }
  })
  const result = await auditSite(origin)
  assert.equal(result.coverage.crawlComplete, false)
  assert(result.findings.some((f) => f.rule === 'robots.fetch' && f.status === 'unchecked'))
  assert.equal(hits.includes('/not-crawled'), false)
})

test('preserves query strings and XML entities while matching sitemap and HTML locale annotations', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: `User-agent: *\nAllow: /\nSitemap: ${u.origin}/sitemap.xml` }
    if (u.pathname === '/sitemap.xml') return { type: 'application/xml', body: `<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"><url><loc>${u.origin}/?lang=en&amp;page=1</loc><xhtml:link rel="alternate" hreflang="en" href="${u.origin}/?lang=en&amp;page=1"/></url></urlset>` }
    if (u.pathname === '/') return { body: html(u.origin, '/?lang=en&amp;page=1', '<!-- <link rel="canonical" href="/wrong"> -->') }
  })
  const result = await auditSite(`${origin}/?lang=en&page=1`)
  assert.deepEqual(failures(result), [])
  assert.equal(result.pages[0].canonical[0].url, `${origin}/?lang=en&page=1`)
  assert.equal(result.pages[0].alternates[0].url, `${origin}/?lang=en&page=1`)
})

test('keeps CLI JSON and exit behavior usable without turning crawler warnings into errors', async (t) => {
  const { origin } = await serve(t, (u) => u.pathname === '/' ? { body: html(u.origin, '/') } : undefined)
  const { stdout } = await exec(process.execPath, [join(scripts, 'audit.mjs'), origin, '--json', '--max-pages', '1'])
  const result = JSON.parse(stdout)
  assert.equal(result.valid, true)
  assert.equal(result.coverage.visited, 1)
  const head = JSON.parse((await exec(process.execPath, [join(scripts, 'check_head.mjs'), origin, '--json'])).stdout)
  assert.equal(head.agents.length, 5)
  assert.equal(head.agents[0].title.text, '/')
  await assert.rejects(exec(process.execPath, [join(scripts, 'audit.mjs'), origin, '--max-pages', '0']), (e) => e.code === 2)
})

test('SEO sync preserves local scripts, guidance, and references and excludes installed dependencies from archives', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'seo-sync-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const scriptDir = join(root, '.github/scripts')
  await mkdir(scriptDir, { recursive: true })
  for (const name of ['sync-seo-skills.sh', '_helpers.sh']) await cp(resolve('.github/scripts', name), join(scriptDir, name))
  const bin = join(root, 'bin')
  await mkdir(bin)
  await writeFile(join(bin, 'git'), '#!/bin/sh\necho "Upstream access is forbidden in packaging" >&2\nexit 91\n', { mode: 0o755 })
  const sources = new Map()
  for (const skill of ['seo-audit', 'programmatic-seo', 'schema', 'site-architecture']) {
    const dir = join(root, 'plugins/seo-skills/skills', skill)
    for (const [name, value] of [['SKILL.md', `# ${skill}\nKeep local guidance.\n`], ['scripts/custom.mjs', 'console.log("custom rule")\n'], ['references/local.md', 'Keep local evidence.\n'], ['scripts/package-lock.json', '{"lockfileVersion":3}\n']]) {
      const file = join(dir, name)
      await mkdir(resolve(file, '..'), { recursive: true })
      await writeFile(file, value)
      sources.set(file, value)
    }
    await mkdir(join(dir, 'scripts/node_modules/dependency'), { recursive: true })
    await writeFile(join(dir, 'scripts/node_modules/dependency/unwanted.txt'), 'Do not package installed dependencies.')
  }
  const hashes = []
  for (let run = 0; run < 2; run++) {
    await exec('bash', [join(scriptDir, 'sync-seo-skills.sh')], { env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } })
    for (const [file, expected] of sources) assert.equal(await readFile(file, 'utf8'), expected)
    const archive = join(root, 'plugins/seo-skills/skills/seo-audit/seo-audit.zip')
    hashes.push(await readFile(archive))
    const entries = (await exec('unzip', ['-Z1', archive])).stdout
    assert(entries.includes('seo-audit/scripts/custom.mjs'))
    assert(entries.includes('seo-audit/references/local.md'))
    assert(entries.includes('seo-audit/scripts/package-lock.json'))
    assert(!entries.includes('node_modules'))
  }
  assert.deepEqual(hashes[0], hashes[1])
})


test('checks gzip sitemaps and skips repeated index URLs without an unbounded walk', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'Sitemap: '+u.origin+'/sitemap.xml' }
    if (u.pathname === '/sitemap.xml') return { type: 'application/xml', body: '<sitemapindex><sitemap><loc>'+u.origin+'/sitemap.xml</loc></sitemap><sitemap><loc>'+u.origin+'/pages.xml.gz</loc></sitemap></sitemapindex>' }
    if (u.pathname === '/pages.xml.gz') return { type: 'application/gzip', body: gzipSync('<urlset><url><loc>'+u.origin+'/</loc></url></urlset>') }
    if (u.pathname === '/') return { body: html(u.origin, '/') }
  })
  const result = await auditSite(origin)
  assert.equal(result.coverage.sitemaps, 2)
  assert.deepEqual(failures(result), [])
})

test('separates malformed sitemaps and duplicate metadata from client-rendered content that was not inspected', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/sitemap.xml') return { type: 'application/xml', body: '<urlset><url></urlset>' }
    if (u.pathname === '/') return { body: html(u.origin, '/', '', '<a href="/duplicate">Duplicate</a><a href="/app">App</a>', 'Shared title') }
    if (u.pathname === '/duplicate') return { body: html(u.origin, u.pathname, '', '<img src="/picture.png"><link rel="canonical" href="/body-canonical-ignored">', 'Shared title') }
    if (u.pathname === '/app') return { body: '<html><head><script src="/app.js"></script></head><body><div id="root"></div></body></html>' }
  })
  const result = await auditSite(origin)
  assert(result.findings.some((f) => f.rule === 'sitemap.xml' && f.status === 'fail'))
  assert(result.findings.some((f) => f.rule === 'duplicate.titles' && f.status === 'review'))
  assert(result.findings.some((f) => f.rule === 'page.image-alt' && f.status === 'review'))
  assert(!failures(result).some((f) => f.url.endsWith('/app')))
  assert.equal(result.pages.find((p) => p.url.endsWith('/duplicate')).canonical.length, 1)
  assert(result.coverage.unchecked.includes('Rendered content and layout'))
})

test('keeps blocked user-agent probes and rate limits out of confirmed SEO failures', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/') return { status: 403, body: '<title>Challenge</title>' }
  })
  const result = await auditSite(origin)
  assert.deepEqual(failures(result), [])
  assert.equal(result.coverage.crawlComplete, false)
  assert(result.findings.some((f) => f.rule === 'head.error' && f.status === 'unchecked'))
})


test('does not follow a discovered redirect into a robots-disallowed path', async (t) => {
  const { origin, hits } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nDisallow: /blocked' }
    if (u.pathname === '/') return { body: html(u.origin, '/', '', '<a href="/go">Go</a>') }
    if (u.pathname === '/go') return { status: 302, headers: { location: '/blocked' } }
    if (u.pathname === '/blocked') return { body: html(u.origin, '/blocked') }
  })
  const result = await auditSite(origin)
  assert.equal(hits.includes('/blocked'), false)
  assert(result.findings.some((f) => f.url.endsWith('/go') && f.status === 'unchecked'))
})

test('keeps entry redirects separate from the canonical sitemap destination', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/') return { status: 307, headers: { location: '/en' } }
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/sitemap.xml') return { type: 'application/xml', body: `<urlset><url><loc>${u.origin}/en</loc></url></urlset>` }
    if (u.pathname === '/en') return { body: html(u.origin, '/en') }
  })
  const result = await auditSite(origin)
  assert.deepEqual(failures(result), [])
  assert(result.findings.some((f) => f.rule === 'page.redirect' && f.url === `${origin}/` && f.status === 'review'))
  assert(!result.findings.some((f) => f.rule === 'page.redirect' && f.url === `${origin}/en`))
})

test('flags redirect chains, canonical chains, subpage email obfuscation, and unindexed non-HTML links while deduplicating shared hreflang targets', async (t) => {
  const { origin, hits } = await serve(t, (u) => {
    const locales = `<link rel="alternate" hreflang="en" href="${u.origin}/en"><link rel="alternate" hreflang="x-default" href="${u.origin}/en">`
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/sitemap.xml') return { type: 'application/xml', body: `<urlset><url><loc>${u.origin}/</loc></url></urlset>` }
    if (u.pathname === '/') return { body: html(u.origin, '/', locales, '<a href="/legacy">Legacy</a><a href="/sub">Sub</a><a href="/chain-a">Chain A</a><a href="/llms.txt">LLMs</a>') }
    if (u.pathname === '/legacy') return { status: 308, headers: { location: '/mid' } }
    if (u.pathname === '/mid') return { status: 307, headers: { location: '/sub' } }
    if (u.pathname === '/sub') return { body: html(u.origin, '/sub', '', '<a href="/cdn-cgi/l/email-protection#deadbeef">[email&#160;protected]</a>') }
    if (u.pathname === '/chain-a') return { body: html(u.origin, '/chain-b').replace(`<h1>/chain-b</h1>`, '<h1>/chain-a</h1><a href="/chain-b">B</a>') }
    if (u.pathname === '/chain-b') return { body: html(u.origin, '/').replace('<h1>/</h1>', '<h1>/chain-b</h1>') }
    if (u.pathname === '/en') return { status: 429, body: 'Rate limited' }
    if (u.pathname === '/llms.txt') return { type: 'text/plain', body: '# Site\n> Summary\n## Docs\n- [Home](' + u.origin + '/): Home' }
  })
  const result = await auditSite(origin, { maxPages: 10 })
  assert(result.findings.some((f) => f.rule === 'page.redirect-chain' && f.url === `${origin}/legacy` && f.status === 'fail'))
  assert(result.findings.some((f) => f.rule === 'canonical.chain' && f.url === `${origin}/chain-a` && f.status === 'fail'))
  assert(result.findings.some((f) => f.rule === 'page.email-obfuscation' && f.url === `${origin}/sub` && f.status === 'review'))
  assert(result.findings.some((f) => f.rule === 'page.non-html-indexable' && f.url === `${origin}/llms.txt` && f.status === 'review'))
  assert.equal(hits.includes('/cdn-cgi/l/email-protection'), false)
  assert.equal(result.findings.filter((f) => f.rule === 'hreflang.target' && f.url === `${origin}/`).length, 1)
})

test('surfaces missing noindex on sitemaps, unlinked llms.txt, and generated social image routes', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: `User-agent: *\nAllow: /\nSitemap: ${u.origin}/sitemap.xml` }
    if (u.pathname === '/sitemap.xml') return { type: 'application/xml', body: `<urlset><url><loc>${u.origin}/</loc></url></urlset>` }
    if (u.pathname === '/llms.txt') return { type: 'text/plain', body: `# Site\n> Summary\n## Docs\n- [Home](${u.origin}/): Home` }
    if (u.pathname === '/en/opengraph-image') return { type: 'image/png', body: fakePng(1200, 630) }
    if (u.pathname === '/favicon.png') return { type: 'image/png', body: fakePng(96, 96) }
    if (u.pathname === '/') {
      return {
        body: html(
          u.origin,
          '/',
          `<meta property="og:image" content="${u.origin}/en/opengraph-image"><link rel="icon" type="image/png" sizes="96x96" href="${u.origin}/favicon.png">`
        ),
      }
    }
  })
  const result = await auditSite(origin)
  assert.deepEqual(failures(result), [])
  assert(result.findings.some((f) => f.rule === 'sitemap.indexable' && f.url === `${origin}/sitemap.xml`))
  assert(result.findings.some((f) => f.rule === 'page.non-html-indexable' && f.url === `${origin}/llms.txt`))
  assert(result.findings.some((f) => f.rule === 'page.non-html-indexable' && f.url === `${origin}/en/opengraph-image`))
  assert(!result.findings.some((f) => f.url === `${origin}/favicon.png`))
})

test('checks nested ItemList Dataset schemas, Dataset warnings, and --url schema validation', async (t) => {
  const listSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      { '@type': 'Dataset', name: 'Sample Set', description: 'Rows.', url: 'https://example.com/d', sameAs: ['http://localhost:3033/x'] },
    ],
  }
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/') return { body: html(u.origin, '/', `<script type="application/ld+json">${JSON.stringify(listSchema)}</script>`) }
  })
  const result = await auditSite(origin)
  const rec = result.findings.find((f) => f.rule === 'schema.recommended' && f.url === `${origin}/`)
  assert(rec && /Dataset\.creator/.test(rec.evidence) && /Dataset\.license/.test(rec.evidence))
  assert(failures(result).some((f) => f.rule === 'metadata.localhost-url' && /sameAs/.test(f.evidence)))

  const { stdout } = await exec(process.execPath, [join(schemaScripts, 'validate_schema.mjs'), '--url', `${origin}/`]).catch((e) => e)
  const cliReport = JSON.parse(stdout)
  assert.equal(cliReport.valid, false)
  assert(cliReport.types.includes('Dataset'))
  assert(cliReport.warnings.some((w) => w.includes('recommended property "creator"')))
  assert(cliReport.errors.some((e) => e.includes('local host')))

  const validDataset = validateDocument({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Valid Set',
    description: 'Clean.',
    url: 'https://example.com/d',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: { '@type': 'Person', name: 'Author' },
  }, { required: { Dataset: ['name', 'description'] }, recommended: { Dataset: ['creator', 'license'] } })
  assert.equal(validDataset.valid, true)
  assert.deepEqual(validDataset.warnings, [])

  const wrappedList = validateDocument({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: { '@type': 'Dataset', name: 'Wrapped', creator: [] } },
    ],
  }, { required: { Dataset: ['name', 'description'] }, recommended: { Dataset: ['creator', 'license'] } })
  assert.equal(wrappedList.valid, false)
  assert(wrappedList.errors.some((e) => e.includes('missing the required property "description"')))
  assert(wrappedList.warnings.some((w) => w.includes('recommended property "creator"')))

  await assert.rejects(exec(process.execPath, [join(schemaScripts, 'validate_schema.mjs'), '--url', 'not-a-url']), (e) => e.code === 2)
})

test('fails on localhost leaks and surfaces noindex canonical conflicts, subpage previews, and full-sitemap slug hygiene', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: `User-agent: *\nAllow: /\nSitemap: ${u.origin}/sitemap.xml` }
    if (u.pathname === '/sitemap.xml') {
      return {
        headers: { 'X-Robots-Tag': 'noindex' },
        type: 'application/xml',
        body: `<urlset><url><loc>${u.origin}/</loc></url><url><loc>${u.origin}/sub</loc></url><url><loc>${u.origin}/</loc></url><url><loc>${u.origin}/en/titles/-tt22695402</loc></url><url><loc>${u.origin}/en//bad</loc></url></urlset>`,
      }
    }
    if (u.pathname === '/') {
      return {
        body: html(
          u.origin,
          '/',
          '<meta name="robots" content="max-image-preview:large"><meta property="og:image" content="http://localhost:3033/og.png">',
          '<a href="/sub">Sub</a><a href="/configure">Configure</a>'
        ),
      }
    }
    if (['/sub', '/en/titles/-tt22695402', '/en//bad'].includes(u.pathname)) return { body: html(u.origin, u.pathname) }
    if (u.pathname === '/configure') return { headers: { 'X-Robots-Tag': 'noindex' }, body: html(u.origin, '/') }
  })
  const full = await auditSite(origin, { maxPages: 10 })
  const fails = failures(full)
  assert(fails.some((f) => f.rule === 'metadata.localhost-url' && f.url === `${origin}/`))
  assert(full.findings.some((f) => f.rule === 'canonical.noindex-conflict' && f.url === `${origin}/configure`))
  assert(full.findings.some((f) => f.rule === 'page.max-image-preview' && f.url === `${origin}/sub`))
  const bounded = await auditSite(origin, { maxPages: 2 })
  assert(bounded.findings.some((f) => f.rule === 'sitemap.duplicate-loc'))
  assert(bounded.findings.some((f) => f.rule === 'sitemap.malformed-slug' && f.evidence.examples.some((u) => u.endsWith('/-tt22695402'))))
  assert(bounded.findings.some((f) => f.rule === 'sitemap.malformed-url' && f.evidence.examples.some((u) => u.includes('/en//bad'))))
})

test('checkHead catches meta property mismatches, small favicons masked by apple-touch-icon, unknown canonical leaks, and redirect chains', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/old') return { status: 301, headers: { location: '/mid' } }
    if (u.pathname === '/mid') return { status: 302, headers: { location: '/' } }
    if (u.pathname === '/icon-48.png') return { type: 'image/png', body: fakePng(48, 48) }
    if (u.pathname === '/apple-touch-icon.png') return { type: 'image/png', body: fakePng(180, 180) }
    if (u.pathname === '/share.png') return { type: 'image/png', body: fakePng(1200, 630) }
    if (u.pathname === '/') {
      return {
        body: html(
          u.origin,
          '/',
          `<meta property="twitter:card" content="summary_large_image"><meta property="og:title" content="Home"><meta property="og:description" content="Desc"><meta property="og:url" content="${u.origin}/"><meta property="og:image" content="${u.origin}/share.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Home"><link rel="icon" type="image/png" sizes="48x48" href="${u.origin}/icon-48.png"><link rel="apple-touch-icon" href="${u.origin}/apple-touch-icon.png">`
        ),
      }
    }
    return { status: 404, body: html(u.origin, '/') }
  })
  const report = await checkHead(`${origin}/old`)
  const agentWarnings = report.agents[0].warnings
  const siteWarnings = report.site.warnings
  assert(agentWarnings.some((w) => /Use name="twitter:card"/.test(w)))
  assert(agentWarnings.some((w) => /2 redirects/.test(w)))
  assert(siteWarnings.some((w) => /largest raster favicon is 48px/.test(w)))
  assert(siteWarnings.some((w) => /unknown URL declares canonical/.test(w)))
})

test('ignores non-sitemap HTML fallback for sitemap.indexable and catches subpage root-canonical leaks on 404', async (t) => {
  const { origin } = await serve(t, (u) => {
    if (u.pathname === '/robots.txt') return { type: 'text/plain', body: 'User-agent: *\nAllow: /' }
    if (u.pathname === '/sitemap.xml') return { status: 200, type: 'text/html', body: '<html><body>Not a sitemap</body></html>' }
    if (u.pathname === '/pricing') return { body: html(u.origin, '/pricing') }
    return { status: 404, body: html(u.origin, '/') }
  })
  const audit = await auditSite(`${origin}/pricing`)
  assert(!audit.findings.some((f) => f.rule === 'sitemap.indexable'))
  assert(audit.findings.some((f) => f.rule === 'sitemap.format' && f.status === 'unchecked'))
  const head = await checkHead(`${origin}/pricing`)
  assert(head.site.warnings.some((w) => /unknown URL declares canonical/.test(w)))
})

test('packaged seo-audit.zip runs standalone without cross-skill imports', async (t) => {
  const { origin } = await serve(t, (u) => u.pathname === '/' ? { body: html(u.origin, '/') } : undefined)
  const tmp = await mkdtemp(join(tmpdir(), 'seo-zip-run-'))
  t.after(() => rm(tmp, { recursive: true, force: true }))
  await exec('bash', [resolve('.github/scripts/sync-seo-skills.sh')])
  await exec('unzip', ['-q', resolve('plugins/seo-skills/skills/seo-audit/seo-audit.zip'), '-d', tmp])
  const zipScripts = join(tmp, 'seo-audit/scripts')
  await exec('ln', ['-s', join(scripts, 'node_modules'), join(zipScripts, 'node_modules')])
  const { stdout } = await exec(process.execPath, [join(zipScripts, 'audit.mjs'), origin, '--json'])
  assert.equal(JSON.parse(stdout).valid, true)
})
