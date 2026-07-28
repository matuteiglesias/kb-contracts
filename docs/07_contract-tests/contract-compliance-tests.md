---
title: Contract compliance tests
sidebar_position: 80
---

# Contract compliance tests

> **Authority note:** knowledge interoperability tests validate knowledge schemas, artifact manifests, portable provenance, stable-reference preservation, compatibility, and seam behavior. Run records, operational errors, lifecycle states, and promotion mechanics are candidate operational tests and are not required for Knowledge Interoperability Profile 1. See ADR-0006.

This page defines the ecosystem level tests that validate contracts and integration seams.

These are not code style checks and not unit tests for internal modules. They are cross repo contract tests that prove a producer emits compliant bus artifacts, and a consumer can safely rely on those artifacts without reading upstream internals.

If a project fails these tests, it is not integrated, even if it runs locally.

## Scope

In scope:

- schemas for bus artifacts and publishing artifacts
- manifests and integrity rules
- stable ID behavior test vectors
- opaque operational-evidence reference preservation when such references are present
- seam compliance, meaning allowed IO only

Out of scope:

- performance benchmarks
- model quality evaluation
- internal package import structure
- formatting, linting, or code coverage

## Where these tests live

The spec lives here. The implementation can live in either of these places:

Option A: A dedicated repo for ecosystem contract testing
- Advantages: single place to run in CI, clean separation from any one project
- Constraint: must not import project internals, only read their emitted artifacts

Option B: A shared folder consumed by projects
- Advantages: easier local iteration, tighter feedback loops
- Constraint: still must remain artifact based, not code coupled

Regardless of where code lives, this page is the authoritative list of tests, their inputs, and their pass criteria.

## Acceptance criteria for integration

A project is considered integrated only if:

- It passes the contract compliance tests relevant to the bus role it claims.
- It can run its deterministic offline knowledge-contract validation command against checked-in fixtures.
- It does not violate seam rules, meaning it reads only allowed bus endpoints.

A project that passes internal tests but fails these is treated as non integrated.

## Current machine-readable gate

The release-candidate gate is:

```bash
npm run contract:validate
```

It runs offline and validates:

- the closed registry and exactly three approved Draft 2020-12 schemas;
- all checked-in valid fixtures;
- every invalid fixture against its declared schema keyword, path, missing property, or semantic error code;
- optional namespaced-extension compatibility;
- current/previous-version and unchanged historical validation;
- stable-reference preservation and alias vectors;
- schema, profile, module, and release cross-references;
- repository-relative paths;
- the complete exact-byte SHA-256 inventory; and
- every normative file against the release candidate's pinned source commit.

The validator also compares Git status before and after execution. A successful run must leave the working tree unchanged.

