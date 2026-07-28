---
title: Contract profiles and promotion ladder
sidebar_position: 30
---

# Contract profiles and promotion ladder

> **Authority note:** this page now governs **knowledge interoperability profiles** only. Operational evidence such as run records, bundle manifests, lifecycle status, retries, and environment capture remains producer-owned pending a separate operational-evidence authority. See ADR-0006.

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

**Machine-readable authority:** [`contracts/schemas/knowledge_profile_claim.v1.schema.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/schemas/knowledge_profile_claim.v1.schema.json), with a checked-in [valid claim](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/examples/valid/knowledge_profile_claim.v1.json). Module requirements are enforced by [`module.v1.schema.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/schemas/module.v1.schema.json).

> **RC1 adoption gap:** the current validator resolves `public_schemas` only through the KB Contracts registry. Producer-owned schemas cannot yet be declared with an independently verifiable repository/commit/path/hash tuple. Do not copy producer schema content into KB Contracts or force a KB-owned binding as a workaround. See [Producer-owned schemas (next RC)](/docs/home/producer-owned-schemas).

Purpose:

- Safe for one or more other repos to consume through an explicit seam.
- Still lighter than full canonical bus where contract scope allows.

Rules:

- Must provide a versioned module descriptor.
- Must publish one or more versioned public knowledge-artifact schemas.
- Must have stable, opaque public artifact and source identifiers.
- Must have a `knowledge_artifact_manifest.v1` for every promoted public product.
- Must provide artifact-level checksum and portable provenance.
- Must define allowed readers and declared seam.
- Must check in valid and invalid fixtures.
- Must expose one deterministic offline validation command.
- Must state explicit compatibility behavior.
- Must not depend directly on another repository's undeclared internals.
- Optional fields may remain optional if documented.
- Consumers must validate schema version before processing.

Optional producer-owned operational evidence may include a run record, bundle manifest, observability index, publication report, or failure record. Such evidence improves operational maturity but is not required by Knowledge Interoperability Profile 1, and references to it remain opaque.

The exact gate is `npm run contract:validate`; prose-only examples on older bus pages do not add fields to this profile.

Example:

- `paper-kb` review CSV or `review_node` export consumed by `abstract-scroller` via a declared seam.

## Profile 2 — Canonical bus artifact

Purpose:

- Long-lived ecosystem source of truth.
- Safe for general consumers and automation agents.

Rules:

- Must satisfy the relevant bus contract fully.
- Must pass compliance tests.
- Must satisfy the relevant knowledge artifact manifest and provenance requirements.
- Must obey integration seam and allowed IO rules.
- Must include full required provenance/integrity fields for the bus family.
- Must preserve sanctioned bus flow and adapter boundaries.

Example:

- canonical Chunk Bus, Summary Bus, Event Bus outputs.

## Promotion rule

A repo may freely use Profile 0 internally, but crossing repo boundaries requires Profile 1 or Profile 2.

If an artifact is reused by another repo, the producer must either:

- promote it to Profile 1 with a knowledge artifact manifest, fixtures, validation, compatibility policy, and explicit seam, or
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
  - must have an explicit knowledge schema, per-product manifest, fixtures, portable provenance, and offline validation

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
  - must satisfy the knowledge-artifact schema, manifest, provenance, seam, and tests at the claimed level; producer-local run evidence is optional at Profile 1

## Boundary reminders

- Consumers must read published endpoints and indexes, not private repo internals.
- Consumers must not read raw exports, staging files, or scratch outputs directly.
- Vector stores and caches remain derived artifacts, not source of truth.
- Repos that claim canonical bus producer roles must pass the full relevant bus compliance tests.

## Related pages

- [Integration seams and allowed IO](/docs/bus-contracts/integration-seams-and-allowed-io)
- [Contract compliance tests](/docs/contract-tests/contract-compliance-tests)
- [ADR-0005: contract profiles and promotion path for paper-kb](/docs/registry-governance/adr-0005-contract-profiles-and-promotion)
