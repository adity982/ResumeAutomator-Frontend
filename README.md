# Resume Automator

Evidence-first resume tailoring for people who want stronger applications without inventing credentials.

[Live app](https://resume-automator-frontend.vercel.app) · [Backend API](https://github.com/adity982/ResumeAutomator-Backend) · [Roadmap](./ROADMAP.md) · [Market feature plan](./MARKET_FEATURE_PLAN.md)

![Resume Automator hero](./src/assets/hero.png)

## Why this project exists

Most resume tools optimize for keyword stuffing, black-box scoring, or disposable one-off drafts. Resume Automator takes the opposite position:

- analyze the evidence already present in a resume
- show why a recommendation exists
- keep AI-generated edits reviewable
- avoid fabricated ATS dimensions or unsupported claims
- connect tailoring work to the rest of the application workflow

## What it does

Resume Automator combines the main job-search workflows in one interface:

- Evidence workbench for resume upload, job description input, analysis, and fact-locked tailoring
- Career evidence vault for reusable verified achievements, stories, and skill evidence
- Job library with normalized saved targets instead of disposable one-time scrape results
- Application board with stage tracking, reminders, and package readiness
- Interview coach with saved sessions, prep briefs, and answer feedback
- Outreach studio with role-specific outreach variants based on verified evidence
- Discovery panel for preference-based role suggestions
- Analytics dashboard for stage conversion and reproducible analysis history

## Product principles

- Evidence first: every recommendation should map back to resume text or job-description evidence
- Privacy by default: uploaded PDFs are parsed in memory and not retained by the API
- Human approval required: generated edits remain drafts until the user accepts them
- Reproducibility over hype: the UI displays backend-provided metrics and stable analysis history

## Stack

- React 19
- TypeScript
- Vite
- TanStack Query
- Firebase authentication
- Recharts

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Start the backend with `APP_ENV=development` and `AUTH_MODE=development`.
4. Run `npm run dev`.

When Firebase variables are absent, local development can use `VITE_DEV_AUTH_TOKEN`. Production never enables that fallback.

## Quality checks

Run the full validation suite with:

```bash
npm run check
```

That command runs linting, type-checking, tests, and a production build.

## Repository map

- [`src/components/Workbench.tsx`](./src/components/Workbench.tsx): upload, analysis, tailoring, exports
- [`src/components/EvidenceVault.tsx`](./src/components/EvidenceVault.tsx): verified evidence management
- [`src/components/ApplicationBoard.tsx`](./src/components/ApplicationBoard.tsx): application tracking and follow-up planner
- [`src/components/InterviewCoach.tsx`](./src/components/InterviewCoach.tsx): interview practice sessions
- [`src/components/AnalyticsDashboard.tsx`](./src/components/AnalyticsDashboard.tsx): funnel metrics and reproducible analysis history

## Related repository

The FastAPI backend lives in [`adity982/ResumeAutomator-Backend`](https://github.com/adity982/ResumeAutomator-Backend) and handles authentication, ownership enforcement, analysis contracts, document workflows, and persistence.
