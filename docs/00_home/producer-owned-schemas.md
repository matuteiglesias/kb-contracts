---
title: Producer-owned schemas (next RC)
sidebar_position: 3
---

# Producer-owned, independently verifiable schemas

## Status

**Recommended next-release design; not part of `kb-interop.v1-rc1`.**

RC1 proves the shared declaration, artifact-manifest, profile, fixture, and release mechanisms, but its validator resolves `public_schemas` only through the KB Contracts registry. That prevents a producer from owning a domain schema while still making the exact schema bytes independently verifiable. This is an adoption gap in RC1, not a defect in Context Routing or any other producer.

Do not work around the gap by copying a producer schema into KB Contracts, pretending that KB Contracts owns its semantics, or forcing a producer to bind to a KB-owned schema ID. Existing producer schemas remain producer-owned until a later immutable release adds the declaration protocol below.

## Recommended declaration

```json
{
  "schema_id": "context.context_catalog",
  "schema_version": "1.0",
  "schema_ref": "schemas/context_catalog.v1.schema.json",
  "repository": "matuteiglesias/context",
  "source_commit": "0123456789abcdef0123456789abcdef01234567",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

The declaration separates two authorities:

- **Producer authority:** schema content, domain semantics, version changes, fixtures, and migration guidance.
- **KB Contracts authority:** declaration shape, repository and commit pinning, exact-byte verification, compatibility claims, and how modules advertise accepted/emitted schemas.

## Field semantics

| Field | Required behavior |
|---|---|
| `schema_id` | Stable producer-assigned schema identity. It must not collide with a KB-owned schema identity. |
| `schema_version` | Version declared by the producer contract. Historical versions remain addressable. |
| `schema_ref` | Portable repository-relative path at `source_commit`. Absolute paths, URLs, backslashes, and `..` traversal are invalid. |
| `repository` | Canonical registered repository ID in `owner/repository` form. The repository owns the schema semantics. |
| `source_commit` | Full 40-character Git commit containing the schema and its referenced fixtures or migration material. |
| `sha256` | Lowercase SHA-256 of the exact finalized schema file bytes at `schema_ref` in `source_commit`. |

## Verification algorithm

A conforming next-RC validator should:

1. validate the declaration against a shared declaration schema;
2. resolve `repository` through an approved repository registry rather than accepting an arbitrary network URL;
3. resolve the exact Git object named by `source_commit`;
4. read `schema_ref` from that commit, not from a mutable branch;
5. compute SHA-256 over those exact bytes and compare it with `sha256`;
6. meta-validate the producer schema against its declared JSON Schema draft;
7. verify that the module's accepted/emitted schema claim matches the declaration identity and version; and
8. cache or vendor the verified bytes for deterministic offline validation after acquisition.

Network acquisition and offline validation are separate phases. The golden-path validator must remain offline: a release or producer conformance package must provide the pinned schema bytes before validation begins.

## Compatibility and lifecycle

- Changing schema bytes without changing `sha256` is impossible by construction; a mismatch fails verification.
- Moving `schema_ref`, changing `repository`, or changing identity/semantics requires an explicit new declaration and the applicable schema-version decision.
- A new commit with byte-identical content may produce a new declaration pin without changing the producer schema version, provided meaning and identity are unchanged.
- Historical artifacts continue to resolve through their historical declaration and source commit.
- Current and immediately previous final schema versions remain the default consumer support window.
- Aliases still require canonical/legacy fields, precedence, conflict failure, and introduction/deprecation/removal releases.

## Required next-RC fixtures

A later release must include fixtures for:

- a valid producer-owned declaration;
- unknown repository;
- missing or abbreviated source commit;
- absolute or traversing `schema_ref`;
- checksum mismatch;
- missing schema at the pinned commit;
- declaration/schema identity mismatch;
- undeclared module acceptance or emission;
- byte-identical content pinned at a newer commit; and
- historical declaration resolution.

## Context Routing

Context Routing may continue using its current producer-owned schema and publication evidence. No RC1 change or binding is required. A future adoption change should happen only after the declaration protocol is approved, released, and supported by fixtures and validation.
