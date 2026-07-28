---
title: Current machine-readable release
sidebar_position: 2
---

# `kb-interop.v1-rc1`

`kb-interop.v1-rc1` is the current immutable **release candidate** for knowledge-artifact interoperability. It is assembled for authority review; it is not a final release.

## Consume it directly

| Purpose | Repository-relative artifact |
|---|---|
| Bootstrap registry | [`contracts/registry.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/registry.json) |
| Module descriptor | [`contracts/schemas/module.v1.schema.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/schemas/module.v1.schema.json) |
| Knowledge artifact manifest | [`contracts/schemas/knowledge_artifact_manifest.v1.schema.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/schemas/knowledge_artifact_manifest.v1.schema.json) |
| Profile 1 claim | [`contracts/schemas/knowledge_profile_claim.v1.schema.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/schemas/knowledge_profile_claim.v1.schema.json) |
| Stable-reference vectors | [`contracts/test_vectors/stable_references.v1.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/test_vectors/stable_references.v1.json) |
| Release inventory | [`contracts/releases/kb_interop_release.v1-rc1.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/releases/kb_interop_release.v1-rc1.json) |
| Migration guidance | [`contracts/migrations/v1-rc1.md`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/migrations/v1-rc1.md) |

These links are for human browsing. Automated consumers should resolve repository-relative paths from `contracts/registry.json`, pin the release manifest's `source_commit`, and verify its SHA-256 inventory.

## One golden path

```bash
npm ci
npm run contract:validate
```

The validator makes no network calls. It validates the registry, schemas, every valid and invalid fixture, compatibility cases, stable-reference vectors, release cross-references, exact-byte hashes, and the pinned source commit. It also verifies that validation leaves the working tree unchanged.

## Release contents

The release contains only:

- `kb.module@1.0`
- `kb.knowledge_artifact_manifest@1.0`
- `kb.knowledge_profile_claim@1.0`
- Knowledge Interoperability Profile 1
- checked-in conformance and compatibility examples
- stable-reference preservation vectors
- migration guidance and release integrity metadata

It contains no run-record, run-bundle, operational-error, lifecycle, promotion, runtime-library, or MCP schema.

## Reading precedence

1. The pinned release manifest and its checksum inventory.
2. Registered JSON Schemas and fixtures.
3. ADR-0006 and the compatibility policy.
4. Focused explanatory documentation.
5. Legacy or candidate operational pages, only within their classification banner.
