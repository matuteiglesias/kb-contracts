---
title: Contract profiles and promotion ladder
sidebar_position: 30
---

# Contract profiles and promotion ladder

This page defines a profile model for adoption sequencing without weakening canonical contracts.

It is aligned with:

- [Integration seams and allowed IO](/docs/bus-contracts/integration-seams-and-allowed-io)
- [Chunk Bus contract](/docs/bus-contracts/chunk-bus-contract)
- [Summary Bus contract](/docs/bus-contracts/summary-bus-contract)
- [Summary Request Seam](/docs/bus-contracts/summary-request-seam)
- [Run record contract](/docs/shared-conventions/run-record-contract)
- [Manifests and integrity rules](/docs/shared-conventions/manifests-and-integrity-rules)
- [Contract compliance tests](/docs/contract-tests/contract-compliance-tests)
- [ADR-0004: document and chunk-set summary expansion](/docs/registry-governance/adr-0004-document-summary-expansion)

The profile ladder is an extension of existing governance language, not a replacement.

## Why profiles exist

KB Contracts governance is intentionally strict at integration seams and canonical bus surfaces.

Local product loops may still need lighter private artifacts while a project is iterating. Profiles allow that, while preserving hard requirements once data is published for reuse.

## Profile 0 — Local product artifact

Purpose:

- Used inside one repo or one local product runtime.
- Optimized for fast useful iteration.
- Not safe for arbitrary cross-repo consumers.

Rules:

- Must declare schema/profile name.
- Must have stable local IDs.
- Must distinguish required vs recommended fields.
- May warn, not fail, on missing enrichment/provenance fields.
- Must not be advertised as canonical bus output.
- Must remain private unless promoted through a declared adapter and seam.

Example:

- `paper-kb` local `paper_chunk.v1` used by `paper-kb` API/frontend.

## Profile 1 — Published interop artifact

Purpose:

- Safe for one or more other repos to consume through an explicit seam.
- Still lighter than full canonical bus where contract scope allows.

Rules:

- Must have `schema_version`.
- Must have manifest.
- Must have run record.
- Must have stable IDs.
- Must define allowed readers and declared seam.
- Must define required smoke/contract tests.
- Optional fields may remain optional if documented.
- Consumers must validate schema version before processing.

Example:

- `paper-kb` review CSV or `review_node` export consumed by `abstract-scroller` via a declared seam.

## Profile 2 — Canonical bus artifact

Purpose:

- Long-lived ecosystem source of truth.
- Safe for general consumers and automation agents.

Rules:

- Must satisfy the relevant bus contract fully.
- Must pass compliance tests.
- Must satisfy manifest and run record requirements.
- Must obey integration seam and allowed IO rules.
- Must include full required provenance/integrity fields for the bus family.
- Must preserve sanctioned bus flow and adapter boundaries.

Example:

- canonical Chunk Bus, Summary Bus, Event Bus outputs.

## Promotion rule

A repo may freely use Profile 0 internally, but crossing repo boundaries requires Profile 1 or Profile 2.

If an artifact is reused by another repo, the producer must either:

- promote it to Profile 1 with manifest + run record + explicit seam, or
- export it through an adapter that emits a Profile 1 or Profile 2 artifact.

Unapproved wiring remains forbidden. If a needed seam does not exist, add the minimal adapter and update contract docs before integration.

## Paper-kb examples

- `paper-kb` internal `chunk_set`
  - Profile 0
  - used by `paper-kb` API/frontend
  - may have lighter chunk fields

- `paper-kb` review CSV or `review_node`
  - Profile 1
  - consumed by `abstract-scroller`
  - must have explicit schema and run evidence

- canonical Chunk Bus export
  - Profile 2
  - emitted only by an adapter such as `export_chunk_bus`
  - must satisfy Chunk Bus contract and compliance tests

- `paper-kb` local summary JSON
  - Profile 0 initially
  - may include KB-compatible provenance fields
  - is not automatically Summary Bus

- `paper-kb` Summary Bus export
  - Profile 1 or Profile 2 depending on scope and claims
  - emitted by an adapter such as `export_summary_bus`
  - must satisfy Summary Bus contract, manifest, run record, and tests at claimed level

## Boundary reminders

- Consumers must read published endpoints and indexes, not private repo internals.
- Consumers must not read raw exports, staging files, or scratch outputs directly.
- Vector stores and caches remain derived artifacts, not source of truth.
- Repos that claim canonical bus producer roles must pass the full relevant bus compliance tests.

## Related pages

- [Integration seams and allowed IO](/docs/bus-contracts/integration-seams-and-allowed-io)
- [Contract compliance tests](/docs/contract-tests/contract-compliance-tests)
- [ADR-0005: contract profiles and promotion path for paper-kb](/docs/registry-governance/adr-0005-contract-profiles-and-promotion)
