---
title: Knowledge contracts for reliable pipelines
sidebar_label: Start here
sidebar_position: 0
description: Start here for machine-readable knowledge artifact contracts covering schemas, manifests, interoperability, compatibility, provenance, and validation.
---

# Start with the contract you can validate

KB Contracts is the authority for **knowledge-artifact interoperability**. The current machine-readable surface is intentionally narrow and verifiable offline.

## I produce public knowledge artifacts

1. Describe the participant with [`kb.module@1.0`](/docs/home/current-release#consume-it-directly).
2. Publish a versioned knowledge-artifact schema.
3. Emit one [`kb.knowledge_artifact_manifest@1.0`](/docs/shared-conventions/manifests-and-integrity-rules#normative-knowledge-artifact-manifest-boundary) per promoted public product.
4. Preserve source, record, artifact, and opaque producer references exactly.
5. Declare the public seam and compatibility window in a Profile 1 claim.
6. Check in valid and invalid fixtures and pass `npm run contract:validate`.

## I consume public knowledge artifacts

1. Resolve schemas and the release through `contracts/registry.json`.
2. Pin the release candidate's full `source_commit` and verify its file hashes.
3. Validate the manifest before reading its payload.
4. Treat producer-assigned IDs as opaque and case-preserving.
5. Support the current and immediately previous final schema versions unless a longer window is declared.
6. Do not read undeclared repository internals.

## I am changing a contract

Read [ADR-0006](/docs/registry-governance/adr-0006-knowledge-interoperability-authority-boundary), then follow the [compatibility and migration policy](/docs/shared-conventions/knowledge-contract-compatibility). Required additions, removals, renames, semantic or identity changes, checksum changes, enum removals, cardinality changes, and document-meaning changes require a new schema version.

## I am looking for run or operational standards

They are not owned by this release. Run records, lifecycle, operational errors, environment evidence, retries, staging, promotion, and rollback remain producer-local or candidate operational guidance. Pages covering those subjects are retained and labeled so historical knowledge is not silently lost.

## Fast paths

- [Current release](/docs/home/current-release)
- [Knowledge Profile 1](/docs/shared-conventions/contract-profiles-and-promotion-ladder#profile-1--published-interop-artifact)
- [Knowledge manifest](/docs/shared-conventions/manifests-and-integrity-rules#normative-knowledge-artifact-manifest-boundary)
- [Compatibility policy](/docs/shared-conventions/knowledge-contract-compatibility)
- [Contract validation](/docs/contract-tests/contract-compliance-tests#current-machine-readable-gate)
- [Authority boundary](/docs/registry-governance/adr-0006-knowledge-interoperability-authority-boundary)