**Machine-readable inputs:** [`contracts/registry.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/registry.json), [`contracts/examples/`](https://github.com/matuteiglesias/kb-contracts/tree/main/contracts/examples), [`stable_references.v1.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/test_vectors/stable_references.v1.json), and [`kb_interop_release.v1-rc1.json`](https://github.com/matuteiglesias/kb-contracts/blob/main/contracts/releases/kb_interop_release.v1-rc1.json).


## Profile-aware contract tests

Profile-aware testing clarifies local usefulness versus integration readiness:

- **Profile 0**: local schema smoke tests, stable ID tests, no cross-repo compliance claim
- **Profile 1**: module descriptor + public knowledge schema + per-product knowledge artifact manifest + portable provenance + valid/invalid fixtures + declared seam + compatibility behavior + deterministic offline validation
- **Profile 2**: full bus compliance tests for the claimed canonical role

A project that only passes Profile 0 tests is usable locally but is not integrated across repos.
A project claiming a bus role must pass the full relevant compliance tests.

Producer-owned run records, bundle manifests, observability indexes, and failure records may be exercised by producer-local or future operational compliance tests. They are not prerequisites for a Knowledge Profile 1 claim.

See [Contract profiles and promotion ladder](/docs/shared-conventions/contract-profiles-and-promotion-ladder).

## Legacy and future test catalog

> **Classification:** T001–T005 and T008–T009 are prose-era family or operational tests retained as migration guidance. They are not silently included in `kb-interop.v1-rc1`. T006 and T007 describe concepts now enforced more precisely by the current machine-readable gate above. A future schema or authority decision must explicitly promote any remaining test into a release.

Each test includes:

- ID
- What it validates
- Inputs required
- Pass conditions
- Failure classification, mapping to the error taxonomy
- Artifacts produced by the test run; operational evidence remains runner-owned

### T001 Event Bus JSONL schema validation

Validates:
- Each line is valid JSON
- Required fields exist
- Schema version marker exists
- Optional fields do not break compatibility rules
- Stable id field exists and is well formed

Inputs:
- One day event JSONL file
- Its manifest file

Pass conditions:
- 100 percent of lines parse
- 100 percent of events validate against the schema version declared
- No duplicate event ids within the file
- Manifest counts match actual counts

Failure classification:
- Malformed JSONL maps to schema mismatch
- Duplicate ids maps to integrity mismatch
- Missing files maps to input missing

### T002 Sessions Bus schema validation

Validates:
- Session object schema
- Session id derivation format and presence
- Each session references only existing event ids
- Cluster outputs schema

Inputs:
- One day sessions artifact
- One day clusters artifact
- Their manifests
- The corresponding event bus day file and manifest

Pass conditions:
- All sessions validate schema
- All referenced event ids exist in the event bus day
- Clusters validate schema
- Empty outputs are allowed but must have manifests with count zero

Failure classification:
- Missing upstream event day maps to input missing
- Referencing non existent event ids maps to integrity mismatch

### T003 Summary Bus schema and provenance validation

Validates:
- Summary schema for event summaries, session summaries, document summaries, and chunk-set summaries
- Required provenance fields present
- Source ids list present and non empty for non empty summary sets
- Source hash or selection checksum exists
- Model metadata fields exist
- Prompt hash exists
- Summarizer version exists
- Optional hierarchy payloads, when present, satisfy the minimum documented structure

Inputs:
- Event summaries day file and manifest
- Session summaries day file and manifest
- Document summaries day file and manifest
- Chunk-set summaries day file and manifest
- Upstream event, session, and chunk manifests referenced
- Fixtures or sample sets covering document and chunk-set summary families

Pass conditions:
- All summaries validate schema
- Every summary includes source ids
- If `source_type=document`, `source_ids` include a valid `document_id` anchor
- If `source_type=chunk_set`, `source_ids` include valid `chunk_id` anchors
- `selection.source_text_hash` reconciles with the deterministic source selection
- `outputs.summary_text` exists for every summary
- If `outputs.hierarchy` exists, it validates against the minimum structure declared by the producer
- Counts reconcile with upstream selection rules recorded in manifest and run record
- No silent drops, any skip is recorded with reason counts

Failure classification:
- Missing provenance maps to schema mismatch
- Count mismatch maps to integrity mismatch

### T004 Digest Bus traceability validation

Validates:
- Bag metadata presence
- Index files are authoritative and consistent
- Each published memo traces back to summary ids and selection rule ids
- Atomic update behavior is respected, meaning indexes and published outputs align

Inputs:
- Digest output directory for a build
- Index files
- Bag metadata files
- Referenced summary artifacts or their indexes

Pass conditions:
- Index entries resolve to existing artifacts
- Every memo has metadata or an index entry that links back to upstream ids
- No orphaned published artifacts outside the index
- No dangling index entries pointing to missing artifacts

Failure classification:
- Trace gaps map to integrity mismatch
- Missing index maps to publish failure

### T005 Chunk Bus schema and idempotency validation

Validates:
- Chunk schema
- Separation from event bus schema
- Chunk id and document id fields present
- Span fields are well formed
- Processed files idempotency mechanism exists and prevents duplicate re ingestion
- Manifests exist and reconcile counts

Inputs:
- Canonical chunks file and manifest for a day or batch
- Idempotency state artifact, such as a processed files table export or equivalent record

Pass conditions:
- Chunks validate schema
- Manifest count matches
- Re running ingestion on same input yields zero new chunks and records skips properly

Failure classification:
- Duplicate chunks maps to integrity mismatch
- Missing idempotency record maps to stop rule violation for this bus role

### T006 Manifests and integrity rules validation

Validates:
- Manifest schema
- Required knowledge artifact fields: schema identity, artifact identity/family/kind, producer, portable payload reference, media type, byte size, provenance, integrity status, and checksum
- Hashing rules: SHA-256 over exact finalized file bytes
- Empty artifact rule: zero counts still manifested

Inputs:
- Any data file plus its manifest

Pass conditions:
- Manifest validates schema
- Hash matches recomputation under the documented rules
- Counts match actual parsed item count

Failure classification:
- Hash mismatch maps to integrity mismatch
- Missing manifest maps to publish failure

### T007 Stable ID test vectors

Validates:
- registry-assigned module and producer IDs match the bounded lowercase grammar
- producer-assigned source, record, artifact, and opaque run references preserve case and exact value
- source IDs remain distinct from presentation slugs
- aliases agree or fail on conflict

Inputs:
- `contracts/test_vectors/stable_references.v1.json`
- checked-in historical-reference fixtures

Pass conditions:
- All valid vectors preserve expected values exactly and all invalid vectors fail for the declared reason

Failure classification:
- Any case change, recomputation, alias conflict, or historical-ID change is a contract break requiring an ADR and schema version bump

### T008 Run record schema and error taxonomy compliance

**Classification: candidate operational contract test.** T008 is retained as legacy shared guidance and is not part of Knowledge Interoperability Profile 1 or `kb-interop.v1-rc1`.

Validates:
- Run record schema fields
- Required counters are present
- Errors follow the error object schema
- Stop the line semantics enforced consistently
- Input and output manifests referenced

Inputs:
- A run record produced by each project smoke test

Pass conditions:
- Run record validates schema
- Required counters exist
- Any failure is classified into an approved error class
- Run record exists even for partial or empty runs

Failure classification:
- Missing run record maps to stop rule violation
- Unknown error class maps to taxonomy violation

### T009 Snapshot publishing schema validation

Validates:
- Snapshot manifest schema
- Tile schema
- Ordering rules
- Compression signaling and integrity anchors
- Atomic publish behavior, meaning snapshot is either fully available or absent

Inputs:
- Snapshot output directory
- Snapshot manifest and tiles
- Integrity indexes if present

Pass conditions:
- Manifest and tiles validate schemas
- Tiles listed in manifest exist
- Missing tiles are not allowed in a published snapshot
- Integrity anchors match

Failure classification:
- Missing tiles maps to publish failure
- Schema mismatch maps to schema mismatch

## How these tests are run

Current requirement:

- Run `npm run contract:validate` from a clean checkout.
- Do not import producer internals or access the network.
- Treat any generated or modified working-tree file as a validation failure.
- Pin the release manifest and verify its source commit and checksums.

Producer-local or future operational test runners may emit their own run records, but Knowledge Profile 1 does not require a universal runner evidence shape.

## What triggers a contract test update

Contract tests are updated only when:

- a contract page changes
- a schema version changes
- a new bus or publishing artifact type is admitted

Any update must include:

- an ADR if it changes a contract or its compatibility window
- updated test vectors where applicable
- a migration note if a test starts enforcing a new required field
