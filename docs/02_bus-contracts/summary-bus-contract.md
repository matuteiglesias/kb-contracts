---
title: Summary Bus contract
sidebar_position: 12
---

# Summary Bus contract

Contract for deterministic summaries with strict provenance.

## Purpose

The Summary Bus carries summary objects derived from canonical upstream structured sources, including Event Bus events, Sessions Bus sessions, and Chunk Bus document or chunk selections.

This page defines:

- Summary object schemas for events, sessions, documents, and chunk sets
- On-disk endpoints and manifest rules
- Provenance requirements and invariants
- Determinism boundaries and what must be reproducible
- Smoke test expectations and failure modes

This contract prioritizes traceability and replay over subjective summary quality.

## Scope

In scope:

- `event_summary` objects: summaries over a single event or a deterministic group of events
- `session_summary` objects: summaries over a single session object
- `document_summary` objects: summaries over one document or a deterministic document slice
- `chunk_set_summary` objects: summaries over a deterministic set of chunk ids
- manifests for all sanctioned summary streams
- provenance fields and invariants
- determinism rules for document and chunk-set selections
- optional structured synthesis fields for hierarchical summaries
- error and accounting rules for skipped items

Out of scope:

- How to parse raw ChatGPT exports
- How sessions are computed
- How embeddings are computed
- Quality evaluation of model outputs
- Any publishing or markdown rendering

## What this is

- A service bus output that can be consumed by packagers (Digest Engine) and other downstream processes.
- A traceable bridge between raw structured objects and human-meaningful synthesis fields.
- The sanctioned storage layer for both compatibility-safe summary text and richer structured synthesis payloads when available.

Consumers do not write summaries. Consumers either read existing summaries by manifest, or create a request to the summarizer service (now or scheduled).
This prevents teams from “helpfully” generating summaries inside their own repos and breaking determinism guarantees.

## What this is not

- A replacement for the Event Bus, Sessions Bus, or Chunk Bus
- A place to do bagging, publishing, or UI export
- A place to hide missing coverage by silently dropping inputs

## Requests are out of bus

Summary Bus is a storage and provenance contract for completed `summary_item` artifacts. **It is not an orchestration interface.**

### Rule

Consumers and producers **must never** write summary items directly into Summary Bus.

### How summaries are requested

Repos request summaries through the **Summary Request seam**, by appending a `summary_request.v1` JSON object to the Summarizer Service queue.

See: **Summary Request Seam** for:

- `summary_request.v1` schema
- queue storage projection and invariants
- idempotency and retry semantics
- formal definition of `now` vs `scheduled`

## Endpoints

### Event summaries

Daily file pattern:

- `summaries/events/YYYY-MM-DD.events.summary.jsonl`

Manifest pattern:

- `summaries/manifest/YYYY-MM-DD.events.summary.manifest.json`

### Session summaries

Daily file pattern:

- `summaries/sessions/YYYY-MM-DD.sessions.summary.jsonl`

Manifest pattern:

- `summaries/manifest/YYYY-MM-DD.sessions.summary.manifest.json`

### Document summaries

Daily file pattern:

- `summaries/documents/YYYY-MM-DD.documents.summary.jsonl`

Manifest pattern:

- `summaries/manifest/YYYY-MM-DD.documents.summary.manifest.json`

### Chunk-set summaries

Daily file pattern:

- `summaries/chunk_sets/YYYY-MM-DD.chunk_sets.summary.jsonl`

Manifest pattern:

- `summaries/manifest/YYYY-MM-DD.chunk_sets.summary.manifest.json`

Rules:

- JSONL: one object per line, UTF-8
- Daily file must exist even if empty
- Manifest must exist even if daily file is empty
- Consumers must read only these endpoints and their manifests

## Canonical summary schemas

The Summary Bus defines four related schemas:

- `event_summary.v1`
- `session_summary.v1`
- `document_summary.v1`
- `chunk_set_summary.v1`

All share a common structure: identity, provenance, selection, model metadata, outputs, and accounting.

### Event summary schema

#### Required fields

- `schema_version`
  String. Example: `event_summary.v1`

- `summary_id`
  String. Stable id for this summary object.

- `day`
  String. `YYYY-MM-DD` partition.

- `source_type`
  String. Must be `event`.

- `source_ids`
  Array of strings. Must include at least one Event Bus `event_id`.

- `selection`
  Object describing exactly what text was summarized.

Required keys inside `selection`:

- `selection_type`
  String. Example: `single_event` or `event_slice`

- `source_text_hash`
  String. Hash of the exact text payload that was summarized, after deterministic normalization.

- `normalization`
  Object describing normalization rules applied before hashing.

Minimum keys inside `normalization`:

- `name` string
- `version` string

- `model`
  Object describing the model invocation identity.

Required keys inside `model`:

- `provider` string
- `model_name` string
- `model_version` string or empty string if unavailable
- `temperature` number or null if unknown
- `max_tokens` integer or null if unknown

