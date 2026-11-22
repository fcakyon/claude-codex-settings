export const SEVERITY_RANK = { high: 3, medium: 2, low: 1, none: 0 };

/** Build a normalized compliance check finding object. */
export function makeFinding(id, category, status, severity, title, detail) {
  return { id, category, status, severity, title, detail };
}
