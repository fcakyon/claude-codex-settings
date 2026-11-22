import fs from "node:fs";
import path from "node:path";
import { makeFinding } from "./common.mjs";

/** Audit a privacy policy Markdown/text file for Google Limited Use and deletion disclosures. */
export function auditPrivacyDoc(docPath, { repoDir = "" } = {}) {
  let resolved = docPath;
  if (!resolved && repoDir) {
    for (const candidate of ["docs/privacy.md", "docs/PRIVACY.md", "PRIVACY.md", "privacy.md"]) {
      const full = path.join(repoDir, candidate);
      if (fs.existsSync(full)) {
        resolved = full;
        break;
      }
    }
  }
  if (!resolved || !fs.existsSync(resolved)) {
    return [makeFinding("privacy-doc", "privacy", "FAIL", "medium", "Privacy policy document not found", resolved || "Provide --privacy-doc <path>.")];
  }

  const text = fs.readFileSync(resolved, "utf8");
  const checks = [
    {
      id: "privacy-limited-use",
      ok: /limited use/i.test(text) && /google api services user data policy|workspace api/i.test(text),
      title: "Google API Limited Use disclosure",
      pass: "States adherence to Google API Services User Data Policy / Limited Use.",
      fail: "Missing explicit Google API Services User Data Policy Limited Use statement.",
    },
    {
      id: "privacy-no-ai-training",
      ok: /(?:does not|never|not use)[^.\n]*(?:train|develop|improve)[^.\n]*(?:ai|ml|model)/i.test(text),
      title: "Workspace no-AI-training disclosure",
      pass: "Prohibits training shared/generalized AI/ML models on Google user data.",
      fail: "Missing explicit statement against training generalized AI/ML models on Google data.",
    },
    {
      id: "privacy-human-access",
      ok: /(?:human|people do not read|(?:transfer|disclos|share)[^.\n]{0,80}(?:third|provider|sub-?processor|consent|law|security)|comply with.*law|explicit.*consent)/i.test(text),
      title: "Transfer and human-access limitations",
      pass: "Documents limited human-access and third-party transfer boundaries.",
      fail: "Missing transfer / human-access restriction disclosure.",
    },
    {
      id: "privacy-revoke-delete",
      ok: /revoke/i.test(text) && /delet/i.test(text),
      title: "Revocation and data deletion instructions",
      pass: "Explains token revocation and account/data deletion.",
      fail: "Missing user revocation and/or data deletion instructions.",
    },
  ];
  return checks.map((c) =>
    makeFinding(c.id, "privacy", c.ok ? "PASS" : "FAIL", c.ok ? "none" : "medium", c.title, c.ok ? c.pass : c.fail),
  );
}