- `prompt`
  Object describing the prompt identity.

Required keys inside `prompt`:

- `prompt_hash` string
- `template_id` string or name
- `prompt_version` string

- `producer`
  Object describing the summarizer implementation.

Required keys inside `producer`:

- `summarizer_version` string
- `run_id` string

- `outputs`
  Object holding the summary content.

Required keys inside `outputs`:

- `summary_text` string

#### Optional fields

- `outputs.tags` array
- `outputs.topics` array
- `outputs.category` string
- `outputs.actions` array
- `outputs.confidence` number
- `outputs.format_type` string
- `outputs.notes` string

Any optional field that is model generated must be treated as model output and must not be interpreted as deterministic truth.

### Session summary schema

#### Required fields

- `schema_version`
  String. Example: `session_summary.v1`

- `summary_id`
  String. Stable id for this summary object.

- `day`
  String. `YYYY-MM-DD` partition.

- `source_type`
  String. Must be `session`.

- `source_ids`
  Array of strings. Must include exactly one `session_id` as the primary id.

- `event_ids`
  Array of strings. The session evidence pointer list. Must match the referenced session object or be declared as a derived slice.

- `selection`
  Object describing what text was summarized.

Required keys inside `selection`:

- `selection_type`
  String. Example: `session_full` or `session_slice`

- `source_text_hash`
  String. Hash of the exact text payload summarized.

- `normalization`
  Object describing deterministic normalization before hashing.

- `model`
  Same required fields as event summaries.

- `prompt`
  Same required fields as event summaries.

- `producer`
  Same required fields as event summaries.

- `outputs.summary_text`
  String.

#### Optional fields

Same pattern as event summaries.

### Document summary schema

#### Required fields

- `schema_version`
  String. Example: `document_summary.v1`

- `summary_id`
  String. Stable id for this summary object.

- `day`
  String. `YYYY-MM-DD` partition.

- `source_type`
  String. Must be `document`.

- `source_ids`
  Array of strings. Must include at least one `document_id`.

- `selection`
  Object describing exactly which document content was summarized.

Required keys inside `selection`:

- `selection_type`
  String. Must be one of `document_full` or `document_slice`.

- `source_text_hash`
  String. Hash of the exact selected document text after deterministic normalization.

- `normalization`
  Object describing normalization rules applied before hashing.

- `model`
  Same required fields as event summaries.

- `prompt`
  Same required fields as event summaries.

- `producer`
  Same required fields as event summaries.

- `outputs.summary_text`
  String.

#### Recommended fields

- `document_id` string as a convenience alias to the primary source id
- `chunk_ids` array when the document summary was assembled from explicit chunk references

#### Optional fields

Same pattern as event summaries, plus any structured synthesis fields defined below.

### Chunk-set summary schema

#### Required fields

- `schema_version`
  String. Example: `chunk_set_summary.v1`

- `summary_id`
  String. Stable id for this summary object.

- `day`
  String. `YYYY-MM-DD` partition.

- `source_type`
  String. Must be `chunk_set`.

- `source_ids`
  Array of strings. Must contain the selected `chunk_id` values.

- `selection`
  Object describing exactly which chunk selection was summarized.

Required keys inside `selection`:

- `selection_type`
  String. Must be one of `chunk_set`, `document_subset`, or `selection_manifest`.

- `source_text_hash`
  String. Hash of the exact normalized chunk-set text payload that was summarized.

- `normalization`
  Object describing normalization rules applied before hashing.

- `model`
  Same required fields as event summaries.

- `prompt`
  Same required fields as event summaries.

- `producer`
  Same required fields as event summaries.

- `outputs.summary_text`
  String.

#### Recommended fields

- `document_ids` array when chunk ids span known documents

#### Optional fields

Same pattern as event summaries, plus any structured synthesis fields defined below.

## Structured synthesis outputs

For document-like sources, the canonical summary artifact is a traceable hierarchical synthesis derived from Chunk Bus inputs.

Rules:

- `outputs.summary_text` remains required for compatibility with simple consumers.
- Structured hierarchy fields are optional, but when present they are the canonical additional meaning surface for document-oriented summaries.
- Consumers must ignore unknown optional fields.

Optional structured fields include:

- `outputs.hierarchy`
- `outputs.hierarchy_version`
- `outputs.node_count`
- `outputs.leaf_count`
- `outputs.coverage`
- `outputs.quality`
- `outputs.evidence_refs`
- `outputs.uncertainties`
- `outputs.rendered_short`
- `outputs.rendered_medium`
- `outputs.rendered_long`

## Provenance rules

Provenance is not optional. These requirements exist to prevent silent drift.

### Required provenance fields

Every summary object must contain:

- `source_ids` list
- `selection.source_text_hash`
- `selection.normalization` marker
- model metadata fields under `model`
- prompt identity under `prompt` including `prompt_hash`
- producer identity under `producer` including `summarizer_version` and `run_id`

