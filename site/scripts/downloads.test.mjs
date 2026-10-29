import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { releaseDownloads } from "../src/lib/downloads.ts";

const asset = (name, count, release) => ({ name, download_count: count, browser_download_url: `https://github.com/example/repo/releases/download/${release}/${name}` });

test("Count every published release page without counting drafts or images", async () => {
  const fetch = mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("page=2")) return Response.json([
      { draft: false, assets: [asset("skill.zip", 20, "v1"), asset("other.zip", 7, "v1")] },
    ]);
    return Response.json([
      { draft: false, prerelease: true, assets: [asset("skill.zip", 3, "v3")] },
      { draft: false, assets: [asset("skill.zip", 12, "v2"), asset("screenshot.jpg", 999, "v2")] },
      { draft: true, assets: [asset("skill.zip", 999, "draft")] },
    ], { headers: { link: '<https://api.github.com/repos/example/repo/releases?page=2>; rel="next"' } });
  });
  try {
    const counts = await releaseDownloads("example/repo");
    assert.equal(counts.releaseCount, 3);
    assert.equal(counts.total, 42);
    assert.deepEqual(counts.assets, {
      "skill.zip": { count: 35, url: "https://github.com/example/repo/releases/download/v2/skill.zip" },
      "other.zip": { count: 7, url: "https://github.com/example/repo/releases/download/v1/other.zip" },
    });
    assert.ok(Number.isFinite(Date.parse(counts.updatedAt)));
  } finally {
    fetch.mock.restore();
  }
});

test("Fail a refresh when GitHub cannot supply release counts", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => new Response("", { status: 403 }));
  try {
    await assert.rejects(releaseDownloads("example/repo"), /HTTP 403/);
  } finally {
    fetch.mock.restore();
  }
});
