---
title: Summary Bus contract
sidebar_position: 12
---

# Summary Bus contract

Contract for deterministic summaries with strict provenance.

## Purpose

The Summary Bus carries summary objects derived from either Event Bus events or Sessions Bus sessions.

This page defines:

- Summary object schemas for events and sessions
- On-disk endpoints and manifest rules
- Provenance requirements and invariants
- Determinism boundaries and what must be reproducible
- Smoke test expectations and failure modes

This contract prioritizes traceability and replay over subjective summary quality.

## Scope

In scope:

- `event_summary` objects: summaries over a single event or a deterministic group of events
- `session_summary` objects: summaries over a single session object
- Manifests for both summary streams
- Provenance fields and invariants
- Error and accounting rules for skipped items

Out of scope:

- How to parse raw ChatGPT exports
- How sessions are computed
- How embeddings are computed
- Quality evaluation of model outputs
- Any publishing or markdown rendering

## What this is

- A service bus output that can be consumed by packagers (Digest Engine) and other downstream processes.
- A traceable bridge between raw structured objects and human-meaningful synthesis fields.

## What this is not

- A replacement for the Event Bus or Sessions Bus
- A place to do bagging, publishing, or UI export
- A place to hide missing coverage by silently dropping inputs

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

Rules:

- JSONL: one object per line, UTF-8
- Daily file must exist even if empty
- Manifest must exist even if daily file is empty
- Consumers must read only these endpoints and their manifests

## Canonical summary schemas

The Summary Bus defines two related schemas:

- `event_summary.v1`
- `session_summary.v1`

Both share a common structure: identity, provenance, selection, model metadata, outputs, and accounting.

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
