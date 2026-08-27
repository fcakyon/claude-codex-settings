#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const MAX_JSON_LENGTH = 100_000;
const DATE_PROPERTIES = new Set([
  "datePublished",
  "dateModified",
  "startDate",
  "endDate",
  "priceValidUntil",
  "validFrom",
  "validThrough",
]);
const URL_PROPERTIES = new Set(["url", "logo", "image", "item", "target"]);
const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const ABSOLUTE_URL = /^https?:\/\//;

const inputPath = process.argv[2];
if (!inputPath || process.argv.length > 3) {
  console.error("Usage: node scripts/validate_schema.mjs <jsonld-file|->");
  process.exit(2);
}

const result = { errors: [], types: [], valid: false, warnings: [] };
const finish = (exitCode) => {
  result.valid = result.errors.length === 0;
  console.log(JSON.stringify(result, null, 2));
  process.exit(exitCode ?? (result.valid ? 0 : 1));
};

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

let required;
try {
  required = JSON.parse(
    await readFile(new URL("../references/required-properties.json", import.meta.url), "utf8")
  );
} catch (error) {
  result.errors.push(`Could not read the required-property map: ${error.message}`);
  finish();
}

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const objectNodes = (values) => values.filter(isObject);
const nodesOf = (value) => {
  if (Array.isArray(value)) return objectNodes(value);
  if (!isObject(value)) return [];
  return Array.isArray(value["@graph"]) ? objectNodes(value["@graph"]) : [value];
};
const typesOf = (node) => {
  const type = node["@type"];
  if (typeof type === "string") return [type];
  return Array.isArray(type) ? type.filter((value) => typeof value === "string") : [];
};

const nodes = nodesOf(document);
if (nodes.length === 0) {
  result.errors.push("No JSON-LD entity found. Expected an object, an array, or an @graph.");
}
if (isObject(document) && !document["@context"]) {
  result.warnings.push('Top level is missing "@context": "https://schema.org".');
}

for (const node of nodes) {
  const types = typesOf(node);
  if (types.length === 0) result.errors.push("An entity has no @type.");
  result.types.push(...types);

  for (const type of types) {
    for (const property of required[type] ?? []) {
      if (node[property] === undefined || node[property] === null) {
        result.errors.push(`${type} is missing the required property "${property}".`);
      }
    }
  }

  const label = types[0] ?? "node";
  for (const [key, value] of Object.entries(node)) {
    if (typeof value !== "string") continue;
    if (DATE_PROPERTIES.has(key) && !ISO_8601.test(value)) {
      result.errors.push(`${label}.${key} is not an ISO 8601 date: "${value}".`);
    }
    if (URL_PROPERTIES.has(key) && !ABSOLUTE_URL.test(value)) {
      result.errors.push(`${label}.${key} must be an absolute URL: "${value}".`);
    }
  }
}

finish();
