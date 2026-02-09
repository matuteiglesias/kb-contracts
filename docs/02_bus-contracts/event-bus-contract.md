---
title: Event Bus contract
sidebar_position: 10
---

# Event Bus contract

Authoritative contract for atomic message events.

## Purpose

The Event Bus is the canonical, append-only stream of message events. It is the primary seam that downstream consumers rely on.

This page defines the event object schema, on-disk layout, manifest rules, and invariants. It does not define how to parse ChatGPT exports or any other upstream raw source format.

## Scope

This contract defines:

- Canonical event object schema and schema version marker
- Stable ID rules and timestamp normalization rules
- Provenance fields required for replay and traceability
- File layout and endpoint patterns
- Manifest format requirements and integrity checks
- Compatibility and evolution rules for schema changes
- Smoke test expectations
- Failure modes and required responses

## Non-scope

This contract does not define:

- How raw sources are discovered, downloaded, or authenticated
- Parsing logic for ChatGPT export formats
- Enrichment logic such as tagging, categorization, or summaries
- Any vector store or database indexing strategy

## Bus endpoints

### Daily event files

Path pattern:

- `eventbus/daily/YYYY-MM-DD.jsonl`

Rules:

- One JSON object per line
- UTF-8
- Append-only for a given day
- Must exist even if empty

### Daily manifest files

Path pattern:

- `eventbus/manifest/YYYY-MM-DD.manifest.json`

Rules:

- Must exist even if the day file is empty
- Must reference the corresponding daily file path
- Must include schema version, counts, and integrity fields

## Canonical event schema

### Required fields

All events must include the following fields.

- `schema_version`  
  String. Example: `event.v1`

- `event_id`  
  String. Stable ID. Deterministic across re-runs when source data is unchanged.

- `timestamp_ms`  
  Integer. Epoch milliseconds.

- `role`  
  String enum. Allowed values: `user`, `assistant`, `system`, `tool`

- `content`  
  String. The message text. Empty string is allowed.

- `source`  
  Object. Provenance for replay and traceability.

Minimum required keys inside `source`:

- `source_system`  
  String. Example: `chatgpt_export`

- `source_record_id`  
  String. The upstream identifier if available, else a deterministic surrogate.

- `source_uri`  
  String. Path or identifier of the raw source file or dataset.

### Optional fields

Optional fields may appear. Consumers must ignore unknown optional fields.

Common examples:

- `conversation_id`  
  String.

- `title`  
  String.

- `language`  
  String.

- `tokens`  
  Object with token counts and model details, if computed.

- `enrichment`  
  Object. Must be clearly marked as derived output if present.

### Example event object

```json
{
  "schema_version": "event.v1",
  "event_id": "evt_2f6d2c7b9b9d0a4e",
  "timestamp_ms": 1672614871597,
  "role": "assistant",
  "content": "Example content",
  "source": {
    "source_system": "chatgpt_export",
    "source_record_id": "e09cd21a-9637-4b9e-9a68-38ce89d74d6e",
    "source_uri": "raw/chatgpt/conversations.json"
  },
  "conversation_id": "4db5e2c6-07ff-4822-8286-c650a852f03b",
  "title": "Keyboard Shortcuts for Nano Text Editor"
}
```

## Stable ID rules

Goal: `event_id` must not change across re-runs when the same upstream content is reprocessed.

Requirements:

* Deterministic: derived from stable upstream identifiers when available
* If upstream identifiers are missing, derive from a stable tuple such as:

  * source_system
  * source_uri
  * conversation_id if available
  * timestamp_ms
  * role
  * content hash
* Collision resistant: must be cryptographic hash based

Prohibited:

* Random UUID generation at ingest time
* IDs that depend on run timestamp or file ordering

## Timestamp normalization rules

* `timestamp_ms` must be epoch milliseconds as integer
* If upstream provides seconds or ISO timestamps, convert to milliseconds
* Allowed range:

  * Must be within a plausible operational window
  * Must not be negative
* If timestamp cannot be recovered:

  * The event must be rejected
  * The run record must include an error and the source pointer

## Provenance rules

* `source` must allow replay
* `source_uri` must point to a retained raw input or a canonical ingest snapshot
* If the same raw file is re-ingested, the resulting events must have the same `event_id` values

## Invariants

These rules are mandatory. Violations must trigger stop-the-line behavior.

* Daily files are append-only
* Stable IDs must not change across re-runs
* Manifest exists for every day, even for empty day files
* `schema_version` exists on every event
* Each daily file must be valid JSONL
* `event_id` must be unique within a day file

## Manifest contract

Minimum required fields for `YYYY-MM-DD.manifest.json`:

* `schema_version`
  String. Example: `event_manifest.v1`

* `bus_schema_version`
  String. Example: `event.v1`

* `day`
  String. `YYYY-MM-DD`

* `daily_path`
  String. Path to the daily JSONL file

* `counts`
  Object with:

  * `events_total` integer
  * `events_by_role` object mapping role to integer

* `integrity`
  Object with:

  * `sha256` string for the daily file content
  * `bytes` integer for daily file size

Optional fields:

* `producer` object: repo, version, git commit
* `generated_at` timestamp

## Compatibility rules

Schema evolution must be controlled and predictable.

* Consumers must ignore unknown fields
* Producers may add optional fields without a version bump if:

  * Existing required fields are unchanged
  * Semantics of existing fields are unchanged
* Any change to required fields, meaning, or ID rules requires:

  * ADR
  * Schema version bump
  * Minimal migration note

Backward compatibility window:

* Consumers must support at least the latest and previous schema versions, unless an ADR states otherwise.

## Smoke test

Purpose: prove that a minimal run can produce contract-compliant outputs.

Minimal command:

* A repo-specific smoke command is acceptable, but it must validate:

  * At least one day file path is produced, even if empty
  * A manifest is produced for that day
  * JSONL parses
  * No duplicate `event_id` values in the file
  * Manifest counts match parsed counts

Expected validations:

* JSONL parse for the daily file
* Schema presence checks for required fields
* Manifest presence and checksum match

## Failure modes and required behavior

Stop-the-line means:

* Fail fast
* Write a run record with error taxonomy
* Do not silently degrade
* Do not emit partial outputs without manifest integrity

### Missing day file

Symptoms:

* `eventbus/daily/YYYY-MM-DD.jsonl` missing

Required response:

* Fail the run
* Record error: `MISSING_DAILY_FILE`

### Malformed JSONL

Symptoms:

* A line is not valid JSON
* Encoding errors

Required response:

* Fail the run
* Record error: `MALFORMED_JSONL`
* Include source pointer to offending line number if possible

### Duplicate event IDs

Symptoms:

* Two lines share the same `event_id`

Required response:

* Fail the run
* Record error: `DUPLICATE_EVENT_ID`

### Timestamp out of range

Symptoms:

* Negative timestamp or implausible date

Required response:

* Reject event
* Fail the run if any rejected events occur
* Record error: `TIMESTAMP_OUT_OF_RANGE`

### Manifest mismatch

Symptoms:

* Parsed count differs from manifest count
* SHA256 differs

Required response:

* Fail the run
* Record error: `MANIFEST_MISMATCH`
* Recommend rebuild of that day output as remediation
