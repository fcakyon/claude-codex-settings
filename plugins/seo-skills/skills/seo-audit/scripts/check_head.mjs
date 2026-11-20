#!/usr/bin/env node

import { setDefaultResultOrder } from "node:dns";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

setDefaultResultOrder("ipv4first");

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
const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)$/i;
export const isLoopbackHost = (hostname) =>
  LOOPBACK_HOST.test(hostname) || /\.local$/i.test(hostname);
export const isGeneratedImageRoute = (value) => {
  const pathname = typeof value === "string" ? URL.parse(value)?.pathname : value?.pathname;
  return /\/(?:opengraph|twitter)-image(?:-[a-f0-9]{6,})?$/i.test(pathname ?? "");
};
const CACHE_QUERY = new RegExp(`([?&])${CACHE_PARAM}=[^&]*(&|$)`);
const CHARSET = /charset\s*=\s*["']?([\w:.-]+)/i;
const ORGANIZATION = /Organization$|^(Corporation|LocalBusiness|OnlineBusiness|OnlineStore)$/;
const VALUED_RULE = /^(max-snippet|max-image-preview|max-video-preview|unavailable_after)$/i;
const WORDS = new Intl.Segmenter(undefined, { granularity: "word" });


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
const SCHEMA_URL_KEYS = new Set(["url", "logo", "image", "item", "target", "sameAs", "license"]);
const SCHEMA_REQUIRED = {
  BreadcrumbList: ["itemListElement"],
  Dataset: ["name", "description"],
  Event: ["name", "startDate", "location"],
  FAQPage: ["mainEntity"],
  HowTo: ["name", "step"],
  LocalBusiness: ["name", "address"],
  Product: ["name", "image", "offers"],
  SoftwareApplication: ["name", "offers"],
};
const SCHEMA_RECOMMENDED = {
  Article: ["headline", "image", "datePublished", "author"],
  BlogPosting: ["headline", "image", "datePublished", "author"],
  Dataset: ["creator", "license"],
  ProfilePage: ["dateCreated", "dateModified"],
};
const stringItems = (value) =>
  typeof value === "string" ? [value] : Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
const isMissingSchemaValue = (value) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
const typesOf = (node) => stringItems(node["@type"]);
const isInvalidProfileDate = (value) =>
  value != null &&
  (typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value) ||
    Number.isNaN(Date.parse(value)));

export const inspectJsonLd = (document, { origin } = {}) => {
  const seen = new WeakSet();
  const nodes = [];
  const profileDates = new Set();
  const missingRequired = new Set();
  const missingRecommended = new Set();
  const relativeUrls = new Set();
  const localhostUrls = new Set();

  const walk = (value, checkShape) => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, checkShape);
      return;
    }
    if (typeof value !== "object" || value === null || seen.has(value)) return;
    seen.add(value);
    nodes.push(value);
    if (Array.isArray(value["@graph"])) walk(value["@graph"], checkShape);
    const nodeTypes = typesOf(value);
    const label = nodeTypes[0] ?? "node";
    if (nodeTypes.includes("ProfilePage")) {
      for (const key of ["dateCreated", "dateModified"]) {
        if (isInvalidProfileDate(value[key])) profileDates.add(key);
      }
    }
    if (checkShape) {
      for (const type of nodeTypes) {
        for (const [table, out] of [[SCHEMA_REQUIRED, missingRequired], [SCHEMA_RECOMMENDED, missingRecommended]]) {
          for (const prop of table[type] ?? []) {
            if (isMissingSchemaValue(value[prop])) out.add(`${type}.${prop}`);
          }
        }
      }
    }
    const isListItem = nodeTypes.includes("ListItem");
    for (const [key, fieldValue] of Object.entries(value)) {
      if (key === "@graph") continue;
      if (SCHEMA_URL_KEYS.has(key)) {
        for (const candidate of stringItems(fieldValue)) {
          if (!ABSOLUTE_URL.test(candidate)) {
            relativeUrls.add(`${label}.${key}: ${candidate}`);
            continue;
          }
          const parsed = URL.parse(candidate);
          if (parsed && isLoopbackHost(parsed.hostname) && (!origin || parsed.origin !== origin)) {
            localhostUrls.add(`${label}.${key}: ${candidate}`);
          }
        }
      }
      const nextCheckShape =
        key === "itemListElement" ||
        ((key === "item" || key === "mainEntity") &&
          typeof fieldValue === "object" &&
          fieldValue !== null &&
          !Array.isArray(fieldValue) &&
          typesOf(fieldValue).length > 0 &&
          (key === "mainEntity" || isListItem));
      walk(fieldValue, nextCheckShape);
    }
  };
  walk(document, true);
  return {
    nodes,
    profileDates: [...profileDates],
    missingRequired: [...missingRequired],
    missingRecommended: [...missingRecommended],
    relativeUrls: [...relativeUrls],
    localhostUrls: [...localhostUrls],
  };
};

