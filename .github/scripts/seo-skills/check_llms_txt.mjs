#!/usr/bin/env node

const FETCH_TIMEOUT_MS = 10_000;
const MAX_LINKS = 50;
const LINK_CONCURRENCY = 4;
const LINK = String.raw`\[(?:[^\[\]\n]|\[[^\[\]\n]*\])+\]\(\s*((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\s*\)`;
const LIST_LINK = new RegExp(String.raw`^[-*+]\s+${LINK}`);
const FENCE = /^[ \t]*(`{3,}|~{3,})[\s\S]*?(?:^[ \t]*\1[`~]*[ \t]*$|(?![\s\S]))/gm;

const site = URL.parse(process.argv[2]);
if (process.argv.length !== 3 || !/^https?:$/.test(site?.protocol)) {
  console.error("Usage: node scripts/check_llms_txt.mjs <site-url|llms.txt-url>");
  process.exit(2);
}

const fileUrl = site.pathname.endsWith("/llms.txt") ? site : new URL("/llms.txt", site);
const result = { url: fileUrl.href, errors: [], warnings: [], valid: false };
// process.exit() can cut off piped stdout, so exit once the write lands, and never resolve so callers stop.
const finish = () =>
  new Promise(() => {
    result.valid = result.errors.length === 0;
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`, () => process.exit(result.valid ? 0 : 1));
  });
const at = (numbers) =>
  `line${numbers.length > 1 ? "s" : ""} ${numbers.slice(0, 5).join(", ")}${numbers.length > 5 ? ` and ${numbers.length - 5} more` : ""}`;

let response;
let text;
try {
  response = await fetch(fileUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  text = await response.text();
} catch (error) {
  result.errors.push(`Could not fetch the file: ${error.cause?.code ?? error.cause?.message ?? error.message}`);
  await finish();
}
Object.assign(result, {
  status: response.status,
  contentType: response.headers.get("content-type"),
  characters: text.length,
});
if (response.redirected) {
  result.redirectedTo = response.url;
  result.warnings.push("The file redirects. Serve it at its own URL.");
}
if (!response.ok) {
  result.errors.push(`HTTP ${response.status}`);
  await finish();
}
if (!/^text\/(plain|markdown)/i.test(result.contentType ?? "")) {
  result.warnings.push(`Served as ${result.contentType ?? "no Content-Type"}. Use text/plain or text/markdown.`);
}

// Blank code so its lines can't pass as headings, list items or links.
const body = text
  .replace(FENCE, (block) => block.replace(/[^\n]/g, ""))
  .replace(/`[^`\n]+`/g, (code) => "x".repeat(code.length));
const lines = body.split(/\r?\n/);
const levels = lines.map((line) => line.match(/^ {0,3}(#{1,6})(?:\s|$)/)?.[1].length ?? 0);
const h1 = levels.indexOf(1);
if (h1 === -1) result.errors.push('No H1 with the site name, such as "# Example".');
else if (h1 !== text.split(/\r?\n/).findIndex((line) => line.trim())) result.errors.push(`Text comes before the H1 on line ${h1 + 1}.`);
else if (!lines.slice(h1 + 1).find((line) => line.trim())?.trimStart().startsWith(">")) {
  result.warnings.push("No > summary follows the H1.");
}

const extraH1 = [];
const deepHeadings = [];
const notItems = [];
const noColon = [];
let inFileList = false;
lines.forEach((line, index) => {
  if (levels[index] === 1 && index !== h1) extraH1.push(index + 1);
  else if (levels[index] > 2) deepHeadings.push(index + 1);
  else if (levels[index] === 2) inFileList = true;
  // Indented lines that aren't list items continue the previous item's notes.
  else if (inFileList && line.trim() && !/^\s+(?![-*+]\s)/.test(line)) {
    const trimmed = line.trim();
    const item = trimmed.match(LIST_LINK);
    if (!item) notItems.push(index + 1);
    else if (!/^\s*(:|$)/.test(trimmed.slice(item[0].length))) noColon.push(index + 1);
  }
});
if (extraH1.length) result.warnings.push(`More than one H1: ${at(extraH1)}.`);
if (deepHeadings.length) result.warnings.push(`Headings below H2, which the spec doesn't use: ${at(deepHeadings)}.`);
if (notItems.length) result.errors.push(`Not a "- [name](url): notes" item under an H2: ${at(notItems)}.`);
if (noColon.length) result.warnings.push(`Notes don't follow a colon after the link: ${at(noColon)}.`);

// Same test as Lighthouse's /\[.+\]\(.+\)/, scanned per line because that regex backtracks badly on long lines.
const hasLink = text.split("\n").some((line) => {
  const close = line.indexOf("](", line.indexOf("[") + 2);
  return line.includes("[") && close >= 0 && line.lastIndexOf(")") >= close + 3;
});
if (!hasLink) result.errors.push("No [name](url) link, which Lighthouse requires.");
if (text.length < 50) result.errors.push("Under 50 characters, which Lighthouse flags as suspiciously short.");
const hrefs = Array.from(body.matchAll(new RegExp(LINK, "g")), (match) => match[1]);
const relative = hrefs.filter((href) => !URL.canParse(href));
if (relative.length) {
  result.warnings.push(
    `${relative.length} relative links, such as ${relative.slice(0, 3).join(", ")}. Use absolute URLs, as the spec's llms.txt examples do.`,
  );
}
const urls = [
  ...new Set(
    hrefs
      .map((href) => URL.parse(href, response.url))
      .filter((url) => /^https?:$/.test(url?.protocol))
      .map((url) => url.href.replace(/#.*/, "")),
  ),
];
result.links = urls.length;
if (urls.length > MAX_LINKS) result.warnings.push(`Checked the first ${MAX_LINKS} of ${urls.length} linked URLs.`);

const checkLink = async (href) => {
  try {
    const link = await fetch(href, { redirect: "manual", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    await link.body?.cancel();
    if ([401, 403, 429].includes(link.status)) return ["warnings", `${href}: HTTP ${link.status}, so check it in a browser.`];
    if (link.status >= 400) return ["errors", `${href}: HTTP ${link.status}`];
    if (link.status >= 300) return ["warnings", `${href} redirects to ${link.headers.get("location")}. Link the final URL.`];
  } catch (error) {
    return [error.name === "TimeoutError" ? "warnings" : "errors", `${href}: ${error.cause?.code ?? error.cause?.message ?? error.message}`];
  }
};
const pending = urls.slice(0, MAX_LINKS).entries();
const issues = [];
await Promise.all(
  Array.from({ length: LINK_CONCURRENCY }, async () => {
    for (const [index, href] of pending) issues[index] = await checkLink(href);
  }),
);
for (const [kind, message] of issues.filter(Boolean)) result[kind].push(message);
await finish();
