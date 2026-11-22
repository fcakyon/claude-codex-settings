import { makeFinding } from "./common.mjs";

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

async function fetchBounded(url, options = {}, timeoutMs = 10_000) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

function readSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieSummary(rawCookie) {
  const parts = rawCookie.split(";").map((s) => s.trim()).filter(Boolean);
  const name = parts[0]?.split("=")[0]?.trim() || "cookie";
  const attrs = new Set(parts.slice(1).map((p) => p.toLowerCase()));
  const sameSite = parts.slice(1).find((p) => /^samesite=/i.test(p))?.split("=")[1]?.toLowerCase() || "";
  return {
    name,
    secure: attrs.has("secure"),
    httpOnly: attrs.has("httponly"),
    sameSite,
  };
}

/** Audit HTTPS transport, OWASP response headers, cookies, CORS, banners, and sensitive paths. */
export async function auditUrl(rawUrl) {
  const findings = [];
  const parsed = new URL(rawUrl);
  const loopback = isLoopbackHost(parsed.hostname);
  const isHttps = parsed.protocol === "https:";

  if (!isHttps && !loopback) {
    findings.push(
      makeFinding("http-scheme", "http", "FAIL", "high", "Public endpoint is not HTTPS", `URL ${parsed.origin} must use https://.`),
    );
  } else {
    findings.push(
      makeFinding("http-scheme", "http", "PASS", "none", "HTTPS scheme", `Target uses ${parsed.protocol}//${parsed.host}.`),
    );
  }

  if (isHttps && !loopback) {
    const httpUrl = new URL(parsed.href);
    httpUrl.protocol = "http:";
    try {
      const httpRes = await fetchBounded(httpUrl.href, { method: "GET", redirect: "manual" }, 6_000);
      await httpRes.body?.cancel();
      const loc = httpRes.headers.get("location") || "";
      if ([301, 302, 307, 308].includes(httpRes.status) && loc.toLowerCase().startsWith("https://")) {
        findings.push(
          makeFinding(
            "http-redirect",
            "http",
            "PASS",
            "none",
            "HTTP redirects to HTTPS",
            `http://${parsed.host} responded ${httpRes.status} -> ${loc}.`,
          ),
        );
      } else if (httpRes.status >= 200 && httpRes.status < 300) {
        findings.push(
          makeFinding(
            "http-redirect",
            "http",
            "FAIL",
            "high",
            "Plaintext HTTP serves content directly",
            `http://${parsed.host} returned HTTP ${httpRes.status} instead of redirecting to HTTPS.`,
          ),
        );
      } else {
        findings.push(
          makeFinding(
            "http-redirect",
            "http",
            "WARN",
            "low",
            "Non-redirecting HTTP response",
            `http://${parsed.host} returned ${httpRes.status} (location: ${loc || "none"}).`,
          ),
        );
      }
    } catch {
      findings.push(
        makeFinding(
          "http-redirect",
          "http",
          "WARN",
          "low",
          "Plaintext HTTP port unreachable",
          `Could not connect to http://${parsed.host} (port 80 closed or blocked).`,
        ),
      );
    }
  }

  let res;
  try {
    res = await fetchBounded(parsed.href, { method: "GET", redirect: "follow" });
  } catch (err) {
    findings.push(
      makeFinding("url-reachable", "http", "FAIL", "high", "Target URL unreachable", `${parsed.href}: ${err.message}`),
    );
    return findings;
  }
  const finalUrl = res.url || parsed.href;
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  await res.body?.cancel();

  const hsts = res.headers.get("strict-transport-security") || "";
  if (finalUrl.startsWith("https://")) {
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;
    if (maxAge >= 15552000) {
      findings.push(makeFinding("hsts", "http", "PASS", "none", "HSTS enabled", hsts));
    } else {
      findings.push(
        makeFinding(
          "hsts",
          "http",
          "FAIL",
          "high",
          "Missing or short Strict-Transport-Security",
          hsts ? `Observed "${hsts}" (< 180 days).` : "Strict-Transport-Security header absent on HTTPS response.",
        ),
      );
    }
  }

  const csp = res.headers.get("content-security-policy") || "";
  if (csp) {
    const hasObjectNone = /object-src\s+'none'/i.test(csp);
    findings.push(
      makeFinding(
        "csp",
        "http",
        hasObjectNone ? "PASS" : "WARN",
        hasObjectNone ? "none" : "low",
        hasObjectNone ? "Content-Security-Policy present" : "Content-Security-Policy omits object-src 'none'",
        csp,
      ),
    );
  } else if (contentType.includes("text/html")) {
    findings.push(
      makeFinding("csp", "http", "FAIL", "medium", "Missing Content-Security-Policy", "HTML response omits Content-Security-Policy."),
    );
  }

  const xfo = (res.headers.get("x-frame-options") || "").toUpperCase();
  const hasFrameAncestors = /frame-ancestors\s+[^;]+/i.test(csp);
  if (xfo === "DENY" || xfo === "SAMEORIGIN" || hasFrameAncestors) {
    findings.push(
      makeFinding(
        "clickjacking",
        "http",
        "PASS",
        "none",
        "Clickjacking protection present",
        `X-Frame-Options=${xfo || "(none)"}, CSP frame-ancestors=${hasFrameAncestors ? "yes" : "no"}.`,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        "clickjacking",
        "http",
        "FAIL",
        "medium",
        "Missing clickjacking header",
        "Neither X-Frame-Options (DENY/SAMEORIGIN) nor CSP frame-ancestors is present.",
      ),
    );
  }

  const nosniff = (res.headers.get("x-content-type-options") || "").trim().toLowerCase();
  findings.push(
    nosniff === "nosniff"
      ? makeFinding("nosniff", "http", "PASS", "none", "X-Content-Type-Options: nosniff", "nosniff set.")
      : makeFinding("nosniff", "http", "FAIL", "medium", "Missing X-Content-Type-Options: nosniff", `Observed "${nosniff || "none"}".`),
  );

  const referrer = (res.headers.get("referrer-policy") || "").toLowerCase();
  findings.push(
    referrer
      ? makeFinding("referrer-policy", "http", "PASS", "none", "Referrer-Policy set", referrer)
      : makeFinding("referrer-policy", "http", "FAIL", "medium", "Missing Referrer-Policy", "Referrer-Policy header is absent."),
  );

  const permissionsPolicy = res.headers.get("permissions-policy") || "";
  findings.push(
    permissionsPolicy
      ? makeFinding("permissions-policy", "http", "PASS", "none", "Permissions-Policy set", permissionsPolicy)
      : makeFinding("permissions-policy", "http", "WARN", "low", "Missing Permissions-Policy", "Permissions-Policy header is absent."),
  );

  const rawCookies = readSetCookies(res.headers).map(cookieSummary);
  if (rawCookies.length === 0) {
    findings.push(makeFinding("cookies", "http", "PASS", "none", "Cookie flags", "No Set-Cookie headers emitted on unauthenticated GET."));
  } else {
    const weak = rawCookies.filter(
      (c) => (finalUrl.startsWith("https://") && !c.secure) || !c.httpOnly || !["lax", "strict", "none"].includes(c.sameSite),
    );
    findings.push(
      weak.length === 0
        ? makeFinding("cookies", "http", "PASS", "none", "Cookie flags hardened", `Inspected ${rawCookies.length} cookie(s) without printing values.`)
        : makeFinding(
            "cookies",
            "http",
            "FAIL",
            "high",
            "Insecure Set-Cookie attributes",
            `Cookie(s) missing Secure/HttpOnly/SameSite: ${weak.map((c) => c.name).join(", ")}.`,
          ),
    );
  }

  try {
    const corsRes = await fetchBounded(parsed.href, {
      method: "GET",
      redirect: "follow",
      headers: { Origin: "https://untrusted.example.invalid" },
    });
    await corsRes.body?.cancel();
    const acao = corsRes.headers.get("access-control-allow-origin") || "";
    const acac = (corsRes.headers.get("access-control-allow-credentials") || "").toLowerCase();
    if (acao === "https://untrusted.example.invalid" || (acao === "*" && acac === "true")) {
      findings.push(
        makeFinding(
          "cors-policy",
          "http",
          "FAIL",
          "high",
          "Unsafe CORS policy",
          `Origin reflection or credentialed wildcard detected (Allow-Origin=${acao}, Allow-Credentials=${acac || "false"}).`,
        ),
      );
    } else {
      findings.push(
        makeFinding(
          "cors-policy",
          "http",
          "PASS",
          "none",
          "CORS does not reflect untrusted origins",
          acao ? `Allow-Origin=${acao}, Allow-Credentials=${acac || "false"}.` : "No Access-Control-Allow-Origin echoed.",
        ),
      );
    }
  } catch (err) {
    findings.push(makeFinding("cors-policy", "http", "WARN", "low", "CORS probe skipped", err.message));
  }

  const serverBanner = res.headers.get("server") || "";
  const poweredBy = res.headers.get("x-powered-by") || "";
  if (/\d+\.\d+/.test(serverBanner) || poweredBy) {
    findings.push(
      makeFinding(
        "server-banner",
        "http",
        "WARN",
        "low",
        "Detailed server banner exposed",
        `Server="${serverBanner || "none"}", X-Powered-By="${poweredBy || "none"}".`,
      ),
    );
  } else {
    findings.push(makeFinding("server-banner", "http", "PASS", "none", "No detailed version banner", serverBanner || "Server header clean."));
  }

  const probeSpecs = [
    { path: "/.env", bodyMatch: /^[A-Z0-9_]{2,}=/m },
    { path: "/.git/config", bodyMatch: /\[core\]/i },
    { path: "/pb_data/data.db", bodyMatch: /SQLite format 3/ },
    { path: "/server-status", bodyMatch: /Apache Server Status/i },
  ];
  const exposed = [];
  for (const probe of probeSpecs) {
    try {
      const pUrl = new URL(probe.path, parsed.origin);
      const pRes = await fetchBounded(pUrl.href, { method: "GET", redirect: "manual" }, 6_000);
      const pType = (pRes.headers.get("content-type") || "").toLowerCase();
      let bodyText = "";
      if (pRes.status === 200) {
        bodyText = (await pRes.text()).slice(0, 2048);
        const looksLikeHtmlSpa = pType.includes("text/html") && /^\s*<(?:!doctype|html)/i.test(bodyText);
        if (probe.bodyMatch.test(bodyText) || !looksLikeHtmlSpa) {
          exposed.push(`${probe.path} (${pRes.status}, ${pType || "unknown"})`);
        }
      } else {
        await pRes.body?.cancel();
      }
    } catch {
      // Unreachable probe is treated as non-exposed.
    }
  }
  findings.push(
    exposed.length === 0
      ? makeFinding("sensitive-paths", "http", "PASS", "none", "Sensitive paths isolated", "Probed /.env, /.git/config, /pb_data/data.db, /server-status.")
      : makeFinding("sensitive-paths", "http", "FAIL", "high", "Sensitive path exposure", `Exposed: ${exposed.join("; ")}`),
  );

  return findings;
}
