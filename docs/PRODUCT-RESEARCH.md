# Product direction grounded in actual application work

Research and implementation: 28 October 2026.

## Decision

Target developers with several projects or open-source contributions who need to select defensible evidence for a real job. The product promise is **reuse your best work, see what changed, and know what to do next**. Resume tailoring, a tracker and AI writing are established categories. This research does not establish a market-first feature or guarantee recognition. The proposed advantage is the coherent job → repository evidence → reviewed claim → document version → application trail, supported by an inspectable retrieval evaluation.

## What was examined

This was a focused desk study of official product documentation and public first-person discussions, followed by inspection of this repository's actual implementation. Competitor capabilities below are documented claims, not hands-on verification of paid accounts. Public discussion is self-selected, anecdotal and may include promotion; it does not establish prevalence, willingness to pay or causal hiring benefit. Promotional tool-list posts were not used as evidence of demand. No interviews, private messages or surveys were conducted.

| Source | Observed signal | Implication for this product |
| --- | --- | --- |
| [Huntr: base and tailored resumes](https://help.huntr.co/en/articles/12824077-understanding-huntr-s-resume-builder) | Its documented workflow starts from reusable base resumes and selects relevant content for targets. | Reuse is a baseline usability expectation; asking for a fresh upload every time adds avoidable work. |
| [Simplify: auto-tailoring](https://help.simplify.jobs/en/help/articles/0515607-tailor-your-resume-with-copilot) | Its documentation preserves the original and separates tailored versions, with user review. | Preserve source versions and make changes inspectable. A generated result alone is not enough. |
| [Simplify: Copilot applications](https://help.simplify.jobs/help/articles/2415391-using-copilot-to-autofill-applications) | Its workflow connects profile information, repeated answers and application tracking. | Convenience at the handoffs matters. Building a full browser autofill system would be a substantial separate scope rather than a quick differentiator. |
| [Teal: job application tracking](https://help.tealhq.com/en/articles/14435727-how-to-track-your-job-applications) | It documents keeping the sent resume, posting, contacts and follow-up dates with each application. | Make the next task and the exact application package easy to find. Do not copy its unsupported response-rate claims into our own product. |
| [First-person discussion: repeated tailoring fatigue](https://www.reddit.com/r/jobs/comments/1wy5757/im_sick_and_tired_of_tailoring_my_resume_to_every/) | The author describes repeated rewriting as exhausting; commenters describe using a few role variants and selecting relevant achievements. | Test whether safe reuse reduces repeated work. This is directional feedback, not a measured benefit. |
| [First-person discussion: document overload](https://www.reddit.com/r/recruitinghell/comments/1w2oqxg/job_hunting_is_so_stressful/) | The author describes many tailored resumes scattered across devices and frustration with application effort. | Keep immutable versions attached to job context and reduce re-entry. This account does not prove the proposed changes solve the problem. |

## Before: concrete gaps in this implementation

The app already had job snapshots, a document library, reviewed source evidence, application history and follow-up task APIs. However, editing a document returned the user to its original target; there was no explicit way to reuse it as a fresh draft for another job. The PDF approval view did not summarize textual changes. Follow-ups lived in Activity, while the job-specific tracker offered no way to schedule the next one. Jobs did not surface actionable saved work on return.

## Delivery plan and implemented behavior

| Order | User need | Implemented change | Acceptance evidence |
| --- | --- | --- | --- |
| 1 | Avoid rewriting the same material. | A saved-job workspace can copy the latest saved resume in a document family as a fresh starting draft. The server checks both job/document ownership and current source hashes. Approval and family identity do not carry over. The old document remains unchanged. The UI asks before replacing a nonempty workspace draft and discards late responses whose input context changed. | Backend tests cover cross-account denial, stale-source rejection, manual resumes, wrong document kind and preservation of the original. Component test covers latest-family selection, identity reset and input guards. The browser journey saves a first package and reuses it for a second target that requires approval again. |
| 2 | Inspect changes before trusting/exporting them. | The resume preview shows added/changed and removed/replaced lines against its starting text. New numeric details and unfinished placeholders are highlighted for human review. | Unit tests cover repeated lines, moved/whitespace-only lines, unchanged dates, new dates/percentages and placeholders. Existing preview/approval regression tests continue to apply. |
| 3 | Return to an obvious next step. | Jobs displays a server-generated queue: upcoming/overdue saved-application deadlines, due follow-up tasks, changed source evidence, incomplete packages and failed imports. Tracking an application now supports local-time reminder scheduling and manual completion. | Backend tests cover ordering, user isolation, completed/closed/archived exclusions, stale evidence, failed-import deduplication and pagination signaling. The browser journey schedules a reminder and finds it from Jobs. |

These changes require no new database migration. They use the existing durable models and source/version boundaries. Retrieval's algorithm and benchmark are unchanged by this slice; there is no reason to attribute a retrieval-quality improvement to UI changes.

## Limitations that the interface makes visible

- Copying a resume does not establish relevance or verify self-authored experience. Check company names, dates, skills and the target role. Only the previously cited project snapshots are checked automatically. An edited citation must be reviewed again before it can be saved as an approved source-backed statement.
- The change view compares trimmed, nonempty lines as multisets. Moved/whitespace-only lines are unchanged; a changed line appears as a removal and an addition. It is not a semantic diff, factual validator or ATS simulator. Existing inaccurate numbers might not be highlighted; new correct numbers might be highlighted. The full editor and actual PDF remain the review surfaces.
- The action queue has bounded coverage: up to 100 nearest deadline records, 100 due tasks, package/evidence checks on 100 recently updated active applications, and 20 recent failed imports. The queue displays eight actions by default and says when more collected actions remain. Its scope is available in the UI. It does not poll job boards or certify whether a posting is open.
- Reminders are in-app records. The app does not send email, LinkedIn messages, push notifications or applications. The user chooses when and whether outreach is appropriate.
- A green branch or preview is not a production rollout. The Render/database/worker release gates remain in the release guide.

## What to measure next

Observe five to ten consenting developers using one existing resume and two real targets. Define the tasks before running the study. Record unassisted completion, time to second approved package, factual edits after reuse, missed company/date mistakes, whether users can explain a source citation, and whether the next-action queue helps them locate a due task. Record abandonment and assistance rather than excluding them. Compare fresh-start and reuse tasks on comparable targets with order varied; report denominators and qualitative failures. Do not call a tiny pilot proof of interview uplift or market demand.

The next implementation decision should follow those observations. Candidate follow-ups are a structured achievement library, better claim-to-source editing and approved application-page capture. Browser extensions, email inbox ingestion, rerankers, broad people search and autonomous applying need separate evidence, permissions and maintenance plans. No additional feature is justified merely because it adds another AI label.

## How to explain the project publicly

“I built a developer application workspace where reusable resume drafts retain a traceable source history. I can inspect changes, check cited project evidence, approve an exact PDF version and find the next application task. The retrieval benchmark is synthetic; user time savings and hiring outcomes still need measurement.”

Use a real demonstration of your own public work, a missing-evidence case and an honest failure case. Describe the system as an evaluated engineering project and an early product hypothesis, not an unprecedented invention.
