# Zero-cost public demo

The public demo deliberately runs without the backend or a Firebase session. The complete signed-in workspace remains in this branch, but is not available in a demo build. Do not describe this release as a hosted vector-search/RAG deployment.

## Verify

Run `npm run check` and `npm run test:demo`. The latter builds with `.env.demo`, starts a static preview and tests the fictional role → inspect source → review → download journey. It checks the downloaded text, approval reset on role change, mobile overflow, old hash routes and absence of fetch/XHR requests. An independent CI job repeats this check.

## Publish to the existing project

Use project `prj_yj89Sz6VC69ydHrhch0LSIOMR4KV` in team `adity982s-projects`. Verify the source revision and existing public deployment before releasing.

```text
vercel deploy --project prj_yj89Sz6VC69ydHrhch0LSIOMR4KV --scope adity982s-projects --prod --skip-domain --build-env VITE_DEMO_MODE=true --meta releaseMode=demo --meta releaseSha=EXACT_COMMIT --yes
```

The build override is public configuration, not a secret. It applies to this deployment; it does not change the project's saved production environment or its Git production branch. Confirm the build is ready, then use `vercel promote DEPLOYMENT_URL --scope adity982s-projects` to release the tested production build. Verify `https://resume-automator-frontend.vercel.app/` shows the demo label and no sign-in button. Retain the actual previous deployment ID for rollback. Automatic deployments from `main` can replace this manually promoted build; publish future changes with the same deliberate release procedure until this branch is merged and production configuration is reconciled.

Do not change the existing free Render service, provision paid resources or discard old records to publish this static demo. A future full-workspace release requires a separate durable database/worker setup, data preservation decision, migration/restore checks and authenticated end-to-end validation. Removing the demo flag without those steps produces an incompatible app.
