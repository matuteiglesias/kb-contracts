---
title: Contract compliance tests
sidebar_position: 80
---

# Contract compliance tests

This page defines the ecosystem level tests that validate contracts and integration seams.

These are not code style checks and not unit tests for internal modules. They are cross repo contract tests that prove a producer emits compliant bus artifacts, and a consumer can safely rely on those artifacts without reading upstream internals.

If a project fails these tests, it is not integrated, even if it runs locally.

## Scope

In scope:

- schemas for bus artifacts and publishing artifacts
- manifests and integrity rules
- stable ID behavior test vectors
- run record schema and error taxonomy compliance
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
- It can run its smoke test and produce a run record, even when outputs are empty.
- It does not violate seam rules, meaning it reads only allowed bus endpoints.

A project that passes internal tests but fails these is treated as non integrated.

## Test catalog

Each test includes:

- ID
- What it validates
- Inputs required
- Pass conditions
- Failure classification, mapping to the error taxonomy
- Artifacts produced by the test run, including its own run record

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
- Summary schema for event summaries and session summaries
- Required provenance fields present
- Source ids list present and non empty for non empty summary sets
- Source hash or selection checksum exists
- Model metadata fields exist
- Prompt hash exists
- Summarizer version exists

Inputs:
- Event summaries day file and manifest
- Session summaries day file and manifest
- Upstream event and session manifests referenced

Pass conditions:
- All summaries validate schema
- Every summary includes source ids
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
- Required fields: schema version, counts, producer version, run id, hash fields
- Hashing rules: correct algorithm and normalization assumptions
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
- stable id behavior matches frozen semantics
- normalization and hashing rules are implemented consistently

Inputs:
- The test vectors defined on the stable id page
- A reference implementation or a CLI that outputs ids for given inputs

Pass conditions:
- All vectors match expected outputs exactly

Failure classification:
- Any mismatch is a contract break, treated as schema mismatch with mandatory ADR and version bump

### T008 Run record schema and error taxonomy compliance

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

Minimum requirement:

- A single command exists to run the ecosystem contract tests against a configured set of artifact roots.
- The runner must not import any project internals.
- The runner produces its own run record, including which projects were evaluated and pass or fail outcomes.

Recommended:

- CI workflow that runs these tests on any change to contract pages or schema definitions
- Project level CI that runs the subset relevant to that project role

## What triggers a contract test update

Contract tests are updated only when:

- a contract page changes
- a schema version changes
- a new bus or publishing artifact type is admitted

Any update must include:

- an ADR if it changes a contract or its compatibility window
- updated test vectors where applicable
- a migration note if a test starts enforcing a new required field
