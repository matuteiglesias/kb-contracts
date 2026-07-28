# KB Contracts

Machine-readable contracts for knowledge-artifact interoperability across repositories.

## Current release candidate

`kb-interop.v1-rc1` contains:

- `kb.module@1.0`
- `kb.knowledge_artifact_manifest@1.0`
- `kb.knowledge_profile_claim@1.0`
- valid, invalid, and compatibility fixtures
- stable-reference preservation vectors
- an immutable release manifest with a pinned source commit and SHA-256 inventory

Validate the complete release offline:

```bash
npm ci
npm run contract:validate
```

Start with [`docs/00_home/current-release.md`](docs/00_home/current-release.md) and [ADR-0006](docs/01_registry-governance/adr-0006-knowledge-interoperability-authority-boundary.md).

RC1 has one documented adoption gap: it cannot yet declare producer-owned domain schemas using a repository, source commit, relative schema path, and exact-byte hash. The recommended next-RC protocol is documented in [`docs/00_home/producer-owned-schemas.md`](docs/00_home/producer-owned-schemas.md). Producers should retain ownership rather than copy domain schemas into this repository.

## Authority boundary

This repository owns shared knowledge artifact identity, schemas, artifact-level integrity and provenance, module descriptors, knowledge compatibility, interoperability profiles, fixtures, and machine-readable releases.

It does **not** own a universal execution architecture. Run records, run bundles, lifecycle statuses, operational errors, environment capture, retries, staging, atomic promotion mechanics, rollback, and orchestration remain producer-owned or candidate operational guidance.

Legacy bus, publishing, storage, runbook, and observability pages are retained for migration context. Their classification banners state whether a page is current knowledge guidance, a legacy family contract, producer-local guidance, or a candidate operational contract. Registered schemas and the pinned release take precedence over prose field lists.

## Local documentation

```bash
npm install
npm run start
```

The documentation landing page emphasizes the current release, adoption path, compatibility rules, and authority boundary.
