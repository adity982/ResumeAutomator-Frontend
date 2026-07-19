# Market-informed feature plan

Research completed on 19 July 2026 compared Resume Automator with Teal, Huntr,
Jobscan, OpenApply, JobSync, Job Trail, and recent job-seeker discussions.

## Signals used

- Teal and Huntr emphasize a connected tracker, job-specific documents,
  follow-ups, interview preparation, and reusable resume material.
- OpenApply highlights paste-a-link job capture, application-linked cover
  letters, and importable job-search data.
- JobSync and Job Trail make tasks, interview scheduling, and timely follow-up
  central to an open-source job-search workspace.
- User reviews repeatedly question opaque or inconsistent ATS scores and warn
  against AI-written claims that cannot be substantiated.

References:

- https://www.tealhq.com/tools/resume-builder
- https://help.huntr.co/en/articles/10477521-what-is-huntr
- https://www.jobscan.co/
- https://openapply.app/
- https://github.com/Gsync/jobsync
- https://jobtrail.dev/
- https://www.reddit.com/r/jobsearchhacks/comments/1li07kk/
- https://www.reddit.com/r/ResumeCoverLetterTips/comments/1rpzvxg/

## Selected top five

| Feature | User outcome | Delivery |
| --- | --- | --- |
| Career evidence vault | Reuse verified achievements, skills, projects, and stories without inventing facts | Dedicated vault with categories, sources, verification, tags, search, and tailoring integration |
| Follow-up planner | Avoid abandoned trackers and missed recruiter or interview follow-ups | Application-linked reminders with due dates, types, overdue state, completion, and deletion |
| Application-package readiness | Know whether the job snapshot, source, deadline, approved resume, and approved cover letter are ready | Server-calculated five-item checklist and readiness score on each application |
| Reproducible score history | Understand why repeated ATS tools disagree | Deterministic evidence fingerprint, documented weights and limitations, and persisted scan history |
| Role-specific interview brief | Prepare talking points, gaps, and questions before answering | Persisted preparation brief plus graceful recovery when a previously selected job was deleted |

## Release gates

1. Versioned database migration succeeds from the current production schema.
2. Ownership tests cover every new stored resource.
3. Backend tests and frontend lint, typecheck, tests, and build pass.
4. The authenticated flow is checked at desktop and mobile widths.
5. Production deployment happens only after both repository pull requests pass CI.
