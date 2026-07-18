# Resume Automator

TypeScript React workspace for evidence-backed resume tailoring, multi-job
comparison, versioned exports, application tracking, interview practice,
outreach, personalized discovery, and career analytics.

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Start the backend with `APP_ENV=development` and `AUTH_MODE=development`.
4. Run `npm run dev`.

When Firebase variables are absent, Vite development uses the explicit local
development token from `VITE_DEV_AUTH_TOKEN`. Production never enables this
fallback and requires Firebase configuration.

## Quality checks

Run `npm run check` to lint, type-check, test, and build. Heavy chart and
workflow views are loaded on demand. The API base URL and Firebase public
configuration are environment-specific; no production endpoint or credential
is embedded in React components.

AI-assisted changes remain reviewable drafts. The frontend displays only
backend-provided score dimensions and never invents ATS metrics.
