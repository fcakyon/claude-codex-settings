#!/usr/bin/env node

import { setDefaultResultOrder } from "node:dns";
import { readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

setDefaultResultOrder("ipv4first");

const MAX_JSON_LENGTH = 100_000;
const TIMEOUT_MS = 10_000;
const DATE_PROPERTIES = new Set([
  "dateCreated",
  "datePublished",
  "dateModified",
  "startDate",
  "endDate",
  "priceValidUntil",
  "validFrom",
  "validThrough",
]);
const URL_PROPERTIES = new Set(["url", "logo", "image", "item", "target", "sameAs", "license"]);
const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const ABSOLUTE_URL = /^https?:\/\//i;
const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)$/i;

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isLoopbackHost = (hostname) => LOOPBACK_HOST.test(hostname) || /\.local$/i.test(hostname);
const stringValues = (value) =>
  typeof value === "string" ? [value] : Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
const typesOf = (node) => stringValues(node["@type"]);
const isEmptyValue = (value) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

/**
 * Validate a parsed JSON-LD document against required/recommended field tables and value formats.
 */
export function validateDocument(document, { required = {}, recommended = {}, origin = null } = {}) {
  const errors = [];
  const warnings = [];
  const types = [];

  if (isObject(document) && !document["@context"]) {
    warnings.push('Top level is missing "@context": "https://schema.org".');
  }

  const seen = new WeakSet();
  let entityCount = 0;

  const walk = (value, { checkShape, topLevel }) => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, { checkShape, topLevel });
      return;
    }
    if (!isObject(value) || seen.has(value)) return;
    seen.add(value);

    const hasGraph = Array.isArray(value["@graph"]);
    if (hasGraph) walk(value["@graph"], { checkShape: true, topLevel: true });

    const nodeTypes = typesOf(value);
    if (nodeTypes.length === 0) {
      if (topLevel && !hasGraph) errors.push("An entity has no @type.");
    } else {
      entityCount++;
      types.push(...nodeTypes);
      if (checkShape) {
        for (const type of nodeTypes) {
          for (const [kind, table, target] of [["required", required, errors], ["recommended", recommended, warnings]]) {
            for (const property of table[type] ?? []) {
              if (isEmptyValue(value[property])) {
                target.push(`${type} is missing the ${kind} property "${property}".`);
              }
            }
          }
        }
      }
    }

    const label = nodeTypes[0] ?? "node";
    const isListItem = nodeTypes.includes("ListItem");
    for (const [key, fieldValue] of Object.entries(value)) {
      if (key === "@graph") continue;
      if (typeof fieldValue === "string" && DATE_PROPERTIES.has(key) && !ISO_8601.test(fieldValue)) {
        errors.push(`${label}.${key} is not an ISO 8601 date: "${fieldValue}".`);
      }
      if (URL_PROPERTIES.has(key)) {
        for (const candidate of stringValues(fieldValue)) {
          if (!ABSOLUTE_URL.test(candidate)) {
            errors.push(`${label}.${key} must be an absolute URL: "${candidate}".`);
            continue;
          }
          const parsed = URL.parse(candidate);
          if (parsed && isLoopbackHost(parsed.hostname) && (!origin || parsed.origin !== origin)) {
            const message = `${label}.${key} points to a local host: "${candidate}".`;
            if (origin) errors.push(message);
            else warnings.push(message);
          }
        }
      }
      const nextCheckShape =
        key === "itemListElement" ||
        ((key === "item" || key === "mainEntity") && isObject(fieldValue) && typesOf(fieldValue).length > 0 && (key === "mainEntity" || isListItem));
      walk(fieldValue, { checkShape: nextCheckShape, topLevel: false });
    }
  };

  walk(document, { checkShape: true, topLevel: true });

  if (entityCount === 0 && errors.length === 0) {
    errors.push("No JSON-LD entity found. Expected an object, an array, or an @graph.");
  }

  return { errors, types, valid: errors.length === 0, warnings };
}

async function loadTables() {
  const [requiredRaw, recommendedRaw] = await Promise.all([
    readFile(new URL("../references/required-properties.json", import.meta.url), "utf8"),
    readFile(new URL("../references/recommended-properties.json", import.meta.url), "utf8"),
  ]);
  return { required: JSON.parse(requiredRaw), recommended: JSON.parse(recommendedRaw) };
}

