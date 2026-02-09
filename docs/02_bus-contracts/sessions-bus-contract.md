---
title: Sessions Bus contract
sidebar_position: 11
---

# Sessions Bus contract

Contract for session objects and cluster outputs.

## Purpose

The Sessions Bus is the canonical stream of session objects derived from Event Bus events, plus the cluster outputs produced from those sessions.

This page defines the session object schema, the cluster output schema, on-disk layout, manifests, invariants, compatibility rules, smoke test expectations, and failure modes.

## What this is

- Sessions are time window groupings of events.
- Every session contains explicit pointers back to the source `event_id` values.
- Clusters are assignments over sessions (and optionally over events through session linkage).

## What this is not

- This is not a place to re-parse raw ChatGPT exports or re-compute event ingestion.
- This is not a summarization or enrichment service.
- This is not a vector store contract.
- This is not a UI export format.

## Bus endpoints

### Sessions daily files

Path pattern:

- `sessions/daily/YYYY-MM-DD.sessions.jsonl`

Rules:

- One JSON object per line
- UTF-8
- Deterministic ordering is recommended but not required
- Must exist even if empty

### Sessions daily manifest files

Path pattern:

- `sessions/manifest/YYYY-MM-DD.sessions.manifest.json`

Must exist even if the sessions file is empty.

### Clusters daily files

Path pattern:

- `clusters/daily/YYYY-MM-DD.clusters.jsonl` or `clusters/daily/YYYY-MM-DD.clusters.parquet`

Pick one as canonical and keep it stable. If both exist, the manifest must declare which is canonical.

Rules:

- Must exist even if empty

### Clusters daily manifest files

Path pattern:

- `clusters/manifest/YYYY-MM-DD.clusters.manifest.json`

Must exist even if the clusters file is empty.

## Canonical session schema

### Required fields

- `schema_version`  
  String. Example: `session.v1`

- `session_id`  
  String. Stable, deterministic for a given input set and window semantics.

- `day`  
  String. `YYYY-MM-DD`. The day partition for this output file.

- `window`  
  Object describing how the session window was formed.

Required keys inside `window`:

- `window_type`  
  String. Example: `gap_based` or `fixed`

- `start_ts_ms`  
  Integer.

- `end_ts_ms`  
  Integer.

- `timezone`  
  String. IANA timezone name. Example: `America/New_York`

- `event_ids`  
  Array of strings. Each must be an `event_id` from the Event Bus.

- `event_count`  
  Integer. Must equal `len(event_ids)`.

- `source`  
  Object. Provenance of the sessionization process.

Minimum required keys inside `source`:

- `input_manifest_day`  
  String. `YYYY-MM-DD` for the Event Bus manifest consumed.

- `input_manifest_sha256`  
 String. Integrity anchor for the consumed Event Bus daily file.

- `sessionizer_version`  
  String. Producer version marker or git commit.

### Optional fields

Optional fields may appear and consumers must ignore unknown fields.

Common examples:

- `conversation_ids` array
- `title_candidates` array
- `labels` array
- `suc_id` string
- `workspace` string
- `notes` string
- `metrics` object such as token counts, duration, etc.

### Evidence pointer fields

Sessions must be traceable back to concrete evidence. The minimal evidence is `event_ids`, but evidence pointers allow stable cross-artifact linking.

Recommended optional evidence fields:

- `evidence` object with:
  - `eventbus_daily_path` string
  - `eventbus_manifest_path` string
  - `eventbus_slice` object describing line offsets if you maintain them

## Session id derivation

Goal: `session_id` must be stable when inputs and window semantics are unchanged.

Requirements:

- Deterministic: derived from the ordered set of `event_id` values plus window semantics.
- Include the `day` and `window_type` in the derivation inputs.
- Include `start_ts_ms` and `end_ts_ms` in the derivation inputs.
- Use a cryptographic hash of a canonical serialization of these parts.

Prohibited:

- Random UUID generation
- IDs that depend on run time or file iteration order

## Window semantics

Window semantics must be explicit so downstream consumers never guess.

The `window.window_type` must describe how sessions are created, at least at a coarse level.

Examples:

- `gap_based` with a fixed inactivity threshold
- `fixed` with a defined duration
- `conversation_based` if grouping by conversation id

If the algorithm changes in a way that alters session membership, you must:

- Version bump the session schema or the sessionizer version
- Write an ADR
- Include a minimal migration note describing the impact

## Canonical cluster schema

Clusters may be produced per day, but cluster identity must be stable within a defined scope.

### Required fields

- `schema_version`  
  String. Example: `cluster.v1`

- `cluster_id`  
  String. Stable identifier within the declared clustering scope.

- `scope`  
  Object describing what this clustering run covers.

Required keys inside `scope`:

- `scope_type`  
  String. Example: `daily` or `rolling_window`

- `day`  
  String. `YYYY-MM-DD` if scope_type is daily

- `input_sessions_manifest_sha256`  
  String. Integrity anchor for the consumed sessions output

