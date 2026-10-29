# Resume Automator

A career workspace for developers who want to choose relevant projects and prepare applications backed by their actual work.

[Live app](https://resume-automator-frontend.vercel.app) · [Backend](https://github.com/adity982/ResumeAutomator-Backend) · [Pilot guide](docs/PILOT.md)

The live URL is a deployment entry point, not proof that the latest branch has been deployed. Release commits and validation must be checked before announcing new capabilities.

## One connected application

- **Jobs:** save a target and open its preparation, project selection, document versions, application timeline, contacts and interview practice.
- **My evidence:** preview selected public GitHub files, explain your role, review source excerpts and confirm reusable contribution statements.
- **Activity:** record application stages, follow-ups and pilot feedback; inspect defined analytics and search suggestions.
- **Settings:** export account data, forget workspace progress, sign out or delete application records.

The sample workspace is available before sign-in and uses clearly labeled fictional data. Real application work stays in the signed-in account. Use Save progress to recover a draft after reload; conflicting saves from another tab are rejected rather than silently overwritten.

## Source-backed project selection

For a saved job, the backend compares requirements with reviewed repository evidence, chooses complementary projects within a slot limit, and returns source links with commit/file/line provenance. Proposed bullets reproduce the user's reviewed contribution statements. Missing evidence stays visible. Observing code does not establish authorship, and confirmation is a user attestation rather than independent verification.

Preview generates the actual PDF used for export. Approval is invalidated when document content, template, job or evidence selection changes. Saved documents are immutable versions in a persistent family. Cover letters can also be reviewed, saved and attached to an application.

## Honest boundaries

- Resume coverage and interview checklists are not calibrated ATS or hiring predictions.
- Search suggestions link to providers; they do not claim to be verified vacancies.
- LinkedIn contacts and hiring signals are recorded manually. Messages are editable drafts for the user to copy and send. The app does not scrape profiles or send connection requests/messages.
- Public imports work without a connection. Optional GitHub App authorization supports selected private repositories when the operator configures it; live consent must be tested before launch.
- Learned embeddings require the backend FastEmbed configuration; lexical mode is disclosed when active.

## Development

React 19, TypeScript, Vite, TanStack Query, Firebase and Tailwind. Keep the existing backend running and copy `.env.example` to `.env.local` with its actual API base URL.

```text
npm ci
npm run dev
npm run check
```

When Firebase is absent, the local development build uses an explicit development identity. Production builds never enable that fallback. The backend must also be in development mode for local testing.

`npm run check` runs lint, type checking, component tests and a production build. `npm run test:e2e` runs the application journey against the sibling backend checkout. That journey uses a dedicated local test database and synthetic evidence. Set `E2E_PYTHON` to the backend virtual-environment Python when needed; install the Playwright Chromium runtime for standalone CLI use.

The cross-repository journey workflow uses the matching backend feature branch if present, otherwise backend main. Merge/deploy the backend contract before the dependent frontend. The PostgreSQL/pgvector runtime and deployment instructions live in the backend operations guide.

## Privacy

PDF bytes are parsed without persistent upload storage; saved document text and source excerpts remain in the account until deleted. Resume drafts are not stored in browser local storage. Settings explains provider usage, export, deletion and the distinction between deleting application records and deleting a Google/Firebase identity.

## Pilot

Use [the observation and launch guide](docs/PILOT.md) with five to ten consenting developers. The software supports recording feedback; this repository does not claim a pilot has already happened, nor does it fabricate user counts, time savings or hiring results.


Launch artifacts: [demo, post and case study](docs/LAUNCH-KIT.md), [pilot protocol](docs/PILOT-STUDY.md), and [LinkedIn access dossier](docs/LINKEDIN-INTEGRATION.md).
