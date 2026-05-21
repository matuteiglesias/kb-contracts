---
title: ADR-0005 contract profiles and promotion
sidebar_position: 7
---

# ADR-0005: Contract profiles and promotion path for paper-kb

- **ID**: ADR-0005
- **Title**: Contract profiles and promotion path for paper-kb
- **Status**: proposed
- **Date**: 2026-05-21

## Decision

KB Contracts becomes the governance spine, and `paper-kb` adopts a staged promotion model instead of immediate full bus-grade conformance.

This decision freezes the following constraints:

- The governance non-negotiables remain mandatory across profiles:
  1. explicit public/private boundary
  2. stable IDs
  3. run records for non-trivial runs
  4. manifests for artifact sets
  5. schema versions
  6. smoke tests
  7. consumers read published endpoints/indexes, not repo internals
  8. vector stores and caches are derived, not source of truth
- `paper-kb` starts with a local contract profile (`Profile 0`) for local product speed.
- Full bus-grade Chunk Bus/Summary Bus conformance is a promotion target (`Profile 2`), not the day-one burden.
- A middle interop profile (`Profile 1`) is the required bridge for cross-repo consumption.

## Context

Recent repair work showed that most brittleness came from ambiguous seams and accidental cross-repo coupling.

The existing KB Contracts doctrine has strong instincts that should be kept: consumers should read stable published seams, producers and consumers should declare which seam they touch, and cross-family wiring should pass through adapters with schema versions, manifests, and run records.

At the same time, requiring every local artifact in `paper-kb` to satisfy full canonical bus constraints (for example full provenance on every chunk, canonical partition layout requirements, or mandatory daily Summary Bus outputs) introduces avoidable friction in local product loops.

The Integration Seams doctrine governs approved endpoints and allowed IO, not internal module layouts. That allows local implementation details to remain lightweight while preserving governance discipline at published seams.

## Alternatives

### Alternative A: Enforce full KB Contracts bus-grade shape immediately in paper-kb

Rejected.

This maximizes governance strictness but slows local iteration and blocks useful local product capabilities on non-critical metadata completeness.

### Alternative B: Ignore KB Contracts and allow repo-local conventions without promotion rules

Rejected.

This speeds local work temporarily but reintroduces the seam ambiguity and accidental coupling that caused brittleness.

### Alternative C: Introduce contract profiles with promotion gates

Accepted (proposed for lead acceptance).

This keeps governance invariants while allowing staged adoption from local artifacts to interop and finally canonical bus-grade outputs.

## Consequences

What becomes easier:

- `paper-kb` can ship usable local browsing/summarization sooner
- teams retain a clear upgrade path to interop and canonical ecosystem contracts
- governance review can focus on seam quality and promotion readiness instead of forcing premature completeness

What becomes harder:

- profile boundaries and promotion checks must be documented and maintained
- some consumers must reason about profile level, not just schema family names

New risks:

- teams may stall at Profile 0 without promotion incentives
- profile labels may be misused to bypass required seam hygiene

## Rollback plan

If profile-based governance creates confusion or weakens interoperability:

1. freeze new Profile 0 usages for cross-repo integrations
2. require Profile 1 minimum for any published adapter outputs
3. update this ADR status to superseded with stricter promotion policy
4. add explicit contract test failures for artifacts that claim profile compliance but miss required fields

## Migration plan

1. Add and document three profiles:
   - Profile 0 (local product artifact)
   - Profile 1 (interop artifact)
   - Profile 2 (canonical bus artifact)
2. Define `paper_chunk.v1` as Profile 0 local artifact shape with a minimal required set.
3. Require Profile 1 for any `paper-kb` output consumed by other repos, including manifests, run records, checksums, and schema validation.
4. Keep Summary Request Seam/central Summarizer Service as a later orchestration target; do not block local summary button flows on day one.
5. Add promotion criteria and smoke tests that detect readiness from Profile 0 -> 1 -> 2.

## Affected contracts

- Integration seams and allowed IO guidance (profile-aware adoption notes)
- Chunk Bus contract positioning for promotion target semantics
- Summary Request Seam adoption guidance (local button vs centralized orchestration timing)
- Manifest and run record contract usage expectations by profile
- Contract compliance tests (profile-aware checks)

## Validation plan

Acceptance is satisfied when all of the following are true:

- A documented Profile 0 shape exists for `paper-kb` local artifacts with required and recommended fields.
- Profile 1 requirements include manifest, run record, checksums, producer metadata, and schema validation.
- Profile 2 maps to existing canonical bus-grade requirements, including provenance and compliance tests.
- Cross-repo consumers are documented to depend on Profile 1+ published seams, not repo internals.
- Smoke tests verify profile conformance at the declared promotion level.

## Failure modes

- Profile 0 artifacts leak into cross-repo usage without promotion controls.
- Promotion checks exist on paper but are not enforced in CI.
- Teams treat optional metadata as universally optional and never converge to Profile 2.

## Observability

Run records should include declared profile level and promotion stage outcomes so reviewers can track where artifacts are in the lifecycle and where promotion fails.

## Open questions

- Should profile level be encoded as a dedicated field in manifests or inferred from schema family and file location?
- What maximum time window should a project remain at Profile 0 before formal promotion review?
