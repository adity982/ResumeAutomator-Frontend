# Resume Automator launch kit

Status: implementation preview; production rollout and participant study have not been completed. Use the preview wording until the release record proves otherwise.

## Ninety-second demo script

**0–10 seconds:** “A job description asks for a set of skills. My problem was choosing which of my projects actually demonstrates them, without inventing resume claims.” Show the saved job and its requirements.

**10–25 seconds:** Open My evidence. Show a repository snapshot and a contribution statement. “The source is pinned to a commit, file and line. Code is an observation; I separately confirm what I personally did.” Use your own public evidence or label the fictional sample visibly.

**25–45 seconds:** Choose projects. Show two complementary projects and open one citation. “The pipeline combines lexical and vector retrieval, checks explicit technology requirements, and chooses a small set that covers different needs.”

**45–55 seconds:** Show a missing requirement. “Missing evidence is a valid result. The app does not turn an unsupported requirement into an achievement.”

**55–75 seconds:** Add reviewed bullets, edit one, preview the actual PDF, approve and save the version. “Approval belongs to this exact document and its sources; an edit resets it.”

**75–90 seconds:** Attach the version, record Applied, save progress, reload and recover. “The result is a reusable application workflow. The benchmark evaluates retrieval on synthetic data; the upcoming pilot will test whether real people can complete this task.” End with repository and architecture links.

## LinkedIn preview announcement

I rebuilt Resume Automator around a question I kept running into: which of my projects actually supports the job I’m applying for?

The new workflow lets me import selected GitHub files, review my contribution, select projects against a saved job, and draft resume bullets with commit/file/line citations. I can inspect the actual PDF, save an approved version, attach it to an application and recover progress later.

The technical core uses BGE embeddings, pgvector, lexical retrieval and reciprocal rank fusion. I compared lexical, dense and hybrid retrieval on a 60-example synthetic evaluation set. On the held-out split, Recall@3 was 0.88 for lexical and 1.00 for both dense and hybrid. Dense ranked better than hybrid on nDCG in this fixture, so I’m not claiming hybrid always wins.

The part I care about most: missing evidence stays missing. Repository code also does not prove authorship, so contribution confirmation remains explicit.

This is an implementation preview. I’m looking for 5–10 developers with multiple projects and a real target job to try one complete application flow and tell me where it becomes confusing. I have not measured interview uplift or time savings yet.

Frontend: https://github.com/adity982/ResumeAutomator-Frontend
Backend: https://github.com/adity982/ResumeAutomator-Backend

## Technical case study

### Problem

The original product combined resume analysis, tailoring, outreach and interview tools, but users had to carry context between them. Keyword counts and precise-looking scores could imply more certainty than the underlying heuristics justified. Project claims did not carry stable source evidence.

### Design

A saved job is now the unit of work. Imported files are bounded, pinned to commits and chunked with source locations. A worker computes embeddings while preserving import state and retries. Users review contribution statements separately from repository observations. Retrieval is scoped to an authenticated account and combines exact technology gates, lexical and dense candidates, reciprocal rank fusion and complementary project selection. Selected statements are drafted extractively with citations; unsupported requirements abstain.

### Why these trade-offs

Exact vector search keeps the system inspectable for a small personal corpus; approximate indexing should follow corpus/load evidence. Hybrid search adds lexical precision but does not guarantee the best ranking on every dataset. An extractive draft keeps the claim boundary visible. Server-side versions and source invalidation matter because a polished PDF can otherwise preserve a claim whose supporting source was removed.

### Evaluation

The versioned fixture contains 60 synthetic examples, including missing-evidence and near-miss cases. The learned model is BAAI/bge-small-en-v1.5, producing normalized 384-dimensional embeddings. The recorded held-out Recall@3 is 0.88 lexical, 1.00 dense and 1.00 hybrid. The benchmark is small, synthetic and warm; it does not measure production database load, authorship, hiring outcomes or actual user relevance. Dataset, evaluation command and raw results are in the backend repository and handover artifacts.

### Reliability and privacy

The implementation includes tenant ownership checks, bounded imports/uploads, verified Firebase identity, shared request budgets, immutable document families, approval tied to document/evidence identity, account export/deletion and account-scoped recovery. Private GitHub access uses an optional GitHub App user flow with encrypted credentials and selected-repository permissions; live activation requires an operator registration and acceptance test. LinkedIn contacts and drafts remain manual. Infrastructure retention and backups require operator configuration.

### What is still being tested

Hosted checks validate backend/PostgreSQL behavior, frontend quality and a synthetic cross-repository browser journey. A real-user study must measure completion without assistance, source disagreements, required edits and repeat use. Production deployment, live OAuth consent, backup recovery and real-user feedback must be recorded separately from CI.

## Before publishing

Use your own approved evidence or a visibly fictional demo. Remove private repository names, emails, tokens and participant material from recordings. Include a missing-evidence case. Link the actual release record and benchmark. Replace preview wording only after the rollout is verified. Obtain separate explicit consent before publishing any participant quote, document, image or outcome.
