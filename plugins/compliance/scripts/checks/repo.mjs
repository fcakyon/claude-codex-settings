import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { makeFinding } from "./common.mjs";

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", ".venv", "venv", "vendor", "artifacts", "analysis"]);
const CODE_EXTS = new Set([".go", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".rb", ".java", ".rs"]);
const SCAN_EXTS = new Set([...CODE_EXTS, ".json", ".yml", ".yaml", ".toml", ".env", ".sh", ".md", ".html"]);

const SECRET_PATTERNS = [
  { name: "private-key-pem", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: "aws-access-key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "google-api-key", regex: /\bAIzaSy[0-9A-Za-z_-]{33}\b/ },
  { name: "github-pat", regex: /\bghp_[0-9A-Za-z]{36}\b/ },
];

const PLACEHOLDER_RE = /^(?:changeme|example|placeholder|dummy|test|your[-_]|<|\$\{)/i;
const ENV_TEMPLATE_RE = /\.env\.(?:example|template|required|sample|dist)$/i;

function walkFiles(rootDir, { maxDepth = 5 } = {}) {
  const files = [];
  function visit(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full, depth + 1);
      else if (entry.isFile()) files.push(full);
    }
  }
  visit(rootDir, 0);
  return files;
}

function listRepoFiles(repoDir) {
  try {
    const out = execFileSync("git", ["-C", repoDir, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
    return { tracked: true, files: out.split("\0").filter(Boolean).map((rel) => path.join(repoDir, rel)) };
  } catch {
    return { tracked: false, files: walkFiles(repoDir, { maxDepth: 6 }) };
  }
}

function resolveGoBinary() {
  const candidates = ["go", path.join(process.env.HOME || "", ".local/go/bin/go"), "/usr/local/go/bin/go"];
  for (const bin of candidates) {
    if (!bin) continue;
    const res = spawnSync(bin, ["version"], { encoding: "utf8" });
    if (res.status === 0) return bin;
  }
  return "";
}

function resolveGovulncheck() {
  const candidates = [
    "govulncheck",
    path.join(process.env.HOME || "", "go/bin/govulncheck"),
    path.join(process.env.HOME || "", ".local/go/bin/govulncheck"),
  ];
  for (const bin of candidates) {
    if (!bin) continue;
    const res = spawnSync(bin, ["-version"], { encoding: "utf8" });
    if (res.status === 0) return { bin, argsPrefix: [] };
  }
  const goBin = resolveGoBinary();
  if (goBin) return { bin: goBin, argsPrefix: ["run", "golang.org/x/vuln/cmd/govulncheck@latest"] };
  return null;
}

function scanSecretsAndControls(absRepo, files, isTracked) {
  const findings = [];
  const gitignorePath = path.join(absRepo, ".gitignore");
  const gitignoreText = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  const ignoresEnv = /^\s*\.env\b/m.test(gitignoreText);
  const trackedEnvFiles = isTracked
    ? files
        .map((f) => path.relative(absRepo, f))
        .filter((rel) => /(?:^|\/)\.env(?:\.|$)/i.test(rel) && !ENV_TEMPLATE_RE.test(rel))
    : [];

  if (trackedEnvFiles.length > 0 || (!ignoresEnv && fs.existsSync(path.join(absRepo, ".env")))) {
    findings.push(
      makeFinding(
        "env-hygiene",
        "repo",
        "FAIL",
        "high",
        ".env tracking or ignore gap",
        trackedEnvFiles.length > 0 ? `Tracked .env file(s): ${trackedEnvFiles.join(", ")}` : ".env exists without .gitignore entry.",
      ),
    );
  } else {
    findings.push(
      makeFinding("env-hygiene", "repo", "PASS", "none", ".env ignored and untracked", ".gitignore covers .env and zero .env files are tracked."),
    );
  }

  const secretHits = [];
  const backendCode = [];
  const docOrCode = [];
  for (const file of files) {
    const rel = path.relative(absRepo, file);
    const ext = path.extname(file);
    if (!SCAN_EXTS.has(ext) || /(?:_test\.|\.test\.|tests\/|fixtures\/)/i.test(rel)) continue;
    let stat;
    let content;
    try {
      stat = fs.statSync(file);
      if (stat.size > 1_000_000) continue;
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      for (const pat of SECRET_PATTERNS) {
        if (pat.regex.test(lines[i])) secretHits.push(`${rel}:${i + 1} (${pat.name})`);
      }
    }
    if (stat.size <= 512_000) {
      if (CODE_EXTS.has(ext)) {
        backendCode.push({ rel, text: content });
        docOrCode.push({ rel, text: content });
      } else if (ext === ".md") {
        docOrCode.push({ rel, text: content });
      }
    }
  }
  findings.push(
    secretHits.length === 0
      ? makeFinding("secret-scan", "repo", "PASS", "none", "No plaintext credentials in tracked source", `Scanned ${files.length} repository file(s).`)
      : makeFinding("secret-scan", "repo", "FAIL", "high", "Potential hardcoded credential found", `Matches (values omitted): ${secretHits.slice(0, 10).join(", ")}`),
  );

  const cryptoEvidence = backendCode
    .filter((f) => /cipher\.NewGCM|aes-256-gcm|createCipheriv|Fernet|encrypted_token|OPENSCRIBE_TOKEN_ENCRYPTION_KEY|TOKEN_ENCRYPTION_KEY/i.test(f.text))
    .map((f) => f.rel);
  findings.push(
    cryptoEvidence.length > 0
      ? makeFinding("token-encryption", "repo", "PASS", "none", "OAuth token encryption at rest present", `Found authenticated encryption indicators in: ${cryptoEvidence.slice(0, 5).join(", ")}.`)
      : makeFinding("token-encryption", "repo", "WARN", "medium", "No OAuth token encryption indicators detected", "Could not detect AES-GCM/Fernet token encryption helper in backend source."),
  );

  const hasRevoke = docOrCode.some((f) => /\/oauth\/revoke|revokeToken|oauth2\.googleapis\.com\/revoke|DELETE.*\/(?:calendar|email|oauth)\//i.test(f.text));
  const hasDelete = docOrCode.some((f) => /DELETE .*\/|deleteAccount|account deletion|DeleteRecord/i.test(f.text));
  findings.push(
    hasRevoke && hasDelete
      ? makeFinding("revocation-and-deletion", "repo", "PASS", "none", "Token revocation and data deletion flows present", "Found OAuth/provider revocation and DELETE lifecycle handlers.")
      : makeFinding("revocation-and-deletion", "repo", "WARN", "medium", "Revocation or deletion routes unclear", `revoke=${hasRevoke}, delete=${hasDelete}`),
  );
  return findings;
}

function checkDockerfile(absRepo) {
  const dockerfile = path.join(absRepo, "Dockerfile");
  if (!fs.existsSync(dockerfile)) {
    return makeFinding("dockerfile-hardening", "repo", "SKIP", "none", "No Dockerfile at repository root", "Skipped container user check.");
  }
  const dfText = fs.readFileSync(dockerfile, "utf8");
  const stages = dfText.split(/^\s*FROM\s+/im);
  const finalStage = stages.at(-1) || dfText;
  const userMatch = [...finalStage.matchAll(/^\s*USER\s+([^\s#]+)/gm)].at(-1)?.[1] || "";
  const nonRoot = Boolean(userMatch) && userMatch !== "root" && userMatch !== "0";
  const envSecrets = [];
  for (const m of dfText.matchAll(/^\s*(?:ENV|ARG)\s+([A-Z0-9_]+)=(.+)$/gm)) {
    if (/(?:SECRET|PASSWORD|PRIVATE_KEY|API_KEY|TOKEN)$/i.test(m[1]) && !PLACEHOLDER_RE.test(m[2].trim().replace(/^["']|["']$/g, ""))) {
      envSecrets.push(m[1]);
    }
  }
  if (nonRoot && envSecrets.length === 0) {
    return makeFinding("dockerfile-hardening", "repo", "PASS", "none", "Dockerfile runs non-root without secret defaults", `Final USER=${userMatch}.`);
  }
  return makeFinding(
    "dockerfile-hardening",
    "repo",
    "FAIL",
    "medium",
    "Dockerfile hardening issue",
    `nonRoot=${nonRoot} (USER=${userMatch || "unset"}), hardcodedSecrets=${envSecrets.join(",") || "none"}.`,
  );
}

function scanDependencies(absRepo, files) {
  const findings = [];
  const goModDirs = [...new Set(files.filter((f) => path.basename(f) === "go.mod").map((f) => path.dirname(f)))];
  const lockDirs = [...new Set(files.filter((f) => path.basename(f) === "package-lock.json").map((f) => path.dirname(f)))];
  const pyManifests = files.filter((f) => /^(?:requirements.*\.txt|pyproject\.toml|uv\.lock)$/i.test(path.basename(f)));

  if (goModDirs.length > 0) {
    const govuln = resolveGovulncheck();
    if (!govuln) {
      findings.push(makeFinding("go-vulns", "deps", "WARN", "medium", "govulncheck unavailable", "Install golang.org/x/vuln/cmd/govulncheck to scan Go modules and stdlib."));
    } else {
      for (const dir of goModDirs) {
        const relDir = path.relative(absRepo, dir) || ".";
        const res = spawnSync(govuln.bin, [...govuln.argsPrefix, "./..."], {
          cwd: dir,
          encoding: "utf8",
          timeout: 120_000,
        });
        const output = `${res.stdout || ""}\n${res.stderr || ""}`;
        if (res.status === 0) {
          findings.push(makeFinding(`go-vulns:${relDir}`, "deps", "PASS", "none", `Go govulncheck clean (${relDir})`, "0 affected vulnerabilities found."));
        } else if (/Vulnerability #\d+:|Found in:|GO-\d{4}-\d+/.test(output)) {
          const ids = [...new Set(output.match(/GO-\d{4}-\d+/g) || [])];
          const fixed = [...output.matchAll(/Fixed in:\s*([^\n]+)/g)].map((m) => m[1].trim());
          findings.push(
            makeFinding(
              `go-vulns:${relDir}`,
              "deps",
              "FAIL",
              "high",
              `Go govulncheck reported affected vulnerabilities (${relDir})`,
              `${ids.join(", ") || "vuln"}${fixed.length ? ` (fixed in: ${[...new Set(fixed)].join(", ")})` : ""}`,
            ),
          );
        } else {
          findings.push(
            makeFinding(`go-vulns:${relDir}`, "deps", "WARN", "medium", `govulncheck errored (${relDir})`, output.trim().slice(-300) || `exit ${res.status}`),
          );
        }
      }
    }
  }

  for (const dir of lockDirs) {
    const relDir = path.relative(absRepo, dir) || ".";
    const res = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
      cwd: dir,
      encoding: "utf8",
      timeout: 90_000,
    });
    try {
      const raw = (res.stdout || "").trim();
      if (!raw) throw new Error(res.stderr || `empty stdout (exit ${res.status})`);
      const parsedAudit = JSON.parse(raw);
      const vulns = parsedAudit.metadata?.vulnerabilities;
      if (!vulns) throw new Error(parsedAudit.error?.summary || "missing audit metadata");
      const highCrit = (vulns.high || 0) + (vulns.critical || 0);
      const moderate = vulns.moderate || 0;
      if (highCrit > 0) {
        findings.push(makeFinding(`npm-audit:${relDir}`, "deps", "FAIL", "high", `npm production audit high/critical (${relDir})`, JSON.stringify(vulns)));
      } else if (moderate > 0) {
        findings.push(makeFinding(`npm-audit:${relDir}`, "deps", "FAIL", "medium", `npm production audit moderate (${relDir})`, JSON.stringify(vulns)));
      } else {
        findings.push(makeFinding(`npm-audit:${relDir}`, "deps", "PASS", "none", `npm production audit clean (${relDir})`, "0 vulnerabilities."));
      }
    } catch (err) {
      findings.push(
        makeFinding(`npm-audit:${relDir}`, "deps", "WARN", "low", `npm audit unavailable/offline (${relDir})`, String(err.message || res.stderr || `exit ${res.status}`).trim().slice(0, 200)),
      );
    }
  }

  if (pyManifests.length > 0) {
    const pipAudit = spawnSync("pip-audit", ["--version"], { encoding: "utf8" });
    findings.push(
      pipAudit.status === 0
        ? makeFinding("python-deps", "deps", "PASS", "none", "Python manifests present", `Found ${pyManifests.length} manifest(s); pip-audit installed.`)
        : makeFinding("python-deps", "deps", "WARN", "low", "Python manifests found without pip-audit", pyManifests.map((p) => path.relative(absRepo, p)).join(", ")),
    );
  }
  return findings;
}

/** Audit repository hygiene, credentials, cryptography indicators, Dockerfile, and vulnerabilities. */
export function auditRepo(repoDir, { skipVuln = false } = {}) {
  const absRepo = path.resolve(repoDir);
  if (!fs.existsSync(absRepo)) {
    return [makeFinding("repo-exists", "repo", "FAIL", "high", "Repository directory missing", absRepo)];
  }
  const { tracked, files } = listRepoFiles(absRepo);
  const findings = [
    ...scanSecretsAndControls(absRepo, files, tracked),
    checkDockerfile(absRepo),
  ];
  if (!skipVuln) findings.push(...scanDependencies(absRepo, files));
  return findings;
}
