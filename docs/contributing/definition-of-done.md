# Definition Of Done

A change is done only when all applicable items are satisfied.

## Engineering

- implementation is complete and coherent
- affected tests are added or updated for changed behavior
- `pnpm test:google` passes for code changes
- `pnpm test:google:coverage` is executed for code changes and results are recorded in the implementation summary
- runtime-sensitive flows are validated where applicable
- test deferral is used only with explicit repository-owner approval and a recorded follow-up plan
- testing policy follows `docs/quality/testing-quality-gate.md`

## Documentation

- affected docs are updated in the same PR
- business-sensitive behavior changes include updates to canonical docs under `docs/product/`
- behavior-sensitive code changes include updates to canonical behavior contracts under `docs/api/`
- behavior-sensitive code changes include updates to traceability matrices under `docs/quality/references/`
- behavior-contract updates follow `docs/contributing/behavior-contract-governance.md`
- section indexes include any new docs
- architecture/setup/api/security docs reflect changed behavior
- `pnpm docs:check` passes
- `pnpm docs:check:business` passes when business-sensitive code surfaces changed
- `pnpm docs:check:behavior` passes when behavior-sensitive code surfaces changed
- `pnpm i18n:check` passes when shipped UI locale catalogs change

## Safety

- no secrets or unsafe local details introduced
- permissions and privacy-facing notes stay aligned with behavior
