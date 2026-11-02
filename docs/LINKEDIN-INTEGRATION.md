# LinkedIn integration boundary and access dossier

LinkedIn's Messages API is restricted to approved partners. Even approved apps must associate each send with a specific member action, allow review/editing of a prepared draft, require opt-in and send near the time of that action. A scheduled or autonomous send is not an eligible member action. General hiring-manager search and vacancy/team ownership are not established by the ordinary sign-in permissions.

The current product therefore stores user-entered contacts, source URLs and dated hiring signals, prepares editable drafts and tracks manually recorded outcomes. It does not scrape profiles or send messages through a logged-in browser. “Sent” means the user recorded that event, not a verified delivery receipt.

## Provider access application materials

Product: Resume Automator, a candidate-controlled application workspace.

Requested capability: member-initiated drafting and sending to an explicitly chosen contact, with an editable preview and a distinct affirmative Send action. No bulk send, scheduled send, automated connection requests or profile scraping. The user can stop follow-up and delete contacts/drafts.

Data: minimum approved recipient identifier, the member-approved message body and timestamps/status needed for that interaction. Repository excerpts and full resumes are not sent to LinkedIn automatically. Any attachment needs explicit selection and approval.

Controls to implement after approval: server-side OAuth with state/PKCE as supported by the approved product, encrypted expiring credentials, minimum granted permissions, recipient authorization checks, a content/version-bound send confirmation, idempotency against duplicate send requests, provider error handling and revocation/deletion. Configure only the endpoints and permissions in the actual partner agreement; do not invent OAuth scopes or a people-search endpoint.

Acceptance evidence: partner approval and enabled product/permissions, a test account and explicit recipient, a member-initiated successful send, denied duplicate/unapproved send, revoked-token handling, and verified deletion. The operator must supply the actual approved application before these can be implemented and validated against the provider.

Official references:
- https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
- https://learn.microsoft.com/en-us/linkedin/shared/integrations/communications/messages

Preparing this dossier does not submit an application or imply LinkedIn approval.
