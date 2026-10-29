#!/usr/bin/env node

const CHROME = "156.0.0.0";
const AGENTS = {
  browser: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME} Safari/537.36`,
  googlebot: `Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME} Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`,
  gptbot:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot",
  claudebot:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  perplexitybot:
    "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
};
const RUNS_JAVASCRIPT = new Set(["browser", "googlebot"]);
const CACHE_PARAM = "check_head";
const MAX_REDIRECTS = 10;
const TIMEOUT_MS = 30_000;
const HEAD_ELEMENT = /^(html|head|title|meta|link|script|style|base|template)$/;
const STOP_WORD =
  /^(an|and|are|as|at|be|by|for|from|how|in|is|it|my|of|on|or|our|the|to|vs|what|which|why|with|you|your)$/;
const LATIN_1 =
  "nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml";
const ENTITIES = {
  ...Object.fromEntries(
    LATIN_1.split(" ").map((name, index) => [name, String.fromCodePoint(160 + index)])
  ),
  amp: "&",
  apos: "'",
  bull: "\u2022",
  euro: "\u20ac",
  gt: ">",
  hellip: "\u2026",
  ldquo: "\u201c",
  lsquo: "\u2018",
  lt: "<",
  mdash: "\u2014",
  ndash: "\u2013",
  quot: '"',
  rdquo: "\u201d",
  rsquo: "\u2019",
  trade: "\u2122",
};
const RAW_TEXT = /<!--[\s\S]*?-->|<(script|style|svg|noscript)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi;
const TAG = /<([a-z][\w:-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/gi;
const ATTRIBUTE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
const ABSOLUTE_URL = /^https?:\/\//i;
const CACHE_QUERY = new RegExp(`([?&])${CACHE_PARAM}=[^&]*(&|$)`);
const CHARSET = /charset\s*=\s*["']?([\w:.-]+)/i;
const VALUED_RULE = /^(max-snippet|max-image-preview|max-video-preview|unavailable_after)$/i;
const WORDS = new Intl.Segmenter(undefined, { granularity: "word" });

const args = process.argv.slice(2);
const json = args.includes("--json");
const target = args.find((arg) => arg !== "--json");
if (args.length !== (json ? 2 : 1) || !ABSOLUTE_URL.test(target ?? "") || !URL.canParse(target)) {
  console.error("Usage: node scripts/check_head.mjs <url> [--json]");
  process.exit(2);
}

const decode = (text) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z][a-z\d]*);/gi, (entity, name) => {
    if (name[0] !== "#") return ENTITIES[name] ?? entity;
    const point = Number(`0${name.slice(1)}`);
    return point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  });
const clean = (html) => decode(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
const length = (text) => [...text].length;
const attributesOf = (source) =>
  Object.fromEntries(
    [...source.matchAll(ATTRIBUTE)].map(([, name, ...values]) => [
      name.toLowerCase(),
      decode(values.find((value) => value !== undefined) ?? ""),
    ])
  );
const mainWords = (text) =>
  new Set(
    [...WORDS.segment(text.toLowerCase())]
      .filter(
        ({ isWordLike, segment }) => isWordLike && segment.length > 1 && !STOP_WORD.test(segment)
      )
      .map(({ segment }) => (segment.length > 3 ? segment.replace(/['\u2019]?s$/, "") : segment))
  );
const typesOf = (value) => {
  if (Array.isArray(value)) return value.flatMap(typesOf);
  if (typeof value !== "object" || value === null) return [];
  return [value["@type"], typesOf(value["@graph"] ?? [])]
    .flat(2)
    .filter((type) => typeof type === "string");
};
// Edit the query as a string, since URLSearchParams re-encodes it (%20 becomes +).
const withoutCache = (search) =>
  search.replace(CACHE_QUERY, (match, start, end) => (end ? start : ""));
const pageUrl = (url) => {
  const page = new URL(url);
  page.search = withoutCache(page.search);
  page.hash = "";
  return page.href;
};
// Google reads every robots and googlebot meta, and X-Robots-Tag rules scoped to googlebot or to no agent.
const googleRules = (metas, header) => {
  let agent = "";
  const headerRules = header.split(",").flatMap((rule) => {
    const [, name, rest] = rule.match(/^\s*([\w-]+)\s*:(.*)$/) ?? [];
    if (name && !VALUED_RULE.test(name)) [agent, rule] = [name.toLowerCase(), rest];
    return !agent || agent === "googlebot" ? [rule] : [];
  });
  return [...metas.flatMap((meta) => meta.split(",")), ...headerRules]
    .map((rule) => rule.trim())
    .filter(Boolean);
};
const readHtml = async (response) => {
  const bytes = await response.arrayBuffer();
  const charset =
    response.headers.get("content-type")?.match(CHARSET)?.[1] ??
    new TextDecoder("latin1").decode(bytes.slice(0, 1024)).match(CHARSET)?.[1] ??
    "utf-8";
  return new TextDecoder(charset).decode(bytes);
};

const fetchPage = async (userAgent) => {
  let url = new URL(target);
  const redirects = [];
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  while (true) {
    const search = withoutCache(url.search);
    url.search = `${search}${search ? "&" : ""}${CACHE_PARAM}=${crypto.randomUUID().slice(0, 8)}`;
    const response = await fetch(url, {
      // An empty Accept-Language replaces fetch's default "*", which some sites answer with a random locale.
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "",
        "user-agent": userAgent,
      },
      redirect: "manual",
      signal,
    });
    const location = response.headers.get("location");
    if (response.status < 300 || response.status > 399 || !location)
      return { redirects, response, url };
    if (redirects.length === MAX_REDIRECTS) throw new Error(`more than ${MAX_REDIRECTS} redirects`);
    redirects.push({ status: response.status, url: pageUrl(url) });
    url = new URL(location, url);
  }
};

const inspect = async ([agent, userAgent]) => {
  const errors = [];
  const warnings = [];
  let redirects, response, url, html;
  try {
    ({ redirects, response, url } = await fetchPage(userAgent));
    if (!response.ok) errors.push(`The page returned ${response.status}.`);
    else if (!/html/i.test(response.headers.get("content-type") ?? "")) {
      errors.push("The response is not HTML.");
    }
    if (errors.length) await response.body?.cancel();
    else html = await readHtml(response);
  } catch (error) {
    return { agent, errors: [`Fetch failed: ${error.cause?.message ?? error.message}.`], warnings };
  }
  const page = pageUrl(url);
  const xRobotsTag = response.headers.get("x-robots-tag");
  const base = { agent, status: response.status, url: page, redirects, xRobotsTag };
  if (errors.length) return { ...base, errors, warnings };

  const jsonLd = [];
  // Keep an svg's accessible name as text, so a logo H1 is not read as empty.
  const doc = html.replace(RAW_TEXT, (match, element = "", attributes, body) => {
    if (/application\/ld\+json/i.test(attributes)) jsonLd.push(body);
    if (element.toLowerCase() !== "svg") return "";
    const label = attributesOf(attributes)["aria-label"];
    return ` ${label ?? clean(body.match(/<title\b[^>]*>([\s\S]*?)<\/title/i)?.[1] ?? "")} `;
  });
  const tags = [...doc.matchAll(TAG)].map((match) => {
    const attributes = attributesOf(match[2]);
    const key = attributes.name ?? attributes.property ?? attributes.rel ?? "";
    return {
      attributes,
      end: match.index + match[0].length,
      keys: key.toLowerCase().split(/\s+/),
      name: match[1].toLowerCase(),
      start: match.index,
    };
  });
  const headClose = doc.search(/<\/head\s*>/i);
  const breaker = tags.find((tag) => !HEAD_ELEMENT.test(tag.name));
  const headEnd = Math.min(headClose < 0 ? Infinity : headClose, breaker?.start ?? Infinity);
  for (const tag of tags) tag.in = tag.start < headEnd ? "head" : "body";
  if (breaker && breaker.start < headClose) {
    warnings.push(
      `<${breaker.name}> inside <head> ends the head early, so Google ignores the head tags after it.`
    );
  }

  const find = (name, ...keys) => {
    const found = tags.filter(
      (tag) => tag.name === name && (!keys.length || keys.some((key) => tag.keys.includes(key)))
    );
    return found.find((tag) => tag.in === "head") ?? found[0];
  };
  const content = (...keys) => find("meta", ...keys)?.attributes.content?.trim() || null;
  const titleTag = find("title");
  const title = titleTag
    ? clean(doc.slice(titleTag.end).match(/^[\s\S]*?(?=<\/title)/i)?.[0] ?? "")
    : "";
  const descriptionTag = find("meta", "description");
  const description = content("description") ?? "";
  const canonicalTag = find("link", "canonical");
  const canonical = canonicalTag?.attributes.href ?? "";
  const hreflangTags = tags.filter(
    (tag) => tag.name === "link" && tag.keys.includes("alternate") && "hreflang" in tag.attributes
  );
  const hreflangTag = hreflangTags.find((tag) => tag.in === "head") ?? hreflangTags[0];
  const located = {
    "<title>": titleTag,
    "the meta description": descriptionTag,
    "the canonical link": canonicalTag,
    "the hreflang links": hreflangTag,
  };
  for (const [label, tag] of Object.entries(located)) {
    if (tag?.in !== "body") continue;
    const message = `Found ${label} only in <body>, where parsers that read just the head miss it.`;
    (RUNS_JAVASCRIPT.has(agent) ? warnings : errors).push(message);
  }

  if (!title) errors.push("The page has no <title> text.");
  if (!description) warnings.push("The page has no meta description.");

  const canonicalUrl = URL.canParse(canonical, url) ? new URL(canonical, url) : null;
  const self = canonicalUrl?.href.split("#")[0] === page;
  if (!canonicalTag) warnings.push("The page has no canonical link.");
  else if (!canonicalUrl) errors.push(`The canonical is not a valid URL: "${canonical}".`);
  else {
    if (!ABSOLUTE_URL.test(canonical)) {
      warnings.push(`The canonical is relative: "${canonical}". Google recommends absolute URLs.`);
    }
    if (!self) warnings.push(`The canonical points to ${canonicalUrl.href}, not to ${page}.`);
  }

  const metas = tags.filter(
    (tag) => tag.name === "meta" && (tag.keys.includes("robots") || tag.keys.includes("googlebot"))
  );
  const rules = googleRules(
    metas.map((tag) => tag.attributes.content ?? ""),
    xRobotsTag ?? ""
  );
  // The more restrictive of conflicting rules applies.
  const robots = {
    maxImagePreviewLarge:
      rules.some((rule) => /^max-image-preview\s*:\s*large$/i.test(rule)) &&
      !rules.some((rule) => /^(noimageindex|max-image-preview\s*:\s*(none|standard))$/i.test(rule)),
    rules,
  };
  if (!robots.maxImagePreviewLarge) {
    warnings.push(
      "No robots rule sets max-image-preview:large, which Google recommends for Discover."
    );
  }
  if (rules.some((rule) => /^noindex$/i.test(rule))) warnings.push("A robots rule says noindex.");

  const openGraph = { image: content("og:image", "og:image:url"), url: content("og:url") };
  for (const [label, value] of Object.entries(openGraph)) {
    if (!value) warnings.push(`The page has no og:${label}.`);
    else if (!ABSOLUTE_URL.test(value))
      errors.push(`og:${label} must be an absolute URL: "${value}".`);
  }
  const twitter = {
    card: content("twitter:card"),
    image: content("twitter:image", "twitter:image:src"),
  };
  if (!twitter.card) {
    warnings.push("The page has no twitter:card, so X shows at most a small summary card.");
  }

  const h1 = [...doc.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map(([, text]) =>
    clean(
      text.replace(
        /<img\b([^>]*)>/gi,
        (img, attributes) => ` ${attributesOf(attributes).alt ?? ""} `
      )
    )
  );
  const titleWords = mainWords(title);
  const shared = h1.length ? [...mainWords(h1[0])].filter((word) => titleWords.has(word)) : [];
  if (!h1.length) warnings.push("The server HTML has no <h1>.");
  else if (!h1[0]) warnings.push("The first <h1> has no text.");
  else if (title && !shared.length) {
    warnings.push("The title and the first <h1> share no main words.");
  }

  const types = [];
  jsonLd.forEach((block, index) => {
    try {
      types.push(...typesOf(JSON.parse(block)));
    } catch (error) {
      errors.push(`JSON-LD block ${index + 1} is not valid JSON: ${error.message}.`);
    }
  });

  return {
    ...base,
    title: titleTag ? { in: titleTag.in, length: length(title), text: title } : null,
    description: descriptionTag ? { in: descriptionTag.in, length: length(description) } : null,
    canonical: canonicalTag
      ? { absolute: ABSOLUTE_URL.test(canonical), href: canonical, in: canonicalTag.in, self }
      : null,
    hreflang: { count: hreflangTags.length, in: hreflangTag?.in ?? null },
    robots,
    openGraph,
    twitter,
    h1: { count: h1.length, shared, texts: h1 },
    jsonLd: { blocks: jsonLd.length, types: [...new Set(types)] },
    errors,
    warnings,
  };
};

const rows = (r) => [
  ["title", r.title ? `${r.title.in}, ${r.title.length} chars, "${r.title.text}"` : "missing"],
  ["description", r.description ? `${r.description.in}, ${r.description.length} chars` : "missing"],
  ["canonical", r.canonical ? `${r.canonical.in}, ${r.canonical.href}` : "missing"],
  ["hreflang", r.hreflang.count ? `${r.hreflang.count} in ${r.hreflang.in}` : "none"],
  ["robots", r.robots.rules.join(", ") || "none"],
  ["og:url", r.openGraph.url ?? "missing"],
  ["og:image", r.openGraph.image ?? "missing"],
  ["twitter:card", r.twitter.card ?? "missing"],
  ["twitter:image", r.twitter.image ?? (r.openGraph.image ? "falls back to og:image" : "missing")],
  [
    "h1",
    r.h1.count
      ? `${r.h1.count}, ${r.h1.texts[0] ? `"${r.h1.texts[0]}"` : "empty"}, shares ${r.h1.shared.join(", ") || "nothing"} with the title`
      : "missing",
  ],
  [
    "json-ld",
    r.jsonLd.blocks ? `${r.jsonLd.blocks}: ${r.jsonLd.types.join(", ") || "no @type"}` : "none",
  ],
];

const reports = await Promise.all(Object.entries(AGENTS).map(inspect));
const valid = reports.every((report) => report.errors.length === 0);
if (json) console.log(JSON.stringify({ agents: reports, url: target, valid }, null, 2));
else {
  const groups = new Map();
  for (const report of reports) {
    const key = JSON.stringify({ ...report, agent: undefined });
    groups.set(key, [...(groups.get(key) ?? []), report]);
  }
  for (const group of groups.values()) {
    const [report] = group;
    const hops = report.status
      ? [...report.redirects, report].map((hop) => `${hop.status} ${hop.url}`)
      : ["no response"];
    console.log(`${group.map(({ agent }) => agent).join(", ")}: ${hops.join(" -> ")}`);
    if (report.title !== undefined) {
      for (const [label, value] of rows(report)) console.log(`  ${label.padEnd(14)}${value}`);
    }
    for (const message of report.errors) console.log(`  error: ${message}`);
    for (const message of report.warnings) console.log(`  warning: ${message}`);
    console.log();
  }
  const failing = reports.filter((report) => report.errors.length).map(({ agent }) => agent);
  console.log(failing.length ? `Errors for ${failing.join(", ")}.` : "No errors.");
}
process.exitCode = valid ? 0 : 1;
