---
title: ADR-0006 knowledge interoperability authority boundary
sidebar_position: 8
---

# ADR-0006: Knowledge interoperability authority boundary

- **ID**: ADR-0006
- **Title**: Knowledge interoperability authority boundary
- **Status**: accepted
- **Date**: 2026-07-28
- **Authority**: Matías Iglesias

## Decision

KB Contracts governs shared **knowledge-artifact interoperability**. It owns knowledge artifact families and schema identities, shared source and record identity semantics, artifact-level integrity and provenance, module descriptors, accepted and emitted knowledge schema versions, compatibility rules, knowledge interoperability profiles, fixture-backed conformance tests, and machine-readable knowledge-contract releases.

KB Contracts may require an opaque reference to operational evidence at a knowledge seam. It does not prescribe a universal execution lifecycle or run architecture.

The following are outside this authority boundary:

- run records and run-bundle manifests
- run lifecycle and operational statuses
- structured operational failure, environment, and configuration evidence
- staging, promotion, retry, rollback, and orchestration mechanics
- universal run-ID derivation

Those concerns form a future operational-evidence contract domain whose repository and exact authority have not been selected. This ADR does not authorize a new repository.

Producer repositories continue to own their current operational formats and implementation. Shared knowledge artifacts may reference a producer-native `run_id`, `run_record_ref`, or `producer_manifest_ref` as an opaque, case-preserved value without adopting the referenced document's shape.

`matias-context-mcp` is a governed adapter and consumer. It may normalize selected fields for clients while retaining producer-local evidence, but it does not own producer schemas, artifact semantics, run architecture, or migration policy.

## Context

The existing manual combines durable knowledge seams with useful pipeline-operating guidance. Treating every existing run-record, error, environment, and promotion rule as part of the first machine-readable interoperability release would make a knowledge profile choose a universal execution architecture prematurely.

The required shared surface is narrower: another repository must be able to identify a participant, discover a finalized knowledge product, validate its schema and bytes, preserve shared references, and apply a declared compatibility policy without importing producer internals.

## Alternatives

### Alternative A: Include universal run and operational schemas in KB Contracts v1

Rejected. This would make the knowledge interoperability profile prescribe execution lifecycle, failure, and publication architecture.

### Alternative B: Leave all contracts producer-local

Rejected. Producers still require a shared, machine-readable knowledge-artifact seam and compatibility baseline.

### Alternative C: Separate knowledge interoperability from operational evidence

Accepted. KB Contracts owns the former; producer repositories retain current operational contracts until a deliberate operational authority is established.

## Consequences

The first machine-readable release is limited to:

- `module.v1`
- `knowledge_artifact_manifest.v1`
- `knowledge_profile_claim.v1`
- stable-reference preservation vectors
- valid and invalid fixtures
- a release manifest and migration guidance

It excludes run-record, run-bundle, operational-error, and promotion-lifecycle schemas. Existing operational pages remain useful but must be labeled as guidance, legacy guidance, producer-local reference, candidate operational contract, or deferred extraction rather than assumed to be universally normative.

## Rollback plan

If the boundary prevents required knowledge interoperability, propose a superseding ADR with concrete fixture evidence. Do not expand this ADR silently or import operational shapes into a knowledge schema through optional extensions.

## Migration plan

1. Reclassify current operational pages and operational sections.
2. Rename the shared product manifest to `knowledge_artifact_manifest.v1` and remove execution-lifecycle fields.
3. Narrow Profile 1 to knowledge artifacts, portable provenance, fixtures, validation, compatibility, and declared seams.
4. Add the machine-readable release described in `retrofit/shared-contract-infrastructure-migration-plan.md`.
5. Keep producer-native operational evidence opaque and case-preserved.

## Affected contracts

- Contract profiles and promotion ladder
- Manifests and integrity rules
- Run record contract
- Error taxonomy and stop rules
- Stable IDs and naming rules
- Contract compliance tests
- Shared contract decision packet

## Validation plan

- The documentation build succeeds.
- Searches of the planned release inventory find no run-record, run-bundle, operational-error, or promotion-lifecycle schema.
- Profile 1 requires a knowledge artifact manifest and fixtures but does not require a run record or run bundle.
- The future `npm run contract:validate` command runs deterministically and offline against checked-in Draft 2020-12 schemas and fixtures.

## Failure modes

- Operational guidance is mistakenly treated as a released interoperability schema.
- A producer extension reintroduces universal lifecycle semantics into a knowledge artifact.
- Opaque producer references are lowercased, recomputed, or interpreted by a generic consumer.
- A future operational authority changes producer evidence without a migration plan.

## Observability

Not applicable to the knowledge interoperability release. Producers retain their operational observability contracts. Knowledge artifact manifests may carry opaque references to that evidence.

## Open questions

- Name and location of the future operational-evidence authority.
- Whether a later knowledge release registers producer-owned ID algorithms without making one universal.

