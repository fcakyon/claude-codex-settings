import type { APIRoute } from "astro";
import { site } from "../lib/content";

export const prerender = true;

export const GET: APIRoute = () => new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${site.url}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
