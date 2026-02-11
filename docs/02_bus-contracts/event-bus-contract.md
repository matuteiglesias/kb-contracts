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

### Minimum required fields

* `schema_version`
  String. Manifest schema identifier. Example: `event_manifest.v2`

* `bus_schema_version`
  String. Event record schema identifier. Example: `event.v1`

* `day`
  String. `YYYY-MM-DD` in the bus timezone.

* `daily_path`
  String. Relative or absolute path to the daily JSONL file this manifest describes.

* `counts`
  Object with:

  * `events_total`
    Integer. Total events in the daily file.

  * `events_by_kind`
    Object mapping `event_kind` to integer count.

  * `events_by_domain`
    Object mapping `domain_family` to integer count.

* `integrity`
  Object with:

  * `sha256`
    String. SHA-256 of the daily JSONL file content.

  * `bytes`
    Integer. File size in bytes.

  * `lines`
    Integer. Number of JSONL lines.

* `kind_registry`
  Object that fixes the allowed taxonomy for this file (acts as a compatibility fence):

  * `allowed_kinds`
    Array of strings (see list below).

  * `allowed_subkinds`
    Object mapping each kind to an array of allowed subkinds.
    Must include `"other"` as an allowed subkind for every kind.

### Optional fields

* `producer`
  Object describing the generator:

  * `repo` string
  * `version` string
  * `git_commit` string (short or full hash)
  * `host` string (optional)
  * `run_id` string (optional)

* `generated_at`
  Timestamp string (ISO 8601).

* `warnings`
  Array of strings. Non-fatal issues detected at generation time.

* `notes`
  Freeform string for operator notes.

### Allowed `event_kind` and `event_subkind` (v1)

This is the recommended default taxonomy for `event.v1`. It is intentionally small and stable.

* `chat_turn`
  Subkinds:
  - `user_message`
  - `assistant_message`
  - `tool_call`
  - `tool_result`
  - `system_note`
  - `other`

* `outreach_action`
  Subkinds:
  - `planned`
  - `sent`
  - `reply_received`
  - `followup_due`
  - `other`

* `external_observation`
  Subkinds:
  - `norm_published`
  - `parliament_update`
  - `tweet_posted`
  - `job_posted`
  - `opportunity_posted`
  - `price_tick`
  - `other`

* `external_update`
  Subkinds:
  - `object_changed`
  - `deadline_changed`
  - `status_changed`
  - `other`

* `external_deadline`
  Subkinds:
  - `deadline_upcoming`
  - `deadline_missed`
  - `other`

* `workflow_triggered`
  Subkinds:
  - `schedule_trigger`
  - `manual_trigger`
  - `dependency_trigger`
  - `other`

* `workflow_completed`
  Subkinds:
  - `success`
  - `partial`
  - `other`

* `workflow_failed`
  Subkinds:
  - `exception`
  - `validation_failed`
  - `rate_limited`
  - `auth_failed`
  - `other`

* `health_signal`
  Subkinds:
  - `heartbeat_ok`
  - `lag_detected`
  - `queue_backlog`
  - `other`

* `decision_record`
  Subkinds:
  - `policy_decision`
  - `architecture_decision`
  - `priority_decision`
  - `other`

* `work_session_logged`
  Subkinds:
  - `focus_block`
  - `meeting`
  - `review`
  - `other`

### Boundary rule: event_bus vs chunk/session/summary

The event bus is an append-only log of observations, actions, and triggers. Event payloads must be thin and primarily carry pointers:
- If the content is substantial text, store it in `chunk_bus` and reference it from the event.
- If it is a time-boxed human work unit, store it in `session_bus` and reference it from the event.
- If it is interpreted meaning, classification, or synthesis, store it in `summary_bus` and reference it from the event.

This prevents the event log from becoming a document store or a meaning landfill.

### Producer permissions (public, non-project-specific)

To prevent bus drift, producers should be constrained by role:

- **Signal/ingest producers** may emit: `chat_turn`, `external_observation`, `external_update`, `external_deadline`.
- **Workflow/orchestration producers** may emit: `workflow_triggered`, `workflow_completed`, `workflow_failed`, `health_signal`.
  They should emit detailed execution traces to `run_records` (not the event bus), using the event bus only for routing and alerting signals.
- **Human-work producers** may emit: `work_session_logged`, `decision_record`, and may reference linked `session_bus` items.
- **Transformers and publishers** should generally not invent new events as “meaning outputs”. Their outputs belong in `summary_bus`, `digest_bus`, or `snapshot_bus`, linked back to the upstream events that justified them.

The only escape valve is `event_subkind="other"` which must be used sparingly and reviewed periodically (if it becomes frequent, promote a new named subkind).





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

