---
title: Chunk Bus contract
sidebar_position: 14
---

# Chunk Bus contract

The Chunk Bus is the canonical contract for document chunks. It is independent from chat events and sessions.

## Scope and non scope

This page defines:

- The canonical chunk object schema
- Canonicalization expectations and invariants
- Processed files idempotency rules
- File layout and manifest rules
- Storage boundary rules for caches and vector stores
- Smoke test expectations

This page does not define:

- How to parse a specific upstream document format (PDF, TEI, HTML, Markdown)
- How to run a specific parser implementation
- Retrieval UX, ranking, or prompt design
- Any event bus or session bus schemas

## Explicit separation from the Event Bus

Chunk Bus is for documents and their chunked representations.

Event Bus is for atomic message events.

Rules:

- Chunk Bus producers must not emit chat message events
- Event Bus consumers must not treat chunks as events
- If you want to bridge families, do it with an adapter that emits a bus compliant artifact, and declare the seam on the Integration seams page

## Canonical chunk schema

A chunk is a self contained unit of document text plus enough metadata to support replay, indexing, and traceability.

### Required fields

- `schema_version`
  - String marker, for example `chunks.v1`
- `chunk_id`
  - Stable identifier for the chunk
  - Must be deterministic from canonical inputs
- `document_id`
  - Stable identifier for the source document
- `text`
  - The chunk text content
- `provenance`
  - Object describing where this chunk came from and how it was produced

### Recommended fields

- `source`
  - `source_uri` or a canonical source reference
  - `source_type` such as `pdf`, `tei`, `html`, `md`
- `span`
  - Structured location information within the document, see Span model below
- `metadata`
  - Normalized metadata such as title, authors, year, venue, language
- `canonicalization`
  - Details about normalization steps and their versions
- `hashes`
  - Content hashes for traceability, see Hash model below
- `created_at`
  - ISO timestamp when this chunk object was produced
- `producer`
  - Producer name and version, plus run id if available

### Optional fields

- `tokens`
  - Token counts if computed
- `quality`
  - Validation or quality signals, for example `is_empty`, `is_truncated`, `parse_warnings`
- `embedding_ref`
  - Pointer to embedding cache entry, never the vector itself

### Span model

Span describes where the chunk lives in the source document.

At least one of these must exist if the source supports it:

- `pages`
  - `page_start`, `page_end` integers
- `char_range`
  - `char_start`, `char_end` integers in the canonicalized text stream
- `section`
  - Section path or heading chain
- `tei`
  - TEI specific anchors if applicable

Span must be treated as best effort metadata. Missing span is allowed when the upstream format does not support it reliably.

### Provenance model

Provenance must allow consumers to verify traceability and reproducibility.

Required elements:

- `source_uri` or `source_ref`
- `source_checksum`
  - Hash of the original source file bytes if available
- `parser`
  - `parser_name`, `parser_version`
- `canonicalizer`
  - `canonicalizer_name`, `canonicalizer_version`
- `inputs`
  - List of upstream artifacts used to generate this chunk, including their checksums when available

### Hash model

Hash fields enable idempotency, validation, and rebuild operations.

Recommended:

- `text_hash`
  - Hash of the chunk `text` after canonicalization
- `chunk_object_hash`
  - Hash of the full canonical chunk object after field ordering normalization
- `document_object_hash`
  - Optional, if the producer computes a canonical document metadata object

## Canonicalization rules

Chunk producers must canonicalize enough to make IDs stable and downstream indexing predictable.

Minimum canonicalization expectations:

- Normalize newlines consistently
- Remove invalid unicode and control characters that break JSONL readers
- Strip leading and trailing whitespace from `text`
- Enforce that `text` is a string, never null
- Ensure metadata keys are stable and use one naming convention

Canonicalization must not:

- Rewrite meaning or paraphrase content
- Invent metadata that is not sourced
- Drop text silently

If a producer must drop content, it must record the reason and counts in the manifest and run record.

## Stable ID rules

### document_id

`document_id` must be stable across reruns for the same source document.

Recommended derivation:

- Use a deterministic stable id derived from:
  - normalized source uri or stable path
  - source checksum
  - optional normalized title if uri is unavailable

### chunk_id

`chunk_id` must be stable across reruns given the same canonicalization and chunking logic.

Recommended derivation inputs:

- `document_id`
- a stable span key if available, otherwise an ordered index within the document
- `text_hash`

If chunking boundaries change, chunk ids may change. That is acceptable only when:

- the schema version or chunking version changes
- the manifest records the change
- the migration note and ADR rules are followed

## Processed files idempotency

Chunk Bus producers must be idempotent at the file ingestion level.

Rules:

