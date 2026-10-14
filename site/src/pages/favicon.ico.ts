import { readFileSync } from "node:fs";
import type { APIRoute } from "astro";
import { site } from "../lib/content";

export const prerender = true;

export const GET: APIRoute = () => new Response(
  new Uint8Array(readFileSync(`public/favicon-${site.variant}.ico`)),
  { headers: { "Content-Type": "image/x-icon" } },
);
