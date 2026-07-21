import type { APIRoute } from "astro";
import { site } from "../lib/content";

export const prerender = true;

export const GET: APIRoute = () => new Response(`User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
