import { readFileSync } from "node:fs";
import type { APIRoute, GetStaticPaths } from "astro";
import { site } from "../lib/content";

export const prerender = true;

export const getStaticPaths = (() => ["favicon.ico", "apple-touch-icon.png"].map((icon) => ({ params: { icon } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => new Response(
  new Uint8Array(readFileSync(`public/${params.icon!.replace(".", `-${site.variant}.`)}`)),
);
