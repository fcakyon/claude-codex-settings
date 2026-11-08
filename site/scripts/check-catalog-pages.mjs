import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "parse5";

if (process.env.SITE_VARIANT === "plugins") process.exit(0);

const siteRoot = resolve(import.meta.dirname, "..");
const root = resolve(siteRoot, "..");
const output = resolve(siteRoot, "dist");
const read = (path) => readFileSync(path, "utf8");
const nodes = (node) => [node, ...(node.childNodes || []).flatMap(nodes)];
const document = (path) => nodes(parse(read(resolve(output, path))));
const attr = (node, name) => node.attrs?.find((attribute) => attribute.name === name)?.value;
const text = (node) => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");
const meta = (page, name) => page.find((node) => node.tagName === "meta" && (attr(node, "name") || attr(node, "property")) === name);
const links = (page) => new Set(page.filter((node) => node.tagName === "a").map((node) => attr(node, "href")));
const hubs = { plugins: links(document("plugins/index.html")), skills: links(document("skills/index.html")) };
const sitemaps = { plugins: read(resolve(output, "sitemaps/plugins.xml")), skills: read(resolve(output, "sitemaps/skills.xml")) };
const siteUrl = new URL(attr(document("index.html").find((node) => attr(node, "rel") === "canonical"), "href"));
const catalog = JSON.parse(read(resolve(siteRoot, "src/lib/catalog-seo.json")));
const marketplace = JSON.parse(read(resolve(root, ".claude-plugin/marketplace.json")));
const sourceKeys = { plugins: [], skills: [] };
const titles = new Set();
const descriptions = new Set();

const checkPage = (path, name, group) => {
  const page = document(`${path.slice(1)}index.html`);
  const title = text(page.find((node) => node.tagName === "title"));
  const description = attr(meta(page, "description"), "content");
  const canonical = new URL(path, siteUrl).href;
  assert.ok(title.length >= 20 && title.length <= 70, `${path}: title must be 20–70 characters`);
  assert.ok(description?.length >= 90 && description.length <= 160, `${path}: description must be 90–160 characters`);
  assert.ok(!titles.has(title), `${path}: duplicate title`);
  assert.ok(!descriptions.has(description), `${path}: duplicate description`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(page.filter((node) => node.tagName === "h1").length, 1, `${path}: one main heading`);
  assert.equal(text(page.find((node) => node.tagName === "h1")), title, `${path}: heading matches title`);
  assert.equal(attr(page.find((node) => attr(node, "rel") === "canonical"), "href"), canonical);
  for (const name of ["og:title", "twitter:title"]) assert.equal(attr(meta(page, name), "content"), title);
  for (const name of ["og:description", "twitter:description"]) assert.equal(attr(meta(page, name), "content"), description);
  assert.ok(attr(meta(page, "robots"), "content")?.startsWith("index,follow"), `${path}: indexable`);
  const schema = page.filter((node) => node.tagName === "script" && attr(node, "type") === "application/ld+json")
    .flatMap((node) => JSON.parse(text(node))["@graph"] || []);
  assert.ok(schema.some((item) => item["@type"] === "BreadcrumbList"), `${path}: breadcrumbs`);
  assert.ok(schema.some((item) => item["@type"] === "SoftwareSourceCode" && item.name === name && item.description === description), `${path}: page schema`);
  assert.ok(hubs[group].has(path), `${path}: linked from hub`);
  assert.ok(sitemaps[group].includes(`<loc>${canonical}</loc>`), `${path}: listed in sitemap`);
  const tabs = page.filter((node) => attr(node, "role") === "tab");
  const panels = page.filter((node) => attr(node, "role") === "tabpanel");
  assert.ok(tabs.length > 0 && tabs.length === panels.length, `${path}: installation choices have matching panels`);
  assert.equal(tabs.filter((node) => attr(node, "aria-selected") === "true").length, 1, `${path}: one selected installation choice`);
  assert.equal(panels.filter((node) => attr(node, "hidden") === undefined).length, 1, `${path}: one visible installation panel`);
  for (const tab of tabs) assert.ok(panels.some((panel) => attr(panel, "id") === attr(tab, "aria-controls")), `${path}: installation panel exists`);
  const claudePanel = panels.find((node) => attr(node, "id") === "claude-code");
  assert.ok(text(claudePanel).includes(`claude plugin install ${path.split("/")[2]}@claude-settings`), `${path}: installer targets the parent plugin`);
  const badge = page.find((node) => attr(node, "class") === "download-count");
  assert.match(text(badge), /[\d,]+\s*downloads/, `${path}: GitHub download count`);
  return links(page);
};

for (const plugin of marketplace.plugins) {
  const path = `/plugins/${plugin.name}/`;
  const pluginLinks = checkPage(path, plugin.name, "plugins");
  sourceKeys.plugins.push(plugin.name);
  if (typeof plugin.source !== "string") continue;
  const pluginDirectory = resolve(root, plugin.source);
  const directory = resolve(pluginDirectory, "skills");
  const skillDirectories = readdirSync(pluginDirectory).includes("skills") ? readdirSync(directory, { withFileTypes: true }) : [];
  for (const entry of skillDirectories.filter((entry) => entry.isDirectory())) {
    if (!readdirSync(resolve(directory, entry.name)).includes("SKILL.md")) continue;
    const skillPath = `${path}skills/${entry.name}/`;
    const skillLinks = checkPage(skillPath, entry.name, "skills");
    const key = `${plugin.name}/${entry.name}`;
    assert.ok(pluginLinks.has(skillPath) && skillLinks.has(path), `${skillPath}: linked to and from parent plugin`);
    const related = catalog.skills[key].related;
    assert.ok(related.length > 0 && new Set(related).size === related.length, `${skillPath}: distinct related skills`);
    for (const target of related) {
      assert.ok(catalog.skills[target] && target !== key, `${skillPath}: valid related skill ${target}`);
      assert.ok(skillLinks.has(`/plugins/${target.replace("/", "/skills/")}/`), `${skillPath}: contextual link to ${target}`);
    }
    sourceKeys.skills.push(key);
  }
}
for (const group of ["plugins", "skills"]) {
  assert.deepEqual(Object.keys(catalog[group]).sort(), sourceKeys[group].sort(), `${group} metadata matches the source inventory`);
}
console.log(`Verified ${sourceKeys.plugins.length} plugin and ${sourceKeys.skills.length} skill pages: unique metadata, headings, social tags, canonical URLs, schema, contextual links and sitemaps.`);