- `members`  
  Array of objects each containing:
  - `session_id` string
  - `weight` number or integer, optional but allowed

- `member_count`  
  Integer. Must equal `len(members)`.

- `algorithm`  
  Object describing clustering algorithm identity.

Minimum required keys inside `algorithm`:

- `name` string
- `version` string
- `params_hash` string

### Optional fields

- `label` string
- `keywords` array
- `centroid_ref` object
- `metrics` object
- `status` string

## Stable cluster id behavior

Clusters are more fragile than sessions because reclustering can reassign memberships.

Rules:

- Cluster ids must be stable within the same inputs and algorithm configuration.
- If the algorithm or parameters change, cluster ids may change and must be treated as a new clustering version.
- The cluster record must carry `algorithm.params_hash` so downstream can detect drift.

Recommended derivation:

- `cluster_id = hash(scope + sorted(session_ids) + algorithm identity)`

## Endpoints and manifests

### Sessions manifest contract

Minimum required fields for `YYYY-MM-DD.sessions.manifest.json`:

- `schema_version` string, example: `sessions_manifest.v1`
- `bus_schema_version` string, example: `session.v1`
- `day` string
- `sessions_path` string
- `counts` object:
  - `sessions_total` integer
  - `events_total_referenced` integer
- `integrity` object:
  - `sha256` string
  - `bytes` integer
- `producer` object, recommended:
  - repo, version, git commit

### Clusters manifest contract

Minimum required fields for `YYYY-MM-DD.clusters.manifest.json`:

- `schema_version` string, example: `clusters_manifest.v1`
- `bus_schema_version` string, example: `cluster.v1`
- `day` string
- `clusters_path` string
- `counts` object:
  - `clusters_total` integer
  - `sessions_total_referenced` integer
- `integrity` object:
  - `sha256` string for JSONL, or a declared checksum strategy for parquet
  - `bytes` integer
- `producer` object, recommended

## Invariants

These rules are mandatory. Violations must trigger stop-the-line behavior.

- Every `session.event_ids` entry must reference an existing Event Bus `event_id` for the consumed input day set.
- `session_id` must be stable when the same event ids and window semantics are used.
- Clusters must reference only existing `session_id` values from the sessions outputs in scope.
- Empty outputs are valid:
  - empty sessions file exists
  - empty clusters file exists
  - both manifests exist and reflect zero counts
- Schema version must be present on every record.

## Compatibility rules

- Consumers must ignore unknown optional fields.
- Adding optional fields does not require a schema bump if existing semantics do not change.
- Changes to required fields, window semantics meaning, or id derivation require:
  - ADR
  - Schema version bump
  - Minimal migration note

Backward compatibility window:

- Consumers must support at least the latest and previous schema versions, unless an ADR states otherwise.

## Smoke test

Purpose: prove minimal compliance with this contract, including linkage to upstream Event Bus outputs.

Minimal command:

- A repo-specific smoke command is acceptable, but it must validate:
  - It can read at least one Event Bus day plus manifest
  - It emits sessions daily file and sessions manifest
  - It emits clusters daily file and clusters manifest
  - JSONL parsing for sessions and clusters if JSONL is used
  - Session event ids exist in the input event set
  - Session ids are unique within the day file
  - Cluster members reference existing session ids

Acceptance criteria:

- All expected output files exist
- All manifests exist
- Manifest counts match parsed counts
- No linkage violations

## Error taxonomy mapping

All failures must be recorded in run records with a clear error code. These are recommended codes for the Sessions Bus.

### Input missing

- `MISSING_EVENTBUS_DAILY_FILE`
- `MISSING_EVENTBUS_MANIFEST`
- `MISSING_EVENTBUS_RANGE` (when required day range is unavailable)

### Input invalid

- `EVENTBUS_SCHEMA_MISMATCH`
- `EVENTBUS_MALFORMED_JSONL`
- `EVENTBUS_MANIFEST_MISMATCH`

### Session output violations

- `SESSIONS_MALFORMED_JSONL`
- `SESSIONS_SCHEMA_MISMATCH`
- `SESSIONS_DUPLICATE_SESSION_ID`
- `SESSIONS_REFERENCE_UNKNOWN_EVENT_ID`
- `SESSIONS_MANIFEST_MISMATCH`

### Cluster output violations

- `CLUSTERS_SCHEMA_MISMATCH`
- `CLUSTERS_REFERENCE_UNKNOWN_SESSION_ID`
- `CLUSTERS_MANIFEST_MISMATCH`

### Upstream incomplete

Use when upstream is present but semantically incomplete, such as missing required event fields that block sessionization.

- `UPSTREAM_INCOMPLETE_REQUIRED_FIELDS`

## Failure modes and required behavior

Stop-the-line means:

- Fail fast
- Write a run record with error taxonomy
- Do not silently degrade
- Do not emit partial outputs without manifest integrity

Common failure modes:

- Missing event day file or manifest
- Event schema mismatch
- Sessions reference unknown event ids
- Cluster references unknown session ids
- Manifest mismatches on outputs
