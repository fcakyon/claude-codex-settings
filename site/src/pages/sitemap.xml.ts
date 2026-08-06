import type { APIRoute } from "astro";
import { site } from "../lib/content";

export const prerender = true;

const languages = [
  ["en", `${site.url}/`],
  ["zh-CN", `${site.url}/zh-cn/`],
] as const;

const alternateLinks = languages
  .map(([language, url]) => `    <xhtml:link rel="alternate" hreflang="${language}" href="${url}"/>`)
  .join("\n");

export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
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
`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