export const invalidProfileDates = (document) => inspectJsonLd(document).profileDates;

export const hasNoindexRules = (rules) => rules.some((rule) => /^(noindex|none)$/i.test(rule));
export const hasNoindexHeader = (header) => hasNoindexRules(googleRules([], header ?? ""));
export const allowsLargeImagePreview = (rules) =>
  rules.some((rule) => /^max-image-preview\s*:\s*large$/i.test(rule)) &&
  !rules.some((rule) => /^(noimageindex|max-image-preview\s*:\s*(none|standard))$/i.test(rule));

export const findMetaAttributeMismatches = (tags) => {
  const messages = new Set();
  for (const tag of tags) {
    if (tag.name !== "meta") continue;
    const prop = tag.attributes?.property?.toLowerCase();
    const attrName = tag.attributes?.name?.toLowerCase();
    if (prop && (/^(robots|googlebot|description)$/.test(prop) || prop.startsWith("twitter:"))) {
      messages.add(`Use name="${tag.attributes.property}" instead of property="${tag.attributes.property}" on <meta>.`);
    }
    if (attrName && attrName.startsWith("og:")) {
      messages.add(`Use property="${tag.attributes.name}" instead of name="${tag.attributes.name}" on <meta>.`);
    }
  }
  return [...messages];
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
export const googleRules = (metas, header) => {
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

const fetchPage = async (userAgent, target) => {
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

const inspect = async ([agent, userAgent], target) => {
  const errors = [];
  const warnings = [];
  let redirects, response, url, html;
  try {
    ({ redirects, response, url } = await fetchPage(userAgent, target));
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
  for (const mismatch of findMetaAttributeMismatches(tags)) warnings.push(mismatch);

  const pageOrigin = url.origin;
  const flagLocalhost = (label, raw) => {
    const resolved = raw ? URL.parse(raw, url) : null;
    if (resolved && isLoopbackHost(resolved.hostname) && resolved.origin !== pageOrigin) {
      errors.push(`${label} points to a local host (${resolved.href}).`);
    }
  };

  if (redirects.length > 5) {
    warnings.push(`The URL takes ${redirects.length} redirects. Discord previews stop after 5.`);
  } else if (redirects.length > 1) {
    warnings.push(`The URL takes ${redirects.length} redirects. Collapse redirect chains to a single hop.`);
  }
  if (!title) warnings.push("The server HTML has no <title> text. Check rendered metadata separately.");
  if (!description) warnings.push("The page has no meta description.");

  const canonicalUrl = URL.canParse(canonical, url) ? new URL(canonical, url) : null;
  const self = canonicalUrl?.href.split("#")[0] === page;
  if (!canonicalTag) warnings.push("The page has no canonical link.");
  else if (!canonicalUrl) errors.push(`The canonical is not a valid URL: "${canonical}".`);
  else {
    flagLocalhost("canonical", canonical);
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
    maxImagePreviewLarge: allowsLargeImagePreview(rules),
    rules,
  };
  const isNoindex = hasNoindexRules(rules);
  if (!isNoindex && !robots.maxImagePreviewLarge) {
    warnings.push(
      "No robots rule sets max-image-preview:large, which Google recommends for Discover."
    );
  }
  if (isNoindex) warnings.push("A robots rule says noindex.");

  const openGraph = { image: content("og:image", "og:image:url"), url: content("og:url") };
  for (const [label, value] of Object.entries(openGraph)) {
    if (!value) warnings.push(`The page has no og:${label}.`);
    else {
      flagLocalhost(`og:${label}`, value);
      if (!ABSOLUTE_URL.test(value))
        errors.push(`og:${label} must be an absolute URL: "${value}".`);
    }
  }
  const twitter = {
    card: content("twitter:card"),
    image: content("twitter:image", "twitter:image:src"),
  };
  if (twitter.image) flagLocalhost("twitter:image", twitter.image);
  const shareImages = [
    ["og:image", openGraph.image],
    ["twitter:image", twitter.image !== openGraph.image && twitter.image],
  ].filter(([, value]) => value);
  for (const [label, value] of shareImages) {
    const imageUrl = URL.parse(value, url);
    if (
      imageUrl?.origin === url.origin &&
      /\/(?:opengraph|twitter)-image$/.test(imageUrl.pathname) &&
      !imageUrl.search
    )
      warnings.push(
        `${label} has no version hash, so social caches keep the old card. Inherit the hashed URL from parent metadata or the opengraph-image file convention.`
      );
  }
  for (const key of ["og:title", "og:description"]) {
    if (!content(key)) warnings.push(`The page has no ${key}, which WhatsApp needs for a preview.`);
  }
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

  const nodes = [];
  for (let index = 0; index < jsonLd.length; index++) {
    let parsed;
    try {
      parsed = JSON.parse(jsonLd[index]);
    } catch (error) {
      errors.push(`JSON-LD block ${index + 1} is not valid JSON: ${error.message}.`);
      continue;
    }
    const schemaReport = inspectJsonLd(parsed, { origin: pageOrigin });
    nodes.push(...schemaReport.nodes);
    for (const issue of schemaReport.localhostUrls) errors.push(`JSON-LD ${issue} points to a local host.`);
    for (const missing of [...schemaReport.missingRequired, ...schemaReport.missingRecommended]) {
      warnings.push(`JSON-LD ${missing} is missing.`);
    }
    for (const rel of schemaReport.relativeUrls) warnings.push(`JSON-LD ${rel} is not an absolute URL.`);
  }
  const types = nodes.flatMap(typesOf);
  const organization = nodes.find((node) => typesOf(node).some((type) => ORGANIZATION.test(type)));
  // A value can be inline or an @id reference to a node elsewhere in the graph.
  const resolve = (value) => {
    const ref = [value].flat()[0];
    return nodes.find((node) => ref?.["@id"] && node["@id"] === ref["@id"]) ?? ref;
  };
  const logoNode = resolve(organization?.logo);
  const logo = logoNode?.contentUrl ?? logoNode?.url ?? logoNode;
  const profile = nodes.find((node) => typesOf(node).includes("ProfilePage"));
  const entity = resolve(profile?.mainEntity);
  const icons = tags
    .filter((tag) => tag.name === "link" && tag.keys.some((key) => /^(icon|apple-touch-icon)/.test(key)))
    .map((tag) => ({ href: tag.attributes.href, rel: tag.keys.join(" ") }));

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
    // Inputs for the once-per-run site checks, left out of the per-agent output.
    site: {
      bytes: {
        head: Buffer.byteLength(html.split(/<\/head\s*>|<body\b/i)[0]),
        html: Buffer.byteLength(html),
      },
      emailObfuscated: html.includes("/cdn-cgi/l/email-protection"),
      icons,
      organization: organization && {
        logo: typeof logo === "string" ? logo : null,
        sameAs: [organization.sameAs ?? []].flat(),
        url: organization.url ?? null,
      },
      profile: profile && {
        invalidDates: invalidProfileDates(profile),
        missingDates: ["dateCreated", "dateModified"].filter((key) => !profile[key]),
        named: Boolean(entity?.name ?? entity?.alternateName),
      },
      shareImageMeta: {
        alt: content("og:image:alt", "twitter:image:alt"),
        height: Number(content("og:image:height")) || null,
        width: Number(content("og:image:width")) || null,
      },
      shareImages,
    },
  };
};

const KB = 1024;
const SHARE_FORMATS = /^image\/(jpeg|png|gif)$/;
const GOOGLE_IMAGE_FORMATS = /^image\/(bmp|gif|jpeg|png|webp|svg\+xml|avif)$/;
const UNREACHABLE = /^(ENOTFOUND|ECONNREFUSED)$/;
// Read pixel size from the file header of the formats share cards and icons use.
const imageSize = (bytes) => {
  if (bytes.length < 22) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start, end) => String.fromCharCode(...bytes.subarray(start, end));
  const u24 = (at) => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
  if (ascii(1, 4) === "PNG" && bytes.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (ascii(0, 3) === "GIF")
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP" && bytes.length >= 30) {
    const chunk = ascii(12, 16);
    if (chunk === "VP8X") return { width: u24(24) + 1, height: u24(27) + 1 };
    if (chunk === "VP8L") {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }
  if (bytes[0] === 0 && bytes[2] === 1 && bytes[3] === 0) {
    const count = Math.min(view.getUint16(4, true), Math.floor((bytes.length - 6) / 16));
    const sides = Array.from({ length: count }, (_, i) => bytes[6 + i * 16] || 256);
    return count ? { width: Math.max(...sides), height: Math.max(...sides) } : null;
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let at = 2; at + 9 < bytes.length && bytes[at] === 0xff; at += 2 + view.getUint16(at + 2)) {
      const marker = bytes[at + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { width: view.getUint16(at + 7), height: view.getUint16(at + 5) };
    }
  }
  return null;
};
// A logo drawn only in light fills disappears on the white background Google may show it on.
// Shapes with no fill of their own and no fill on an svg or g ancestor draw in black.
const lightOnly = (svg) => {
  const inherits = /<(svg|g)\b[^>]*\bfill\s*=/i.test(svg);
  const bare = /<(path|rect|circle|ellipse|polygon|polyline|text)\b(?![^>]*\bfill\s*[=:])[^>]*>/i.test(svg);
  if (bare && !inherits) return false;
  const colors = [
    ...svg.matchAll(/(?:fill|stroke|stop-color)\s*[=:]\s*["']?\s*(#[\da-f]{3,8}|rgba?\([^)]*\)|[a-z]+)/gi),
  ]
    .map(([, color]) => color.toLowerCase())
    .filter((color) => color !== "none" && color !== "transparent");
  const luminance = (color) => {
    if (color === "white") return 1;
    if (color.startsWith("#")) {
      const hex = color.length < 6 ? [...color.slice(1, 4)].map((c) => c + c).join("") : color.slice(1, 7);
      color = `rgb(${[0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))})`;
    }
    const rgb = color.match(/[\d.]+%?/g)?.slice(0, 3).map((v) => (v.endsWith("%") ? parseFloat(v) * 2.55 : Number(v)));
    return rgb?.length === 3 ? (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 : 0;
  };
  return colors.length > 0 && colors.every((color) => luminance(color) > 0.85);
};
const downloadAsset = async (url) => {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": AGENTS.browser },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const type = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
    const xRobotsTag = response.headers.get("x-robots-tag") ?? "";
    const length = Number(response.headers.get("content-length"));
    // Browsers sniff favicons, so a generic binary type still counts when the header is an image.
    const problem = !response.ok
      ? `returned ${response.status}`
      : !type.startsWith("image/") && type !== "application/octet-stream"
        ? `is ${type || "untyped"}, not an image`
        : null;
    if (problem || length >= 5 * KB * KB) {
      await response.body?.cancel();
      return problem ? { problem, url: url.href } : { bytes: length, size: null, type, url: url.href, xRobotsTag };
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const svg = type === "image/svg+xml" ? new TextDecoder().decode(bytes) : null;
    const size = svg ? null : imageSize(bytes);
    if (type === "application/octet-stream" && !size) return { problem: "is not an image", url: url.href };
    return { bytes: bytes.length, size, svg, type, url: url.href, xRobotsTag };
  } catch (error) {
    return { unchecked: error.cause?.code ?? error.cause?.message ?? error.message, url: url.href };
  }
};
const probe = async (url, redirect = "manual") => {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": AGENTS.browser },
      redirect,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    await response.body?.cancel();
    return { location: response.headers.get("location"), status: response.status };
  } catch (error) {
    return { unchecked: error.cause?.code ?? error.cause?.message ?? error.message };
  }
};
const probeChain = async (startUrl, probeMemo, maxHops = 5) => {
  const hops = [];
  let current = new URL(startUrl);
  while (true) {
    const res = await probeMemo(current);
    if (res.unchecked) return { hops, unchecked: res.unchecked, finalUrl: current.href };
    if (res.status < 300 || res.status > 399 || !res.location) {
      return { hops, status: res.status, finalUrl: current.href, location: hops.at(-1)?.location ?? null };
    }
    const nextUrl = URL.parse(res.location, current);
    hops.push({ url: current.href, status: res.status, location: nextUrl?.href ?? res.location });
    if (!nextUrl) return { hops, status: res.status, location: res.location, finalUrl: current.href };
    current = nextUrl;
    if (hops.length > maxHops) {
      return { hops, status: res.status, location: nextUrl.href, finalUrl: nextUrl.href, tooMany: true };
    }
  }
};
const probeUnknown = async (url) => {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": AGENTS.browser },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ct = response.headers.get("content-type") ?? "";
    let canonical = null;
    if (/html/i.test(ct) && response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      let total = 0;
      while (total < 64 * KB) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.byteLength;
      }
      await reader.cancel().catch(() => {});
      const text = Buffer.concat(chunks).toString("utf8").slice(0, 64 * KB);
      for (const match of text.matchAll(/<link\b([^>]*)>/gi)) {
        const attrs = attributesOf(match[1]);
        if ((attrs.rel ?? "").toLowerCase().split(/\s+/).includes("canonical") && attrs.href) {
          canonical = attrs.href;
          break;
        }
      }
    } else {
      await response.body?.cancel();
    }
    return { status: response.status, url: response.url, canonical };
  } catch (error) {
    return { unchecked: error.cause?.code ?? error.cause?.message ?? error.message };
  }
};
const checkRedirectChain = (label, chain, expectedPage, warnings) => {
  if (!chain) return;
  if (chain.unchecked) {
    warnings.push(
      UNREACHABLE.test(chain.unchecked)
        ? `${label} doesn't answer (${chain.unchecked}), so visitors who type it get an error. Redirect it to ${expectedPage.origin} with a 301.`
        : `${label} could not be checked (${chain.unchecked}).`
    );
    return;
  }
  if (!chain.hops.length) {
    warnings.push(`${label} returns ${chain.status} instead of a permanent redirect to ${expectedPage.origin}.`);
    return;
  }
  if (chain.tooMany || chain.hops.length > 1) {
    warnings.push(`${label} takes ${chain.hops.length} redirects before reaching ${chain.finalUrl}. Collapse to a single 301 or 308 redirect.`);
    return;
  }
  if (![301, 308].includes(chain.hops[0].status)) {
    warnings.push(`${label} uses ${chain.hops[0].status} instead of a permanent 301 or 308 redirect.`);
  }
  const landing = URL.parse(chain.finalUrl);
  if (!landing || landing.origin !== expectedPage.origin || landing.pathname !== expectedPage.pathname || landing.search !== expectedPage.search) {
    warnings.push(`${label} redirects to ${chain.finalUrl}, not to ${expectedPage.origin}${expectedPage.pathname}${expectedPage.search}.`);
  }
};

// Site checks run once with the browser user agent, against the page the browser reached.
const checkSite = async ({ site, url }) => {
  // Each asset URL is downloaded once per run, however many tags point at it.
  const assets = new Map();
  const fetchAsset = (href, base) => {
    const url = href ? URL.parse(href, base) : null;
    if (!url) return { url: href ?? null, problem: href ? "is not a valid URL" : "has no href" };
    if (!assets.has(url.href)) assets.set(url.href, downloadAsset(url));
    return assets.get(url.href);
  };

  const errors = [];
  const warnings = [];
  const page = new URL(url);
  const host = page.hostname;
  const twin = host.startsWith("www.")
    ? host.slice(4)
    : host.split(".").length === 2
      ? `www.${host}`
      : null;
  const twinUrl = twin && Object.assign(new URL(page), { hostname: twin });
  const httpUrl = page.protocol === "https:" ? Object.assign(new URL(page), { protocol: "http:" }) : null;
  const probes = new Map();
  const probeMemo = (targetUrl) => {
    const key = targetUrl.href;
    if (!probes.has(key)) probes.set(key, probe(targetUrl, "manual"));
    return probes.get(key);
  };
  const touchLinked = site.icons.some((icon) => icon.rel.includes("apple-touch-icon"));
  const [shares, logo, icons, rootTouchIcon, unknown, twinHop, httpHop] = await Promise.all([
    Promise.all(site.shareImages.map(async ([label, href]) => ({ ...(await fetchAsset(href, page)), label }))),
    site.organization?.logo ? fetchAsset(site.organization.logo, page) : null,
    Promise.all(site.icons.map(async (icon) => ({ ...(await fetchAsset(icon.href, page)), rel: icon.rel }))),
    touchLinked ? null : fetchAsset("/apple-touch-icon.png", page),
    probeUnknown(new URL(`/check-head-${crypto.randomUUID().slice(0, 8)}`, page)),
    twinUrl ? probeChain(twinUrl, probeMemo) : null,
    httpUrl ? probeChain(httpUrl, probeMemo) : null,
  ]);
  const side = ({ size }) => Math.min(size.width, size.height);
  // A declared asset that answers with an error is broken metadata. A failed connection is only unchecked.
  const broken = (label, asset) => {
    if (asset.problem) errors.push(`${label}${asset.url ? ` ${asset.url}` : ""} ${asset.problem}.`);
    else if (asset.unchecked) warnings.push(`${label} ${asset.url} could not be checked (${asset.unchecked}).`);
    return asset.problem || asset.unchecked;
  };

  for (const image of shares) {
    const { label } = image;
    if (broken(label, image)) continue;
    const imageUrl = URL.parse(image.url);
    if (
      imageUrl?.origin === page.origin &&
      isGeneratedImageRoute(imageUrl) &&
      !hasNoindexHeader(image.xRobotsTag)
    ) {
      warnings.push(
        `${label} ${image.url} is a generated route with no X-Robots-Tag: noindex, so Search Console may report it as crawled but not indexed.`
      );
    }
    if (image.svg) {
      errors.push(`${label} is SVG, which X, Meta and Discord don't render. Use PNG or JPEG.`);
      continue;
    }
    if (!SHARE_FORMATS.test(image.type))
      warnings.push(`${label} is ${image.type}. Meta documents only JPEG, PNG and GIF share images.`);
    if (image.bytes >= 5 * KB * KB)
      errors.push(`${label} is ${(image.bytes / KB / KB).toFixed(1)} MB. LinkedIn and X reject images of 5 MB or more.`);
    else if (label === "og:image" && image.bytes > 600 * KB)
      warnings.push(`${label} is ${Math.round(image.bytes / KB)} KB. WhatsApp falls back to a small preview above 600 KB.`);
    if (!image.size) continue;
    const { width, height } = image.size;
    if (side(image) < 200) errors.push(`${label} is ${width}x${height}, under Meta's 200x200 minimum.`);
    else if (width < 1200 || height < 630)
      warnings.push(`${label} is ${width}x${height}. Meta recommends at least 1200x630 for sharp cards.`);
    if (label === "og:image" && (width / height < 1.7 || width / height > 2.1))
      warnings.push(`og:image is ${(width / height).toFixed(2)}:1. Meta and LinkedIn crop to about 1.91:1.`);
  }
  const share = shares.find((image) => image.label === "og:image" && image.size);
  const meta = site.shareImageMeta;
  if (site.shareImages.length && (!meta.width || !meta.height))
    warnings.push("og:image has no og:image:width and og:image:height, so Meta and Discord download it before rendering.");
  else if (share && (meta.width !== share.size.width || meta.height !== share.size.height))
    warnings.push(
      `og:image:width and og:image:height say ${meta.width}x${meta.height}, but the file is ${share.size.width}x${share.size.height}.`
    );
  if (site.shareImages.length && !meta.alt)
    warnings.push("og:image has no og:image:alt, which the Open Graph protocol asks for.");

  const validIcons = icons.filter((icon) => !broken(`The ${icon.rel} link`, icon));
  const faviconLinks = validIcons.filter((icon) => !icon.rel.includes("apple-touch-icon"));
  const faviconRaster = faviconLinks.filter((icon) => icon.size);
  const largestFavicon = Math.max(0, ...faviconRaster.map(side));
  if (!site.icons.some((icon) => !icon.rel.includes("apple-touch-icon")))
    warnings.push("The page links no favicon icon, so Google has no favicon to show beside the result.");
  else if (!faviconRaster.length && faviconLinks.some((icon) => icon.svg))
    warnings.push("Every linked icon is SVG, which Google Search doesn't list as a favicon format. Add a PNG or ICO.");
  else if (faviconRaster.length && largestFavicon <= 48)
    warnings.push(`The largest raster favicon is ${largestFavicon}px. Google recommends a favicon larger than 48x48.`);

  // iOS picks the largest apple-touch-icon it is offered, and looks for /apple-touch-icon.png when none is linked.
  const touch = touchLinked
    ? validIcons.filter((icon) => icon.rel.includes("apple-touch-icon") && icon.size).sort((a, b) => side(b) - side(a))[0]
    : rootTouchIcon;
  if (!touchLinked && (rootTouchIcon.problem || rootTouchIcon.unchecked))
    warnings.push(`No apple-touch-icon link, and ${rootTouchIcon.url}, which iOS looks for instead, ${rootTouchIcon.problem ?? "could not be checked"}.`);
  else if (touch?.size && (touch.size.width !== touch.size.height || side(touch) < 108))
    warnings.push(
      `The apple-touch-icon is ${touch.size.width}x${touch.size.height}. Apple asks for a square icon of at least 108px for Messages previews.`
    );

  if (site.organization) {
    if (!logo) warnings.push("The Organization JSON-LD has no logo for Google to show.");
    else if (broken("The Organization logo", logo));
    else if (!GOOGLE_IMAGE_FORMATS.test(logo.type))
      warnings.push(`The Organization logo is ${logo.type}, which Google Images doesn't support.`);
    else if (logo.svg && lightOnly(logo.svg))
      warnings.push(
        "The Organization logo is drawn only in light colors, so it vanishes on the white background Google may show it on."
      );
    else if (logo.size && side(logo) < 112)
      warnings.push(`The Organization logo is ${logo.size.width}x${logo.size.height}. Google needs at least 112x112.`);
    if (!site.organization.url)
      warnings.push("The Organization JSON-LD has no url, which Google uses to identify the organization.");
    if (!site.organization.sameAs.length)
      warnings.push("The Organization JSON-LD has no sameAs, so Google can't tie the brand to its official profiles.");
  }

  if (site.profile) {
    if (!site.profile.named)
      warnings.push("The ProfilePage JSON-LD has no mainEntity with a name or alternateName, which Google requires.");
    if (site.profile.missingDates.length)
      warnings.push(`The ProfilePage JSON-LD has no ${site.profile.missingDates.join(" or ")}, which Google recommends.`);
    if (site.profile.invalidDates.length)
      warnings.push(`The ProfilePage JSON-LD has invalid ${site.profile.invalidDates.join(" or ")}. Google expects an ISO 8601 date and time.`);
  }

  if (site.bytes.head > 300 * KB)
    warnings.push(`The head ends ${Math.round(site.bytes.head / KB)} KB into the HTML. WhatsApp reads preview tags only in the first 300 KB.`);
  if (site.bytes.html > KB * KB)
    warnings.push(`The HTML is ${(site.bytes.html / KB / KB).toFixed(1)} MB. Apple Messages previews stop reading at 1 MB.`);
  if (unknown.status >= 200 && unknown.status < 300)
    warnings.push(`An unknown URL returns ${unknown.status}, a possible soft 404. Check that unknown paths return 404 or 410.`);
  if (unknown.canonical) {
    const unknownCanonical = URL.parse(unknown.canonical, unknown.url);
    if (unknownCanonical && unknownCanonical.origin === page.origin && (unknownCanonical.pathname === page.pathname || unknownCanonical.pathname === "/")) {
      warnings.push(`An unknown URL declares canonical ${unknownCanonical.href}, which can confuse crawlers on error pages.`);
    }
  }
  checkRedirectChain(twin, twinHop, page, warnings);
  checkRedirectChain(httpUrl?.href, httpHop, page, warnings);
  if (site.emailObfuscated)
    warnings.push('Cloudflare Email Obfuscation rewrote email addresses, so crawlers that skip JavaScript see "[email protected]".');

  const summary = (asset) => ({ size: asset.size ?? null, type: asset.type ?? null, url: asset.url });
  return {
    agent: "site",
    errors,
    warnings,
    shareImages: shares.map((image) => ({ bytes: image.bytes ?? null, label: image.label, xRobotsTag: image.xRobotsTag ?? "", ...summary(image) })),
    logo: logo && summary(logo),
    icons: [...icons, ...(rootTouchIcon ? [{ ...rootTouchIcon, rel: "apple-touch-icon (root)" }] : [])].map(
      (icon) => ({ rel: icon.rel, ...summary(icon) })
    ),
    unknownUrlStatus: unknown.status ?? null,
    twin: twin && { host: twin, location: twinHop.hops[0]?.location ?? null, status: twinHop.hops[0]?.status ?? twinHop.status ?? null },
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

export async function checkHead(target) {
  const pending = Object.entries(AGENTS).map((agent) => inspect(agent, target));
  const [inspected, site] = await Promise.all([
    Promise.all(pending),
    pending[0].then((browser) => (browser.site ? checkSite(browser) : null)),
  ]);
  const reports = inspected.map(({ site, ...report }) => report);
  return { agents: reports, site, url: target, valid: ![...reports, site].some((report) => report?.errors.length) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const target = args.find((arg) => arg !== "--json");
  if (args.length !== (json ? 2 : 1) || !ABSOLUTE_URL.test(target ?? "") || !URL.canParse(target)) {
    console.error("Usage: node scripts/check_head.mjs <url> [--json]");
    process.exit(2);
  }

  const result = await checkHead(target);
  const { agents: reports, site } = result;
  const failing = [...reports, site].filter((report) => report?.errors.length).map(({ agent }) => agent);
  if (json) console.log(JSON.stringify(result, null, 2));
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
    if (site) {
      console.log(`site: ${reports[0].url}`);
      const size = (asset) => (asset.size ? `${asset.size.width}x${asset.size.height}` : (asset.type ?? "broken"));
      const twin = site.twin && `${site.twin.host} ${site.twin.status ?? "unreachable"}`;
      for (const [label, value] of [
        ...site.shareImages.map((image) => [image.label, `${size(image)}, ${Math.round(image.bytes / KB)} KB`]),
        ["logo", site.logo ? `${size(site.logo)}, ${site.logo.url}` : "none"],
        ["icons", site.icons.map((icon) => `${icon.rel} ${size(icon)}`).join(", ") || "none"],
        ["unknown url", site.unknownUrlStatus ?? "no response"],
        ["twin host", twin ? `${twin}${site.twin.location ? ` -> ${site.twin.location}` : ""}` : "n/a"],
      ])
        console.log(`  ${label.padEnd(14)}${value}`);
      for (const message of site.errors) console.log(`  error: ${message}`);
      for (const message of site.warnings) console.log(`  warning: ${message}`);
      console.log();
    }
    console.log(failing.length ? `Errors for ${failing.join(", ")}.` : "No errors.");
  }
  process.exitCode = failing.length ? 1 : 0;
}
