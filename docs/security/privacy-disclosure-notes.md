# Privacy Disclosure Notes

This file helps keep implementation and privacy-facing messaging aligned.

## Data Handling Summary

- local-first storage for settings and archive
- optional cloud mirroring to user-owned app-data folders
- caption/chat content sent to OpenAI for translation and summaries

## Alignment Checkpoints

When behavior changes in these areas, update privacy notes and public docs:

- capture scope
- external API destinations
- cloud-sync behavior
- retention/cleanup behavior

Related public-facing drafts:

- [privacy-policy.md](./privacy-policy.md)
- [terms-of-service.md](./terms-of-service.md)

Current release-surface integration:

- fixed public legal URLs are expected in store submission materials
- in-product footer links should open dedicated extension pages that render the same markdown sources published in the repository
- first-run Terms acceptance should happen on a dedicated Terms page and should keep both the Terms of Service and Privacy Policy accessible before acceptance