function extractJsonLdScripts(html) {
  const stripped = html.replace(/<!--[\s\S]*?-->/g, "");
  const blocks = [];
  for (const match of stripped.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = match[1];
    const typeMatch = attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const mime = (typeMatch?.[1] ?? typeMatch?.[2] ?? typeMatch?.[3] ?? "").split(";")[0].trim().toLowerCase();
    if (mime === "application/ld+json") {
      const content = match[2].trim();
      if (content) blocks.push(content);
    }
  }
  return blocks;
}

async function validateFromUrl(parsedUrl, tables) {
  const response = await fetch(parsedUrl.href, {
    headers: { accept: "text/html,application/xhtml+xml", "user-agent": "SEOAudit/1.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    await response.body?.cancel();
    return {
      url: response.url,
      blocks: 0,
      errors: [`HTTP ${response.status} fetching ${response.url}.`],
      types: [],
      valid: false,
      warnings: [],
    };
  }
  const html = await response.text();
  const rawBlocks = extractJsonLdScripts(html);

  if (rawBlocks.length === 0) {
    return {
      url: response.url,
      blocks: 0,
      errors: [],
      types: [],
      valid: true,
      warnings: ["No server-rendered JSON-LD blocks found. Check rendered DOM if injected client side."],
    };
  }

  const origin = new URL(response.url).origin;
  const errors = [];
  const warnings = [];
  const types = [];

  for (const [index, raw] of rawBlocks.entries()) {
    if (raw.length > MAX_JSON_LENGTH) {
      errors.push(`Block ${index + 1} exceeds ${MAX_JSON_LENGTH} characters.`);
      continue;
    }
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch (error) {
      errors.push(`Block ${index + 1} is not valid JSON: ${error.message}`);
      continue;
    }
    const blockResult = validateDocument(doc, { ...tables, origin });
    errors.push(...blockResult.errors);
    warnings.push(...blockResult.warnings);
    types.push(...blockResult.types);
  }

  return {
    url: response.url,
    blocks: rawBlocks.length,
    errors,
    types,
    valid: errors.length === 0,
    warnings,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  let result = { errors: [], types: [], valid: false, warnings: [] };
  const finish = (exitCode) => {
    result.valid = result.errors.length === 0;
    console.log(JSON.stringify(result, null, 2));
    process.exit(exitCode ?? (result.valid ? 0 : 1));
  };

  if (args.length === 2 && args[0] === "--url") {
    const parsedUrl = URL.parse(args[1]);
    if (!parsedUrl || !/^https?:$/i.test(parsedUrl.protocol)) {
      console.error("Usage: node scripts/validate_schema.mjs <jsonld-file|-|--url https://...>");
      process.exit(2);
    }
    try {
      const tables = await loadTables();
      result = await validateFromUrl(parsedUrl, tables);
      finish();
    } catch (error) {
      result.errors.push(error.message);
      finish(1);
    }
  } else if (args.length !== 1 || args[0].startsWith("--")) {
    console.error("Usage: node scripts/validate_schema.mjs <jsonld-file|-|--url https://...>");
    process.exit(2);
  } else {
    const inputPath = args[0];
    let jsonld;
    try {
      jsonld =
        inputPath === "-"
          ? await new Promise((resolve, reject) => {
              let data = "";
              process.stdin.setEncoding("utf8");
              process.stdin.on("data", (chunk) => {
                data += chunk;
              });
              process.stdin.on("end", () => resolve(data));
              process.stdin.on("error", reject);
            })
          : await readFile(inputPath, "utf8");
    } catch (error) {
      result.errors.push(`Could not read JSON-LD: ${error.message}`);
      finish();
    }

    if (jsonld.length === 0) {
      result.errors.push("JSON-LD input is empty.");
      finish();
    }
    if (jsonld.length > MAX_JSON_LENGTH) {
      result.errors.push(`JSON-LD exceeds ${MAX_JSON_LENGTH} characters.`);
      finish();
    }

    let document;
    try {
      document = JSON.parse(jsonld);
    } catch (error) {
      result.errors.push(`Not valid JSON: ${error.message}`);
      finish();
    }

    let tables;
    try {
      tables = await loadTables();
    } catch (error) {
      result.errors.push(`Could not read the property maps: ${error.message}`);
      finish();
    }

    result = validateDocument(document, tables);
    finish();
  }
}
