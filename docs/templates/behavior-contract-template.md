# <Behavior Area> Code-Derived Behavior Contract

## Purpose

State what runtime behavior surface this contract covers and why it exists.

## Source Files

- `<repo-relative-source-file-1>`
- `<repo-relative-source-file-2>`

## Rule ID Convention

- Contract rule IDs: `C-<DOMAIN>-<NNN>`
- Traceability case IDs: `<AREA>-<NNN>`

## Contract Rules

## C-<DOMAIN>-001: <Short Rule Title>

Source: `<function-or-module>`

Rules:

1. <deterministic rule>
2. <deterministic rule>
3. <guard/fallback rule>

## C-<DOMAIN>-002: <Short Rule Title>

Source: `<function-or-module>`

Rules:

1. <deterministic rule>
2. <deterministic rule>

## Test Traceability

Link to matrix:

- `docs/quality/references/<matrix-file>.md`

Each rule must map to one or more test cases in the matrix with status (`implemented` or `planned`).

## Change Control

If code changes behavior covered by this contract, update this file and the matching traceability matrix in the same change set.
