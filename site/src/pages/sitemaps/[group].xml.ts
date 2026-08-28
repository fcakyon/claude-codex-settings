import type { APIRoute, GetStaticPaths } from "astro";
import { contentPages, site, sitemapGroups } from "../../lib/content";
import { locales } from "../../lib/i18n";

const groups = Object.fromEntries(
  sitemapGroups.map((group) => [
    group,
    group === "core"
      ? Object.values(locales).map(({ path }) => path)
      : contentPages.filter(({ sitemap }) => sitemap === group).map(({ path }) => `/${path}/`),
  ]),
);

export const getStaticPaths = (() =>
  site.variant === "settings"
    ? sitemapGroups.map((group) => ({
        params: { group },
        props: { paths: groups[group as keyof typeof groups] },
      }))
    : []) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(props.paths as string[]).map((path) => `  <url><loc>${site.url}${path}</loc></url>`).join("\n")}
</urlset>
`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
