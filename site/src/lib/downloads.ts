interface ReleaseAsset {
  name: string;
  download_count: number;
  browser_download_url: string;
}

interface Release {
  draft: boolean;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

export async function releaseDownloads(repository: string) {
  const assets: Record<string, { count: number; url?: string }> = {};
  let releaseCount = 0;
  let url: string | undefined = `https://api.github.com/repos/${repository}/releases?per_page=100`;
  while (url) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });
    if (!response.ok) throw new Error(`GitHub release downloads: HTTP ${response.status}`);
    for (const release of (await response.json()) as Release[]) {
      if (release.draft) continue;
      releaseCount++;
      for (const asset of release.assets.filter((asset) => asset.name.endsWith(".zip"))) {
        assets[asset.name] = {
          count: (assets[asset.name]?.count || 0) + asset.download_count,
          url: assets[asset.name]?.url || (!release.prerelease ? asset.browser_download_url : undefined),
        };
      }
    }
    url = response.headers.get("link")?.match(/<([^>]+)>; rel="next"/)?.[1];
  }
  return {
    assets,
    releaseCount,
    total: Object.values(assets).reduce((sum, asset) => sum + asset.count, 0),
    updatedAt: new Date().toISOString(),
  };
}
