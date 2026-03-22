---
title: ADR-0004 document summary expansion
sidebar_position: 6
---

# ADR-0004: Expand Summary Bus to first-class document and chunk-set summaries

- **ID**: ADR-0004
- **Title**: Expand Summary Bus to first-class document and chunk-set summaries
- **Status**: accepted
- **Date**: 2026-03-22

## Decision

The Summary Bus must support document-oriented summaries as first-class artifacts, not only event and session summaries.

This decision freezes the following constraints:

- `summary_bus` supports `document_summary` and `chunk_set_summary` as canonical artifact families.
- `chunk_bus` is the canonical upstream for document-like summarization inputs.
- The Summary Request Seam remains the only sanctioned way for callers to request summaries.
- Document-like summaries must keep `outputs.summary_text` as a required compatibility surface.
- Document-like summaries may additionally emit a structured hierarchical synthesis payload for downstream reuse.
- Canonical Summary Bus endpoints and manifests must exist for document and chunk-set summary streams.
- Contract tests, observability references, and onboarding docs must recognize the new summary families.

## Context

The manual already allowed `chunk_bus` as an input to the Summary Request Seam and already allowed `document_summary` and `chunk_set_summary` in `summary_kind`.

That created drift because the Summary Bus contract still described the bus as event/session only, exposed only event/session endpoints, and lacked canonical schema language for document-oriented summary artifacts.

Without a governance decision, downstream teams could treat document summaries as implementation details instead of as a stable control surface.

## Alternatives

### Alternative A: Keep document summaries only at the request seam

Rejected.

This keeps drift in place. Requests would authorize work types that the bus contract does not formally recognize.

### Alternative B: Create a separate document summary bus

Rejected.

This would fragment the summary layer and weaken the principle that summaries are the normalized meaning surface across structured sources.

### Alternative C: Expand Summary Bus in place

Accepted.

This preserves one summary layer while allowing source-specific summary families and compatibility-safe enrichment for document-oriented outputs.

## Consequences

What becomes easier:

- downstream systems can consume document-like summaries through the same sanctioned bus family
- governance pages can describe one coherent summary layer
- contract tests can validate document provenance and hierarchy payloads consistently

What becomes harder:

- summary schema coverage expands and must be maintained across more artifact families
- manifests and observability views must account for more than event/session streams

New risks:

- consumers may assume hierarchy fields always exist, even though they are optional
- producers may emit non-deterministic document selections without documenting selection rules

## Rollback plan

If this decision causes unacceptable downstream breakage:

1. stop publishing document and chunk-set summary daily files
2. keep the request seam unchanged but reject those summary kinds as not yet accepted
3. mark this ADR as superseded or deprecated by a follow-up ADR
4. remove document-oriented references from the Summary Bus contract and contract tests in the same change window

## Migration plan

1. Update governance pages, glossary, and intro guidance.
2. Update Summary Bus, Chunk Bus, Summary Request Seam, and Integration Seams pages.
3. Add canonical endpoints and manifest patterns for document and chunk-set summaries.
4. Expand contract compliance tests to cover the new summary families.
5. Update observability references so index builders can account for the new streams without becoming a summary browser.
6. Keep `outputs.summary_text` required so existing simple consumers remain compatible.

## Affected contracts

- `summary_request.v1` usage guidance on the Summary Request Seam page
- Summary Bus contract schema families: `event_summary.v1`, `session_summary.v1`, `document_summary.v1`, `chunk_set_summary.v1`
- Chunk Bus contract positioning and cross-links
- Integration seams and allowed IO
- Contract compliance tests
- Observability indexes contract
- Intro and glossary governance pages

## Validation plan

Acceptance is satisfied when all of the following are true:

- Summary Bus documentation no longer describes the bus as event/session only.
- Canonical endpoints exist for `documents.summary` and `chunk_sets.summary` artifacts.
- The Summary Request Seam still states that callers write requests, not Summary Bus artifacts.
- Chunk Bus explicitly names itself as the canonical upstream for document-oriented summaries.
- T003 contract compliance tests cover `document_summary` and `chunk_set_summary`.
- Migration guidance is present where consumers may be affected.

## Failure modes

- Producers publish document-like summaries without `source_text_hash` or stable selection semantics.
- Consumers hard-fail on optional hierarchy fields they should ignore.
- Observability code assumes only event/session summary manifests exist.

## Observability

Run records and compacted indexes should be able to show whether document and chunk-set summary streams were produced for a run or day. This does not authorize full summary browsing in the UI.

## Open questions

Not applicable. The decision is intentionally narrow and frozen at the contract layer.
