---
title: Digest Bus contract
sidebar_position: 13
---

# Digest Bus contract

Contract for memory bags and published digest artifacts.

## Purpose

The Digest Bus carries compiled memory artifacts, called bags, plus the published outputs that downstream consumers can render or serve.

This page defines:

- Bag representation and bag id stability rules
- On-disk layout for digests and memos
- Authoritative index files and how consumers must read them
- Traceability rules back to Summary Bus inputs and selection rules
- Atomic publishing rules
- Smoke test expectations and failure modes

This contract treats the Digest Bus as a publish boundary with strict integrity guarantees.

## Scope

In scope:

- Bag model and required metadata
- Index files and their semantics
- Publish directory layout for L2 and similar levels
- Naming conventions for artifacts and memo files
- Atomic update rules for published outputs
- Traceability invariants and validation gates

Out of scope:

- How summaries are produced
- How sessions are computed
- How selectors are authored or tuned
- Human editorial judgement inside memo text
- UI rendering or site generation

## Key rule

Consumers must read index files.

Consumers must not discover digests by walking directory trees and guessing conventions.

If an output is not referenced by an index entry, it does not exist as far as the contract is concerned.

## Concepts

### Bag

A bag is a deterministic compilation of units derived from upstream summaries plus selection rules.

A bag has:

- a stable id
- a type
- a window or scope
- a manifest of what it contains
- published artifacts (memos, optional data files)
- authoritative index references

### Digest

A digest is the published representation of one bag or a set of related bags.

A digest may include:

- memo markdown files
- metadata sidecars
- optionally snapshot-ready payloads

## Endpoints

The contract defines a small set of canonical endpoints. You may add internal run folders, but these endpoints are the stable interface.

### Published digests

Base directory:

- `digests/`

Level 2 published output layout:

- `digests/L2/<bag_type>/<bag_id>/`

Required subpaths inside a bag directory:

- `meta/bag.json`
- `meta/trace.json`
- `memo/`
- `memo/index.json`

Optional subpaths:

- `data/` for structured exports
- `assets/` for images or attachments if needed

Memo file placement:

- `digests/L2/<bag_type>/<bag_id>/memo/<memo_slug>.md`

Memo sidecar metadata:

- `digests/L2/<bag_type>/<bag_id>/memo/<memo_slug>.meta.json`

### Authoritative indexes

Index directory:

- `index/`

Required authoritative index files:

- `index/l2_by_window.json`
- `index/digest_registry.json`

Optional indexes:

- `index/l2_latest.json`
- `index/tags_index.json`
- `index/pairs_index.json`

Integrity anchors:

- `index/index.sha256` or equivalent integrity file
- optional per-index sha files if preferred

### Run records

Digest builds must write run records:

- `artifacts/run_records/<run_id>.run_record.json`

## Bag model

### Bag id stability

A bag id must be stable across reruns when inputs and selection rules are identical.

A bag id must be derived from:

- bag type
- window definition
- selector or rule set identity
- the ordered list of upstream summary ids, or a deterministic hash of that list

If any of these change, bag id may change. If bag id changes, it must be explainable via trace data.

### Required bag metadata file

`meta/bag.json` is required and must be schema versioned.

Minimum required fields:

- `schema_version` string, example: `digest_bag.v1`
- `bag_id` string
- `bag_type` string, example: `tagbag` or `pairbag` or `cohort`
- `level` string or integer, example: `L2`
- `window` object describing time or scope:
  - `window_type` string
  - `start_day` string or null
  - `end_day` string or null
  - `label` string or null
- `selector` object describing selection rules:
  - `selector_id` string
  - `selector_version` string
  - `selector_hash` string
- `inputs` object describing upstream dependencies:
  - `summary_bus_manifest_refs` array of objects with `day` and `sha256`
  - `summary_schema_versions` array
- `counts` object:
  - `candidate` integer
  - `selected` integer
  - `published_memos` integer
- `producer` object:
  - `digest_engine_version` string
  - `run_id` string
- `created_at` string, ISO timestamp

### Required trace file

`meta/trace.json` is required and exists to support audit and downstream confidence.

Minimum required fields:

- `schema_version` string, example: `digest_trace.v1`
- `bag_id` string
- `upstream` object:
  - `summary_ids` array of strings
  - `source_ids_union` array of strings or omitted if too large, but then include `source_ids_union_hash`
  - `source_ids_union_hash` string
- `rules` object:
  - `selector_id` string
  - `selector_hash` string
  - `registry_hash` string if a registry influences selection
- `coverage` object:
  - `selected_summary_ids` integer
  - `dropped_summary_ids` integer
  - `drop_reasons` object mapping reason code to counts
- `integrity` object:
  - `bag_dir_sha256` string or an equivalent deterministic integrity representation

