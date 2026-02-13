---
title: Observability indexes contract
sidebar_position: 35
---

## Purpose

Define the UI <-> backend interface for the minimum observability layer.

The UI is read-only and must be able to answer:

- what exists
- what ran
- what broke
- what is stale

The UI reads only compacted index files. The UI must never crawl directory trees under BUS_HOME or project repos.

This contract freezes:
- the canonical UI-facing index files
- the single-writer compaction rule
- rebuild and integrity rules

## Scope

This page defines the contract for **UI-facing indexes**.

It does not define:
- bus schemas (see bus contracts)
- summarizer request schemas (see summary request seam)
- pipeline internals

## Definitions

- **BUS_HOME**: Ground truth store for buses (example: `~/Documents/buses`).
- **UI index**: a compacted, append-only file intended for the UI only.
- **Aggregator**: the single writer that compacts ground truth into UI indexes.
- **Ground truth**: bus daily JSONL plus matching daily manifest JSON.

BUS_HOME rules already in force:
- producers append to daily JSONL in each bus
- every daily JSONL must have a matching daily manifest JSON
- consumers read manifests and index files, not directory trees guessed by convention

## Non negotiables

1. Read-only UI
2. UI reads only UI indexes
3. Single writer compaction
4. Rebuildable truth: UI indexes can be regenerated from BUS_HOME

## Canonical UI index set (v0.1)

All files live under the UI repo and are served as static files.

Recommended path (works with Next.js public assets):
- `obs_ui/public/data/`

### 1) projects.csv

Path:
- `obs_ui/public/data/projects.csv`

Source:
- exported Control Tower sheet (or any canonical projects registry export)

Notes:
- this file can be replaced wholesale
- it is the only UI index not derived from BUS_HOME

Minimum columns expected by UI:
- `project_id`
- `Title`
- `domain_family`
- `primary_role`
- `status`
- `phase1_corpora_consumed`
- `last_update_ts` (optional but recommended)
- `last_agg_status` (optional)

UI must tolerate missing columns and blanks.

### 2) runs.jsonl

Path:
- `obs_ui/public/data/runs.jsonl`

Source of truth:
- BUS_HOME run records bus daily files, not per-project directories

Canonical ground truth location:
- `BUS_HOME/run_records/daily/YYYY-MM-DD.jsonl`
- `BUS_HOME/run_records/daily/YYYY-MM-DD.manifest.json`

Derivation:
- aggregator compacts new run record lines into `runs.jsonl`
- aggregator is the only writer to `runs.jsonl`

Minimum run index schema (ui_run_index.v1)

Each line is one JSON object:

- `run_id` (string)
- `project_id` (string)
- `operator` (string)
- `started_at` (ISO-8601 string)
- `ended_at` (ISO-8601 string or null)
- `status` (OK | WARN | FAIL)
- `error_code` (string or null)
- `inputs_count` (int or null)
- `outputs_count` (int or null)
- `manifest_path` (string or null)
- `log_path` (string or null)

Optional fields allowed:
- `host` (string)
- `duration_ms` (int)
- `tags` (list)
- `schema_version` (string)
- `trace` (object)

UI behavior:
- UI may parse only the minimum schema above
- UI must ignore extra fields
- UI must display a raw JSON inspector for a row

### 3) corpora_daily.jsonl

Path:
- `obs_ui/public/data/corpora_daily.jsonl`

Source of truth:
- derived from corpus delta events emitted into BUS_HOME

This system uses derived daily totals. Projects must not write directly to corpora_daily.jsonl.

Two supported ground truth options:

Option A (preferred): a dedicated corpus deltas bus
- `BUS_HOME/corpus_deltas/daily/YYYY-MM-DD.jsonl`
- `BUS_HOME/corpus_deltas/daily/YYYY-MM-DD.manifest.json`

Option B (bootstrap): corpus deltas embedded inside run records
- run record includes a field `corpus_deltas: [ ... ]`
- aggregator extracts and aggregates them

Pick one and freeze it as canonical. Until then, the aggregator may support both.

Corpus delta schema (corpus_delta.v1), one line per delta event:

- `ts` (ISO-8601 string)
- `project_id` (string)
- `corpus` (string, allowlist)
- `kind` (ingest | summarize | publish)
- `count` (int, >= 0)
- `backlog_delta` (int, optional)

