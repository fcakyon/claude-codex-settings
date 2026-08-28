import type { APIRoute } from "astro";
import { site, sitemapGroups } from "../lib/content";
import { locales } from "../lib/i18n";

export const prerender = true;

const languages = Object.entries(locales).map(([language, data]) => [language, `${site.url}${data.path}`]);

const alternateLinks = languages
  .map(([language, url]) => `    <xhtml:link rel="alternate" hreflang="${language}" href="${url}"/>`)
  .join("\n");

const homepageSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${languages
  .map(
    ([, url]) => `  <url>
    <loc>${url}</loc>
${alternateLinks}
    <xhtml:link rel="alternate" hreflang="x-default" href="${site.url}/"/>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapGroups.map((group) => `  <sitemap><loc>${site.url}/sitemaps/${group}.xml</loc></sitemap>`).join("\n")}
</sitemapindex>
`;

export const GET: APIRoute = () =>
  new Response(site.variant === "settings" ? sitemapIndex : homepageSitemap, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