## Memo model

Each memo must have:

- markdown content file
- metadata sidecar json
- traceability fields that connect it to bag, rules, and upstream summaries

### Required memo metadata sidecar

`memo/<memo_slug>.meta.json` is required.

Minimum required fields:

- `schema_version` string, example: `digest_memo_meta.v1`
- `bag_id` string
- `memo_slug` string
- `title` string
- `bag_type` string
- `level` string or integer
- `summary_ids` array of strings included in this memo
- `selector_id` string
- `selector_hash` string
- `created_at` ISO timestamp
- `integrity` object:
  - `md_sha256` string
  - optional `meta_sha256` string

Optional fields:

- `tags` array
- `topics` array
- `category` string
- `audience` array
- `notes` string

## Index files

Index files are the only allowed interface for consumers.

### index/digest_registry.json

Purpose: enumerate all published bags and where to find them.

Minimum fields:

- `schema_version` string, example: `digest_registry.v1`
- `updated_at` ISO timestamp
- `entries` array of objects with:
  - `level`
  - `bag_type`
  - `bag_id`
  - `window_label` or window fields
  - `path` relative path to bag root
  - `bag_meta_sha256`
  - `trace_sha256`
  - `published_memos` integer

### index/l2_by_window.json

Purpose: primary query surface for L2.

Minimum fields:

- `schema_version` string
- `updated_at` ISO timestamp
- `windows` mapping from window label to:
  - `bag_refs` array of bag reference objects:
    - `bag_type`
    - `bag_id`
    - `path`
    - `published_memos`
    - `created_at`

### Memo index inside each bag

`memo/index.json` must exist.

Minimum fields:

- `schema_version` string, example: `bag_memo_index.v1`
- `bag_id` string
- `updated_at` ISO timestamp
- `memos` array of:
  - `memo_slug`
  - `title`
  - `path` relative path to markdown
  - `meta_path`
  - `md_sha256`
  - optional `tags`

## Publishing rules

Publishing must be atomic.

Rules:

- Never partially update a published bag directory.
- Never partially update index files.
- Use stage directories and promote only after validation passes.

Recommended pattern:

- Write outputs to a staging directory
- Validate:
  - schemas
  - traceability
  - integrity hashes
  - index references
- Promote staging into final location via atomic rename
- Update indexes via atomic write:
  - write new index to temp file
  - fsync
  - atomic rename

If atomic rename is not possible across devices, the pipeline must enforce same filesystem staging or record a stop-the-line failure.

## Invariants

Mandatory invariants:

- Every published memo must be traceable to:
  - bag id
  - selector identity
  - upstream summary ids
- Index files must be authoritative:
  - any published bag must be referenced by `digest_registry.json`
  - any bag referenced by indexes must exist and validate
- Index updates must be atomic:
  - consumers must never observe partially updated indexes
- Published output never partially updated:
  - either the full bag build is present and valid, or it is absent
- Schema versions always present in:
  - `meta/bag.json`
  - `meta/trace.json`
  - `memo/index.json`
  - memo sidecars

## Compatibility rules

- Consumers must ignore unknown fields.
- Adding optional fields is allowed without bump if semantics do not change.
- Changes to:
  - bag id derivation
  - index file semantics
  - required metadata fields
  - publishing atomicity behavior
  require:
  - ADR
  - schema version bump for affected schemas
  - minimal migration note

Backward compatibility window should be defined in ADRs. Default expectation: support latest and previous versions for index files.

## Smoke test

Purpose: validate index consistency, atomic update behavior, and traceability.

A smoke test must validate:

- A bag build produces:
  - `meta/bag.json`
  - `meta/trace.json`
  - `memo/index.json`
  - at least zero memos, but valid structure always
- All referenced paths in `digest_registry.json` and `l2_by_window.json` exist
- Hashes reconcile:
  - bag meta sha matches referenced sha
  - memo md sha matches computed sha
- Traceability:
  - every memo sidecar lists summary ids
  - summary ids referenced are unique and well-formed
  - selector hash present and non-empty
- Atomicity behavior:
  - the build uses stage then promote, evidenced by run record fields or a publish log artifact

Acceptance criteria:

- No missing required files
- No index references to missing paths
- No memo without meta sidecar
- No trace file missing upstream linkage
- No partial publish detectable

## Failure modes and required behavior

Stop-the-line behavior is mandatory.

Common failures and required error recording:

- Index references missing bag directory
- Missing `meta/bag.json` or missing schema version markers
- Memo missing sidecar or integrity mismatch
- Bag id drift without selector or inputs changes
- Non-atomic index update detected
- Inconsistent counts between bag metadata and memo index

On any failure:

- do not publish partial outputs
- record the failure in the run record
- include enough details to reproduce the validation step