Derived daily record schema (corpus_daily.v1), one line per corpus per day:

- `date` (YYYY-MM-DD)
- `corpus` (string)
- `ingested` (int)
- `summarized` (int)
- `published` (int, optional)
- `backlog` (int)
- `last_ingest_ts` (ISO string or null)
- `last_summary_ts` (ISO string or null)
- `cap` (int, optional)

UI behavior:
- UI must group by corpus
- UI must show the latest record per corpus
- UI must show backlog and last timestamps if present

## Single writer compaction rule

Only the aggregator process is allowed to write to:

- `obs_ui/public/data/runs.jsonl`
- `obs_ui/public/data/corpora_daily.jsonl`

No project repo may append directly to UI indexes.

Rationale:
- prevents multi-writer corruption
- makes rebuild deterministic
- keeps UI honest

## Aggregator responsibilities (contract)

The aggregator is a small process that runs on a schedule or manually.

It must:

1) Discover new ground truth
- scans BUS_HOME daily files for run_records (and corpus_deltas if present)
- respects daily manifests when possible

2) Append safely
- appends complete JSON lines only
- never writes partial lines
- maintains a cursor / checkpoint so it does not re-ingest already compacted lines

3) Be rebuildable
- must support a rebuild mode that regenerates UI indexes from BUS_HOME

4) Produce a refresh marker
- writes `obs_ui/public/data/refresh.json`
  - `{"refreshed_at":"<ISO-8601>", "sources":{...}}`

The UI reads refresh.json and displays "Last refreshed at".

### Cursor state

Aggregator keeps its own state under the UI repo:

- `obs_ui/.state/`

Minimum required state files:
- `runs.cursor.json` (last ingested day and byte offset or last seen hash)
- `corpora.cursor.json` (same for corpus deltas)

State must be local to the aggregator. Projects never touch it.

## What projects are required to do

Projects are treated as untrusted producers. Therefore the mandatory contract is minimal.

Mandatory (for appearing in Runs tab):
- emit a run record into BUS_HOME run_records bus

Optional (for appearing in Corpora tab):
- emit corpus delta events into BUS_HOME corpus deltas bus (or embed inside run record if using bootstrap option)

Best practice:
- run record emission must happen even on failure
- prefer a wrapper runner so projects cannot forget to emit

### Recommended pattern: wrapper runner

A shared runner script or library:
- creates run_id
- captures start and end timestamps
- captures exit status
- emits run record into run_records bus in a finally block

This is the "stop the line" guarantee.

## What summarizer_service must do

summarizer_service is both:
- a producer of summaries into summary_bus
- a producer of run telemetry into run_records bus

Additionally, summarizer_service owns a request seam log set:
- queue.jsonl
- ack.jsonl
- quarantine.jsonl
- idempotency.jsonl

These seam logs are ground truth for request processing, but they are not UI indexes in v0.1.

In v0.2, the UI may add a "Requests" tab that reads a compacted index derived from these seam logs.

## Integrity rules

UI indexes are append-only logs of JSON objects.

Invariants:
- one JSON object per line
- UTF-8
- no trailing junk after JSON
- no partial writes

If a ground truth line is malformed:
- aggregator must quarantine it into `obs_ui/.state/quarantine.jsonl`
- aggregator must continue (one bad line never blocks)

## Rebuild mode

Rebuild is the safety valve.

Rebuild mode:
- deletes or archives current UI indexes
- scans BUS_HOME from the beginning
- regenerates:
  - runs.jsonl
  - corpora_daily.jsonl
  - refresh.json

The rebuild output must be deterministic given BUS_HOME contents.

## UI contract: allowed reads only

The Next.js UI is allowed to read only:

- `/data/projects.csv`
- `/data/runs.jsonl`
- `/data/corpora_daily.jsonl`
- `/data/refresh.json`

UI must not read:
- BUS_HOME directly
- project directories
- daily bus directories

If the UI needs more detail for a run, it can display manifest_path and log_path as strings, but it does not follow those paths in v0.1.

## Non goals (v0.1)

- no artifact browsing across buses
- no summary browsing
- no full text search
- no write actions
- no job trigger buttons
