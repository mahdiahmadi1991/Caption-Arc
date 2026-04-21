# Content Script Features

Content runtime covers:

- provider detection and presence checks
- caption and chat extraction
- overlay rendering and interaction
- runtime message dispatch to background

Live translation target-language menus in content surfaces derive from the shared catalog in `entrypoints/shared/language-metadata.ts`, so changes to supported target languages should be implemented there rather than hardcoded per provider or overlay module.

Primary implementation path: `entrypoints/content/*`.