- A source file must not be reprocessed if it has already been processed with the same source checksum, parser version, and canonicalizer version
- The system must record processed state in a durable store:
  - sqlite table, jsonl ledger, or equivalent
- Idempotency state must be queryable and auditable

Required processed file record fields:

- `source_uri` or source path
- `source_checksum`
- `parser_name`, `parser_version`
- `canonicalizer_name`, `canonicalizer_version`
- `processed_at`
- `run_id` or run record pointer
- `status` and `error_type` if failed

Failure handling:

- A failed processing attempt must be recorded, with an error taxonomy code
- Retrying must not erase prior failures, it should append a new attempt record

## Storage boundary

Chunk Bus is the canonical source of truth for document text units.

Allowed persisted state:

- Canonical chunk JSONL files plus manifests
- Processed files idempotency ledger
- Optional caches that are derived and rebuildable:
  - embedding cache sqlite
  - retrieval indexes
  - vector store directories

Not allowed as the only source of truth:

- Vector store as the only store of chunk text
- Any store that cannot be rebuilt from canonical chunks

### Embedding cache interaction

Rules:

- Embeddings must be derived from chunk `text` and include a reference to:
  - embedding model name and version
  - embedding parameters if relevant
  - `text_hash` that the embedding was computed from
- Chunk bus must not embed vectors into the chunk object
- Chunk objects may include `embedding_ref` pointers only

### Rebuild indexes from chunks

This means:

- Given only the canonical chunk JSONL files plus manifests, a system can recreate:
  - vector stores
  - retrieval indexes
  - any embedding caches
  - any secondary views used for browsing or search

If a rebuild cannot happen, then some required information is missing from the chunk schema or manifests.

## File endpoints

The Chunk Bus is defined by the canonical chunks directory plus manifests.

### Canonical chunks

- `chunks/canonical/YYYY-MM-DD.jsonl` or an equivalent partition scheme
- Alternative allowed partitions:
  - by document source type
  - by collection name
  - by document id prefix

Partition choice must be stable and documented in the repo runbook.

### Manifests

- `chunks/manifest/YYYY-MM-DD.manifest.json`

Manifest must exist even if the output is empty for that partition.

## Manifest rules

A manifest must include enough information to validate integrity and enable deterministic downstream behavior.

Required manifest fields:

- `schema_version`
- `partition_key`
  - date or collection name
- `created_at`
- `producer`
  - name and version
- `counts`
  - number of documents processed
  - number of chunks emitted
  - number of failures
- `checksums`
  - checksum of the chunks file or set of files
- `idempotency`
  - counts of skipped due to already processed
- `errors`
  - aggregated error taxonomy counts

Recommended:

- `input_sources`
  - list of source uris and their checksums, possibly truncated with a pointer to a detailed ledger
- `canonicalization_versions`
- `chunking_policy_id` or hash

## Compatibility rules

Schema evolution rules:

- New optional fields may be added without a version bump if they are backward compatible
- Any change that affects:
  - required fields
  - id derivation logic
  - canonicalization semantics
  - manifest required fields
  requires:
  - a schema version bump
  - an ADR
  - a migration note

Consumers must:

- accept unknown fields
- reject missing required fields
- validate `schema_version` and fail fast if unsupported

## Smoke test

Purpose:

- Validate that canonical chunks can be loaded and indexed without any vector store present
- Validate manifest existence and basic integrity checks

Smoke test must validate:

- Every JSONL line is valid JSON
- Every object has required fields and the correct `schema_version`
- `chunk_id` uniqueness within the partition
- `text` non null and string typed
- Manifest exists and `counts.chunks_emitted` matches observed count
- Checksums match expected if present

Smoke test must not validate:

- Embedding quality
- Retrieval ranking
- Parser completeness

Minimal acceptance criteria:

- Running the smoke test on an empty partition produces a valid manifest and passes
- Running on a non empty partition validates all required invariants

## Failure modes

Common failure modes and required responses:

- Missing chunk file for a manifested partition
  - Record error `MISSING_OUTPUT:chunks_file`
- Manifest missing
  - Record error `MISSING_OUTPUT:manifest`
- Malformed JSONL
  - Record error `SCHEMA_INVALID:json_parse`
- Missing required fields
  - Record error `SCHEMA_INVALID:required_field_missing`
- Duplicate chunk ids
  - Record error `INTEGRITY_VIOLATION:duplicate_ids`
- Manifest count mismatch
  - Record error `INTEGRITY_VIOLATION:manifest_mismatch`
- Source checksum missing where required by policy
  - Record error `PROVENANCE_INVALID:missing_source_checksum`

All failures must be emitted as run record entries. Downstream consumers must fail fast when these invariants are violated.
