# AI Memory Lifeboat v0.11.1 — IME and keyboard continuity

- Preserve input-method composition: Enter while choosing characters no longer starts an in-conversation search or message-number jump. Committed Enter and native action buttons still work.
- Keep Up/Down/Home/End conversation-list focus visible within the current bounded page, without changing selection or automatically paging.
- When reaching the first or last reading window disables the focused paging button, continue focus at the first retained message in that window instead of losing it to the page body.
- Add repeatable real-Chrome synthetic regression on PR and main. The standalone file is opened through file:// at desktop and mobile viewport sizes; missing browsers and failing cases fail the job.
- Verify source replacement, query resets, cross-window hits, private HTML consent and the actual synthetic download content, including replacement archives sharing the same conversation ID.

The offline HTML remains self-contained. Node 22/CDP tooling is for development and CI only; it is not part of the application runtime. All existing parser, schema, size, consent and conservative comparison boundaries remain in force.

CI uses generated fixtures and emulated mobile dimensions. It is not a real-user input-method or screen-reader certification, does not prove a complete account backup, and supplies no independent adoption or application-approval evidence. Keep the original provider export.
