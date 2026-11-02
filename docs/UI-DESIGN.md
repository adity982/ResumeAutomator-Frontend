# Interface direction: 28 October 2026

## Reference and scope

The user requested a full interface redesign following [Wispr Flow](https://wisprflow.ai/). The live page and its published stylesheet were inspected. The useful reference characteristics are the warm ivory surface, Figtree body text, EB Garamond display text, restrained lavender actions with dark outlines, a compact framed header and spacious editorial hierarchy. Resume Automator keeps its own name, copy, mark and application workflows. No Wispr illustrations, wordmark, page copy or product claims are included.

This is an application interface rather than a dictation marketing page. Large serif text introduces a page; labels, inputs, task rows and dense data use the sans-serif face. The workspace adapts the reference's visual language to real editing and tracking tasks.

## Before and after

- The previous dark navy shell, bright cyan actions and heavy rounded cards gave almost every element equal emphasis. The new shell uses ivory, quiet borders, a smaller navigation frame and clear page introductions.
- Repeated bold labels now use medium-weight Figtree. EB Garamond, including its italic, provides display contrast without making form labels decorative. Fonts are bundled and self-hosted with Fontsource; the interface does not depend on a third-party font request.
- Jobs uses a list of saved targets alongside a muted next-action area. Narrow screens put next actions first. Descriptions explain user tasks rather than internal snapshot processing.
- The job workspace uses an underlined section navigation instead of filled button tabs. Resume comparison, review flags and exact-version approval remain visible and functional.
- Sample evidence and the proposed draft have distinct adjoining surfaces with a simple two-step sequence. Fictional data and review requirements remain explicit.
- Evidence imports, contribution review, saved documents, contacts/outreach, interview practice, settings, pipeline and analytics use the same shared panel, button, form and color rules. Pipeline columns now use light surfaces; chart colors are muted green and lavender.
- The old framework favicon is replaced by an original document-shaped letter mark. Informational, successful, failed, disabled and focus states remain distinct. Reduced-motion preferences are respected.

## Implementation

`src/index.css` owns the color/type tokens, shared components, page layouts and responsive rules. Semantic `ink` and `brand` utility families replace the old slate/cyan palette across product components. `Panel`, `Button` and `StatusMessage` provide the shared surfaces and states; `Brand`, `PageIntro` and `Welcome` provide the page framework. There are no page-specific copies of the design system or CSS overrides matching legacy utility class substrings.

The authenticated shell preserves all routes, account boundaries, recovery, source review, document versions and approval behavior. The signed-out welcome preserves Google sign-in and the sample. An unavailable sign-in configuration is shown in user-facing language and disables the unavailable sign-in controls; a normal sign-in failure remains retryable. The welcome's in-page link does not overwrite the workspace's hash route.

## Verification

Run `npm run check` for lint, TypeScript, all existing frontend tests and a production build. `npm run test:e2e` builds first, then starts the paired synthetic backend, the development workspace on port 5174 and the production-style signed-out preview on port 5175. No production data or deployment is modified by these tests.

The existing full application journey continues to check cited drafting, PDF review/approval, recovery, application tracking, reminders and reuse across targets. It now records desktop and mobile screenshots for project selection, documents, tracking, outreach, interview practice, evidence, activity and settings, with overflow checks on narrow screens. A separate welcome journey checks the signed-out experience and interactive sample. The CI artifact `journey-diagnostics` contains the captures for visual review. Passing functional checks alone does not establish visual quality; review those screenshots and record any repairs before delivery.
