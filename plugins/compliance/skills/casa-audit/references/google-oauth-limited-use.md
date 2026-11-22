# Google OAuth Verification & Limited Use Policy

When an app adds a Google **restricted scope** (for example `gmail.readonly`, `gmail.modify`, `drive.readonly`) or modifies consent branding/scopes on an already-verified OAuth client, Google triggers re-verification and annual CASA Tier 2 assessment.

## Safe Sequencing (Avoid Breaking Existing Verified Scopes)

1. **Keep restricted scopes off in production** (`FEATURE_FLAG=off`) while hardening the app and preparing CASA Tier 2, especially if the OAuth client already serves approved sensitive scopes (such as Calendar or Meet).
2. **Audit before Cloud Console edits**: editing Branding, Authorized Domains, or Data Access scopes on a verified Google Cloud project initiates a new review cycle.
3. **Prepare reviewer test access carefully**: maintain an isolated non-privileged test account or documented synthetic verification instructions and remove temporary reviewer allowlist entries after approval if they are not needed for the next review stage.

## Required Privacy Policy Disclosures (Checked via `--privacy-doc`)

1. **Google API Services User Data Policy**: Explicit statement that the app's use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including **Limited Use** requirements (and [Workspace API User Data Policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy) where Workspace scopes are used).
2. **No generalized AI/ML model training**: Clear statement that raw or derived Google user data is not used to develop, improve, or train generalized/shared AI or ML models.
3. **Transfer & human-access limits**: State which sub-processors receive data, why, and that humans only inspect data with explicit consent, for security/legal compliance, or aggregated/anonymized.
4. **Retention, disconnection, and deletion**: Document in-app disconnect, Google Account permissions revocation (`https://myaccount.google.com/permissions`), and full user data deletion.

## Verification Demo Video Checklist

- Show the exact `client_id` query parameter in the browser address bar during the Google OAuth consent screen.
- Show every requested scope on the consent screen matching the Cloud Console Data Access submission.
- Show the end-to-end user feature using the granted scope AND how the user revokes/disconnects access cleanly.