Document and chunk-set summaries must additionally allow a reviewer to reconcile the selected source ids against canonical `document_id` and `chunk_id` anchors from Chunk Bus.

### Source text hash definition

The `source_text_hash` must be computed over a deterministic serialization of the selected content.

Minimum requirements:

- Normalize line endings
- Remove or normalize known non-semantic whitespace
- Apply a documented normalization rule set with a version marker

Consumers must treat the hash as the canonical anchor for "what was summarized".

### Accounting and coverage rules

Summaries must not silently drop items.

If an item is skipped, the system must:

- record skip counts in the manifest
- include a breakdown of skip reasons
- optionally emit a skip report artifact if the run is large

## Determinism boundaries

The Summary Bus must be deterministic where it can be deterministic, and explicit where it cannot.

### Deterministic components

These must be deterministic and replayable:

- Selection logic for which items are summarized for a day
- Ordering of inputs
- Text normalization rules before hashing
- Prompt template choice and prompt hash derivation
- Summary id derivation

### Non-deterministic components

Model output is not deterministic in general.

Rules:

- Model output fields must be labeled as model generated output.
- The exact prompt hash, model identity, and selection hash must be recorded so a re-run is explainable.
- If you enable a deterministic mode for the model provider, record the setting but do not assume perfect determinism.

## Manifest contract

### Event summary manifest

Minimum required fields for `YYYY-MM-DD.events.summary.manifest.json`:

- `schema_version` string, example: `events_summary_manifest.v1`
- `bus_schema_version` string, example: `event_summary.v1`
- `day` string
- `input` object describing what was consumed:
  - `eventbus_manifest_day` string
  - `eventbus_manifest_sha256` string
  - optional `eventbus_range` if you consume more than one day
- `paths` object:
  - `summaries_path` string
- `counts` object:
  - `eligible` integer
  - `produced` integer
  - `skipped` integer
  - `failed` integer
- `skip_reasons` object mapping reason code to integer count
- `integrity` object:
  - `sha256` string
  - `bytes` integer
- `producer` object:
  - `summarizer_version` string
  - `run_id` string
  - `model_name` string
  - `prompt_hash` string

### Session summary manifest

Same structure, but input references Sessions Bus manifest(s):

- `sessions_manifest_day`
- `sessions_manifest_sha256`

### Document summary manifest

Same structure, but input references Chunk Bus or selection manifests:

- `chunk_manifest_day` or `selection_manifest_path`
- `chunk_manifest_sha256` or `selection_manifest_sha256`
- optional `document_ids` summary fields in the manifest metadata

### Chunk-set summary manifest

Same structure, but input references the chunk selection source:

- `chunk_manifest_day` or `selection_manifest_path`
- `chunk_manifest_sha256` or `selection_manifest_sha256`
- optional `document_ids` or `selection_hash` metadata

## Invariants

Mandatory contract invariants:

- `schema_version` present on every summary object
- `source_ids` always present and non-empty
- `selection.source_text_hash` always present
- Manifest always present even if the day output is empty
- Daily summary file exists even if empty
- Counts must be consistent:
  - `eligible = produced + skipped + failed`
- Items must not be silently dropped:
  - any drop must be reflected in counts and skip reasons

## Compatibility rules

- Consumers must ignore unknown optional fields.
- Adding optional fields does not require a schema bump if semantics do not change.
- Any change that affects provenance interpretation, summary id derivation, or required fields requires:
  - ADR
  - Schema version bump
  - Minimal migration note

Migration note for this expansion:

- Existing consumers of event and session summaries remain unchanged.
- Consumers that enumerate Summary Bus endpoints must add `summaries/documents/` and `summaries/chunk_sets/` if they intend to read document-oriented summaries.
- Consumers must continue to treat `outputs.summary_text` as the required compatibility field and ignore unknown optional structured fields.

Backward compatibility window:

- Consumers must support at least the latest and the previous summary schema versions unless an ADR states otherwise.

## Smoke test

Purpose: validate schema and provenance, not model quality.

A smoke test must validate:

- Can read the relevant upstream manifest(s)
- Can produce empty-but-valid outputs when upstream is empty
- Output JSONL parses
- Every summary object contains:
  - `schema_version`
  - `summary_id`
  - `source_ids`
  - `selection.source_text_hash`
  - `model` and `prompt` objects with required keys
  - `producer.run_id` and `producer.summarizer_version`
- Manifest exists and counts reconcile
- Skip reasons are present when `skipped > 0`
- If `outputs.hierarchy` exists, it satisfies the minimum structure defined by the producer's documented hierarchy version

Acceptance criteria:

- No schema violations
- No missing provenance fields
- No count reconciliation errors

## Failure modes and required behavior

Stop-the-line behavior is mandatory: fail fast, record failure in run records, do not silently degrade.

Common failure modes:

- Missing upstream manifest
- Schema mismatch in upstream inputs
- Malformed JSONL output
- Missing provenance fields
- Manifest mismatch or unreconciled counts
- Selection hash computation failure
