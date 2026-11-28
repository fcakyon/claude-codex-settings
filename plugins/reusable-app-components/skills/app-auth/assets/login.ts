export type LoginProfile = { email: string; method: string };
export type OAuthErrorReason = "expired" | "cancelled" | "failed";

const CANCELLED_ERRORS = new Set([
  "access_denied",
  "cancel",
  "cancelled",
  "canceled",
  "user_cancelled",
  "user_canceled",
  "oauth_cancelled",
  "oauth_canceled",
]);

const EXPIRED_ERRORS = new Set([
  "expired",
  "oauth_expired",
  "state_expired",
  "expired_state",
  "session_expired",
  "missing_state",
  "state_missing",
  "invalid_state",
]);

function parseUrl(value: string, base?: string): URL | null {
  try {
    return base ? new URL(value, base) : new URL(value);
  } catch {
    return null;
  }
}

function sanitizeReturnTo(value: string | null | undefined, allowedOrigin?: string): string | null {
  if (!value || /[\u0000-\u001f\u007f\\]/.test(value)) return null;
  if (value.trim() !== value || /^\/[\\/]|^\/\/|^\/%(?:2f|5c)/i.test(value)) return null;
  const allowed = allowedOrigin ? parseUrl(allowedOrigin) : null;
  if (allowedOrigin && (!allowed || !/^https?:$/i.test(allowed.protocol))) return null;
  const isRelative = value.startsWith("/");
  if (!isRelative && !allowed) return null;
  const expectedOrigin = allowed?.origin ?? "https://app.invalid";
  const parsed = isRelative ? parseUrl(value, expectedOrigin) : parseUrl(value);
  if (!parsed || parsed.origin !== expectedOrigin || parsed.username || parsed.password) return null;
  if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//") || /%5c/i.test(parsed.pathname)) {
    return null;
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function socialLoginUrl(endpoint: string, returnTo: string, email?: string) {
  return `${endpoint}?${new URLSearchParams({ returnTo, ...(email ? { login_hint: email } : { prompt: "select_account" }) })}`;
}

export function lastLogin(storage: Storage, key: string) {
  return {
    read(): LoginProfile | null {
      const email = storage.getItem(`${key}.email`);
      const method = storage.getItem(`${key}.method`);
      return email && method ? { email, method } : null;
    },
    save(profile: LoginProfile | null) {
      if (profile) {
        storage.setItem(`${key}.email`, profile.email);
        storage.setItem(`${key}.method`, profile.method);
      } else {
        storage.removeItem(`${key}.email`);
        storage.removeItem(`${key}.method`);
      }
    },
  };
}

export function pendingReturnTo(storage: Storage, key: string, allowedOrigin?: string) {
  return {
    read(): string | null {
      return sanitizeReturnTo(storage.getItem(key), allowedOrigin);
    },
    save(returnTo: string | null) {
      const safe = sanitizeReturnTo(returnTo, allowedOrigin);
      if (safe) storage.setItem(key, safe);
      else storage.removeItem(key);
    },
    consume(): string | null {
      const value = sanitizeReturnTo(storage.getItem(key), allowedOrigin);
      storage.removeItem(key);
      return value;
    },
  };
}

export function oauthErrorReason(
  search: string | URLSearchParams,
  paramNames: readonly string[] = ["error", "oauth_error", "auth_error", "google_error"],
): OAuthErrorReason | null {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  let raw = "";
  for (const name of paramNames) {
    const candidate = params.get(name)?.trim();
    if (candidate) {
      raw = candidate.toLowerCase();
      break;
    }
  }
  if (!raw) return null;
  if (CANCELLED_ERRORS.has(raw)) return "cancelled";
  if (EXPIRED_ERRORS.has(raw)) return "expired";
  return "failed";
}
