---
title: Knowledge contracts home
sidebar_position: 1
---

# Knowledge interoperability, with a bounded authority

KB Contracts publishes the small, machine-readable surface that knowledge producers and consumers share. It answers four questions:

1. Which module is participating?
2. Which knowledge product was finalized?
3. Which schema and compatibility rules apply?
4. Can another repository verify the product without importing producer internals?

The current release candidate is **`kb-interop.v1-rc1`**. It contains three Draft 2020-12 schemas, fixtures, stable-reference vectors, migration guidance, and an offline validator.

## Start with the release, not the legacy prose

- [Current machine-readable release](./current-release.md)
- [Knowledge Interoperability Profile 1](../03_shared-conventions/contract-profiles-and-promotion-ladder.md#profile-1--published-interop-artifact)
- [Knowledge artifact manifest](../03_shared-conventions/manifests-and-integrity-rules.md#normative-knowledge-artifact-manifest-boundary)
- [Compatibility and migration](../03_shared-conventions/knowledge-contract-compatibility.md)
- [ADR-0006 authority boundary](../01_registry-governance/adr-0006-knowledge-interoperability-authority-boundary.md)

## What is authoritative now

| Surface | Authority |
|---|---|
| `contracts/registry.json` | Bootstrap registry for the schemas, profile, and release candidate |
| `module.v1` | Participant identity, repository, accepted/emitted knowledge interfaces, validation, and release claim |
| `knowledge_artifact_manifest.v1` | One finalized knowledge product, payload integrity, and portable knowledge provenance |
| `knowledge_profile_claim.v1` | Machine-readable Knowledge Interoperability Profile 1 claim |
| `stable_references.v1.json` | Preservation and bounded-grammar vectors; not a universal ID algorithm |
| `kb_interop_release.v1-rc1.json` | Immutable source commit and exact-byte SHA-256 inventory |
| `npm run contract:validate` | Deterministic, offline conformance gate |

## What is not a KB interoperability contract

Run records, run bundles, lifecycle statuses, operational error taxonomies, environment capture, retries, staging, atomic promotion mechanics, and rollback remain producer-owned or candidate operational guidance. Existing pages are retained for context and migration, but their classification banners control how they may be used.

## The operating rule

For cross-repository knowledge exchange, publish a versioned public schema and one knowledge artifact manifest per promoted product. Preserve producer-assigned references exactly, use portable paths, pin the contract release, and pass the offline validator.

Do not infer authority from an old Markdown field list. If prose conflicts with a registered schema or ADR-0006, the machine-readable release and ADR-0006 control.
