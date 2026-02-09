---
title: Manifests and integrity rules
sidebar_position: 32
---

# Manifests and integrity rules

Manifests make artifacts verifiable, rerunnable, and safe to consume across repos.

This page defines the manifest schema behavior, hashing behavior, and promotion rules that prevent silent corruption and drift.

## Scope and non scope

This page defines:

- What every manifest must contain
- What is hashed and how hashing is computed
- Required invariants for empty outputs
- Atomic promotion rules for data plus manifest

This page does not define:

- Per bus object schemas (see the bus contract pages)
- How raw inputs are acquired or parsed upstream
- How consumers interpret business meaning beyond integrity checks

## Why manifests exist

A manifest is the single source of truth for:

- What was produced
- What inputs were used
- Whether the artifact is complete and internally consistent
- Whether the artifact is safe for downstream consumption

Downstream consumers must read the manifest first. If the manifest is missing or invalid, consumers must fail fast and record the failure.

## Manifest placement and naming

Each bus defines its endpoint pattern for data files and manifests. The rule is:

- Every data file endpoint has a corresponding manifest endpoint
- The manifest name is derived from the data endpoint deterministically
- The manifest lives next to, or in a designated manifest directory for, that bus

Do not create multiple manifest types for the same artifact family unless an ADR explicitly introduces them.

## Manifest schema

### Required fields

Every manifest must include at least:

- `manifest_version`
  - the version of this manifest schema
- `artifact_family`
  - event_bus, sessions_bus, summary_bus, digest_bus, chunk_bus, snapshot, or other registered family
- `artifact_kind`
  - daily, windowed, snapshot, index, or other registered kind
- `schema_version_emitted`
  - schema version of the objects contained in the data file
- `producer`
  - producer name
- `producer_version`
  - semantic version or commit hash of the producer
- `run_id`
  - identifier of the run that produced the artifact
- `created_at`
  - timestamp of manifest creation in UTC, ISO 8601
- `data_path`
  - relative path to the data file within the artifact root
- `manifest_path`
  - relative path to this manifest within the artifact root
- `counts`
  - `records_total`
  - `records_valid`
  - `records_invalid`
  - `records_dropped`
- `time_range`
  - `min_ts`
  - `max_ts`
  - if the artifact has no timestamps, set both to null and record that explicitly
- `hashes`
  - `data_hash`
  - `hash_alg`
  - `canonicalization`
- `inputs`
  - list of input manifest references used, including their paths and hashes
- `integrity`
  - `complete`
  - `validation_status`
  - `notes` optional

### Optional but recommended fields

These improve debugging and reproducibility:

- `schema_registry_ref`
  - a pointer to the contract page version or schema id
- `warnings`
  - list of warning codes with short messages
- `error_summary`
  - list of error codes with counts
- `environment`
  - python version, OS, dependency lock hash
- `byte_size`
  - data file size in bytes

### Validation expectations

A manifest must be schema validated by the producer before promotion.

Consumers must validate:

- that required fields exist
- that the manifest schema version is supported
- that the hash algorithm is supported
- that counts and time ranges are internally consistent
- that referenced input manifests exist when required

If validation fails, consumers must fail fast and write a run record error.

## Hashing rules

### What is hashed

The primary integrity anchor is the data file hash.

Rules:

- The manifest must include a cryptographic hash of the data file content
- Optionally include hashes of any associated index files or metadata files, but the data file hash is mandatory

If the artifact family is a directory snapshot, the manifest must include:

- a hash of the manifest itself
- a hash listing or index file that covers all payload files, or per file hashes

### Canonicalization for hashing

Hashing must be computed over a canonical byte stream.

Rules:

- Normalize line endings to `\n` before hashing text based artifacts
- Do not include trailing whitespace changes in canonicalization unless the artifact contract requires it
- For JSONL:
  - each line is one JSON object
  - lines are separated by `\n`
  - no extra blank line at the end, unless explicitly declared and consistently applied
- For JSON:
  - canonicalization must define key ordering and whitespace rules if JSON content is hashed as structured text
  - prefer hashing the exact file bytes after writing, rather than re serializing in memory

The manifest must declare the canonicalization mode used.

### Ordering requirements

Ordering affects the hash. The contract must freeze ordering so reruns are comparable.

Rules:

- If a file is append only, preserve append order
- If a file is deterministically generated, freeze ordering rules:
  - example: sort by stable id ascending
- If ordering is not stable by design, the artifact family must not claim rerunnable equivalence. In that case, still hash exact bytes and record ordering stance in the manifest

### Algorithm

Rules:

- Use a single cryptographic hash algorithm per artifact family
- Declare it in `hash_alg`
- Changing the algorithm requires an ADR and a manifest_version bump

Recommended default: sha256.

### When to recompute

Rules:

- Producer computes the hash after writing the data file
- Any consumer that detects a mismatch between computed hash and manifest must fail fast
- Producers must never mutate a finalized data file in place without rewriting the manifest and bumping the run record

If a consumer copies artifacts across machines, the manifest remains valid. Only byte level changes should invalidate it.

## Empty artifact rule

Empty outputs are first class.

Rules:

- A day with zero records still produces:
  - a valid data file, which may be empty but present
  - a manifest with explicit counts set to 0
- The manifest must explicitly state:
  - `records_total: 0`
  - `records_valid: 0`
  - `records_invalid: 0`
  - `records_dropped: 0`
- The hash must be the hash of the empty canonical file representation for that artifact family

Do not treat missing files as empty. Missing is an error, empty is a valid state.

## Promotion rule

Promotion is the integrity boundary.

Rules:

- Write data to a staging location first
- Validate data format and schema in staging
- Compute data hash in staging
- Write manifest in staging
- Validate manifest schema in staging
- Promote data plus manifest together atomically

Atomic promotion means:

- downstream consumers can never observe a new data file without its matching manifest
- downstream consumers can never observe a manifest that points to a non finalized data file

Preferred mechanism:

- stage into a temp directory
- then rename the temp directory into place
- or write to a temp filename and rename both files into final names as a single directory rename

Do not promote by copying partial files into the final location.

## Input manifest referencing

Every manifest must declare what it depended on.

Rules:

- Include a list of input manifests with:
  - `path`
  - `data_hash` of the input data
  - `manifest_hash` or the input manifest hash if available
  - `schema_version_emitted` of the input
- If an input is optional and missing, record that explicitly as a warning and set a well known reason code

This is how reruns remain explainable and how provenance is preserved across the constellation.

## Failure modes

Producers and consumers must recognize these failure modes and record them in run records:

- missing manifest
- manifest schema invalid
- data hash mismatch
- counts inconsistent with data content
- timestamp range inconsistent or missing when required
- input manifest missing
- promotion observed partially, indicating broken atomic promotion
- unsupported manifest_version or hash algorithm

## Change control

Any change to:

- manifest required fields
- hashing canonicalization
- ordering stance
- promotion rules
requires:

- ADR
- manifest_version bump
- a short migration note describing how consumers can handle mixed versions
