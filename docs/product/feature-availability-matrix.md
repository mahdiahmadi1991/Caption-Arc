# Feature Availability Matrix

This matrix records current business-facing availability by browser and meeting scope.

## Browser Matrix

| Capability | Chrome | Firefox | Notes |
| --- | --- | --- | --- |
| Meeting capture and overlay runtime | Yes | Yes | Governed browser builds exist for both targets. |
| Translation (OpenAI-backed) | Yes | Yes | Requires valid OpenAI setup. |
| Live assistant guidance | Yes | Yes | Requires OpenAI setup and assistant-enabled profile. |
| Summary generation | Yes | Yes | Includes queue/retry handling in background layer. |
| Local history and session review | Yes | Yes | Local-first session storage model. |
| Encrypted backup export/import (`.mcbak`) | Yes | Yes | Passphrase-based encryption flow. |
| Google Drive app-data sync | Yes | No | Browser-gated until Firefox identity flow is verified. |
| OneDrive app-folder sync | Yes | No | Browser-gated until Firefox identity flow is verified. |

## Meeting Surface Matrix

| Surface | Provider Runtime | Caption Capture | Chat Capture Path |
| --- | --- | --- | --- |
| Google Meet Web | Implemented | Implemented | Implemented |
| Microsoft Teams Web | Implemented | Implemented | Implemented |
| Zoom Web App | Implemented | Implemented | Implemented |

Notes:

- Capture is based on browser-visible provider DOM surfaces.
- Chat persistence depends on provider event extraction and `storeMeetingChat` setting.
- Unsupported page states can still lead to no-capture behavior even on supported providers.

## Canonical Alignment Targets

Keep this matrix aligned with:

- `docs/quality/compatibility-matrix.md`
- `docs/operations/store-listing.md`
- `docs/operations/store-submission.md`
- `docs/security/privacy-disclosure-notes.md`
