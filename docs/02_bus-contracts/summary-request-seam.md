---
title: Summary Request Seam
sidebar_position: 16
---

# Summary Request Seam

This page defines the **Summary Request seam**: a narrow, append-only request interface that other repos use to ask the Summarizer Service for work.

This seam is **not a bus**. It is an orchestration ingress that keeps producers and consumers from writing summaries directly and prevents drift in how work is requested.

## Scope

The seam covers:

- The **request schema** (`summary_request.v1`)
- The **queue storage projection** on disk (JSONL)
- **Invariants** for append, validation, and quarantine
- **Idempotency** and retry behavior
- A formal definition of **"now vs scheduled"**
- The **Flow Reference** mechanism (`flow_ref`) that selects a PromptFlow pack owned by the Summarizer Service

Out of scope:

- The Summary Bus contract and storage projection (see Summary Bus contract page)
- Event Bus or Session Bus schemas
- The internal details of LLM prompting (handled by the Summarizer Service)
- Cross-repo asset fetching (e.g., cloning repos at runtime)

## Key rule

**Repos do not write summaries.**  
Repos only write **requests** to this seam. The Summarizer Service is the only producer of Summary Bus artifacts.

## Architecture decision: Central Flow Registry

The Summarizer Service owns the canonical registry of PromptFlow packs (flows, prompt templates, schemas, and metadata).

Repos do not send prompt files, DAG yaml, or schemas.  
Repos send a **Flow Reference** (`flow_ref`) that the Summarizer resolves locally.

This reduces entropy, avoids runtime git concerns, and makes workflows reproducible and auditable.

---

## Consolidated baseline set of prompt packs

### A) Existing packs you already have (core)

1. email.triage.extract_event.calendar_event.v1

2. email.triage.extract_task.task_item.v1

3. email.gatekeeper.classify.gatekeeper_item.v1

4. web.page.categorize.webpage_categorization.v1

5. jobs.posting.screen.job_screening.v1

6. jobs.posting.screen.job_screening.v2

7. gpt.session.summarize.parsed_message.v3

8. digest.weekly.summarize.weekly_digest.v1

9. latex.section.convert.docusaurus_md.v1

10. gpt.log.annotate.obsidian_note_meta.v1

11. gpt.log.annotate.business_meta.v1

### B) “New but planned” packs (first-wave unlockers)

12. ops.run.summarize.pipeline_run.v1
13. docs.chunk_set.summarize.brief.v1
14. docs.page.generate.docusaurus_md.v1
15. crm.contacts.plan.next_actions.v1
16. opportunities.digest.rank_and_route.v1
17. writing.outline.generate.v1

### C) Existing news packs to add to baseline, using the new names

18. news.articles.parse_and_cluster.topic_clusters.v1
19. news.agenda.generate.seed_ideas.v1
20. news.seed.expand.seed_card.v1



---

# Contract: `summary_request.v1`

Each line in the queue is one JSON object matching this schema. Fields are divided into required and optional.

## Required fields

- `schema_version`  
  String. Must be: `summary_request.v1`

- `request_id`  
  String. Stable unique id for this request (UUID recommended). Must be globally unique across time.

- `created_at`  
  String timestamp in ISO 8601 (UTC recommended). Example: `2026-02-11T23:02:11Z`

- `requested_by`  
  Object describing the producer of the request:
  - `repo` string (repo or system name)
  - `component` string (module/service name within repo)
  - `version` string (semantic version if available, else `dev`)
  - `git_commit` string (optional if unknown, but recommended)

- `urgency`  
  String enum: `now` | `scheduled`  
  - `now`: request is eligible immediately
  - `scheduled`: request must not run before `not_before`

- `work`  
  Object describing what to produce:
  - `output_bus` string enum: `summary_bus`
  - `output_kind` string enum: `summary_item`
  - `summary_kind` string enum:
    - `event_summary` | `session_summary` | `chunk_set_summary` | `document_summary` | `other`
  - `summary_subkind` string (required, can be `"other"` as valve)
  - `flow_ref` object (required; selects a PromptFlow pack)
  - `params` object (optional; flow parameters; may be `{}`)

- `input`  
  Object that locates upstream data. One of the following modes must be used.

  **Mode A: explicit ids**
  - `mode` string: `ids`
  - `bus` string enum: `event_bus` | `session_bus` | `chunk_bus` | `other`
  - `ids` array of strings (ids to summarize)

  **Mode B: selection manifest pointer**
  - `mode` string: `selection_manifest`
  - `manifest_path` string (path to a selection manifest file on disk)
  - `selection_hash` string (hash recorded in that manifest)

  **Mode C: query**
  - `mode` string: `query`
  - `bus` string enum: `event_bus` | `session_bus` | `chunk_bus` | `other`
  - `query` object (strictly bounded query object; see notes below)

## Flow Reference (`flow_ref`)

`flow_ref` selects a PromptFlow pack that is registered and owned by the Summarizer Service.

### Required `flow_ref` fields

- `kind`  
  String. Must be: `registry`

- `flow_id`  
  String. Stable identifier of the flow pack, typically dot-separated and versioned, e.g.:
  - `jobs.posting.screen.job_screening.v2`
  - `gpt.session.summarize.parsed_message.v3`
  - `latex.section.convert.docusaurus_md.v1`

### Optional `flow_ref` fields

- `variant`  
  String. Optional selector for internal variants, e.g. `strict`, `fast`, `long_context`.
  If omitted, Summarizer uses the flow pack default.

### Flow registry resolution rule

The Summarizer must resolve:

- (`flow_ref.kind`, `flow_ref.flow_id`, optional `variant`)  
to a local **flow pack directory**.

If `flow_id` is unknown, the request is rejected as `rejected_unknown_flow`.

## Optional fields

- `not_before`  
  ISO 8601 timestamp. Required when `urgency=scheduled`. If provided for `now`, it is treated as a soft delay.

- `deadline`  
  ISO 8601 timestamp. If present, the Summarizer Service should prioritize meeting it but may still miss it under load.

- `idempotency_key`  
  String. If absent, Summarizer Service may derive one, but providing it is strongly recommended.

- `priority`  
  Integer 1..5 where 1 is highest priority. Default: 3.

- `trace`  
  Object with:
  - `run_id` string (caller run id if applicable)
  - `host` string
  - `user` string

- `notes`  
  String. Human readable explanation, safe to log.

---

# Allowed kinds and subkinds

## `summary_kind` (allowed)

- `event_summary`
- `session_summary`
- `chunk_set_summary`
- `document_summary`
- `other`

## `summary_subkind`

- Any string is allowed.
- `"other"` is always allowed as a valve.
- Consumers should prefer stable names (snake_case recommended), e.g.:
  - `ops_brief`
  - `crm_update`
  - `research_digest`
  - `civic_monitor`

---

# Queue storage projection

The canonical queue is an append-only JSONL file:

- Path (recommended): `summarizer_service/run/queue.jsonl`
- Format: one JSON object per line, UTF-8, newline-delimited
- Append-only: callers must never rewrite or delete lines

## Queue invariants

1) **Atomic append**  
Writers must append lines using an atomic append strategy (single write call, or OS-level append). Partial lines are invalid and must be quarantined by the Summarizer Service.

2) **One object per line**  
No multi-line JSON. No trailing comments.

3) **Validation on read**  
Summarizer validates every line against `summary_request.v1`. Invalid lines go to quarantine and do not block the drain.

4) **Quarantine, do not crash**  
Invalid lines must not crash the Summarizer. They are moved aside with a reason.

5) **No direct Summary Bus writes by callers**  
The queue is the only interface for callers.

## Suggested companion files (implementation detail)

These are not contractually required but are recommended for ops:

- `summarizer_service/run/quarantine.jsonl`  
  Invalid request lines, preserved with parse/validation errors.

- `summarizer_service/run/ack.jsonl`  
  Acks emitted by the Summarizer indicating acceptance, completion, or failure.

- `summarizer_service/logs/`  
  Service logs.

---

# Flow Registry: storage projection and invariants

The Summarizer Service owns a dataset that is the **functional ground truth** for:

- Flow packs (PromptFlow folders)
- Prompt templates inside those packs
- Output schemas used by those packs

## Canonical registry dataset

Recommended canonical dataset path:

- `summarizer_service/flow_registry/registry.flow_packs.v1.jsonl`

Each line is one flow pack record.

### `flow_pack_record.v1` (recommended fields)

- `schema_version`: `flow_pack_record.v1`
- `flow_id`: string (must match request `flow_ref.flow_id`)
- `variant`: string or null
- `status`: enum `active` | `deprecated` | `disabled`
- `pack_dir`: string (absolute or service-relative path to the PromptFlow pack folder)
- `entry_dag`: string (e.g. `flow.dag.yaml`)
- `declared_outputs`:
  - `output_schema_id` string or null
  - `output_schema_path` string or null
- `io_contract`:
  - `inputs` array of `{name, type, required}`
  - `outputs` array of `{name, type}`
- `metadata`:
  - `domain` (optional)
  - `prompt_kind` (optional)
  - `notes` (optional)
- `integrity`:
  - `pack_hash` (sha256 over normalized pack contents; recommended)
  - `updated_at` ISO 8601

### Registry invariants

1) **Flow ids are stable**  
`flow_id` is immutable once published. If behavior changes materially, bump the version suffix (e.g. `v1` -> `v2`).

2) **Requests resolve only through the registry dataset**  
The service must not “guess” by scanning directory trees. The dataset is authoritative.

3) **Pack dir is self-contained**  
The pack directory must include everything needed to run (dag yaml, prompts, schemas if used). No hidden dependency on caller repos.

4) **Disabled flows are not runnable**  
If `status=disabled`, requests must be rejected.

5) **Deprecated flows are runnable but flagged**  
If `status=deprecated`, Summarizer may run but must emit ack warnings.

---

# Idempotency and retry semantics

## Idempotency goal

**Retries must not create duplicate summaries.**

Callers SHOULD provide `idempotency_key`.  
If not provided, Summarizer SHOULD derive:

- hash of:
  - canonicalized input locator (ids or selection manifest pointer + selection_hash)
  - `work.summary_kind`
  - `work.summary_subkind`
  - `work.flow_ref.flow_id` (and `variant` if present)
  - canonicalized `work.params`

## Required Summarizer behavior

- For each request, Summarizer computes an **effective idempotency key**.
- If the Summarizer has already produced an output for that key, it must:
  - skip work and emit an ack indicating `duplicate`
  - or re-emit the same output pointer (but not produce a second summary item)

## Retry rules

- Callers MAY append the same request again (same request_id or different request_id) as long as idempotency_key is unchanged.
- Summarizer failures must be surfaced as an ack record. Callers should not interpret “no output” as success.

## Failure taxonomy (seam-level)

Summarizer should classify request outcomes at minimum:

- `accepted`
- `completed`
- `rejected_invalid_schema`
- `rejected_unknown_flow`
- `rejected_invalid_input`
- `failed_transient`
- `failed_permanent`
- `duplicate`

---

# Formal definition: "now" vs "scheduled"

- `urgency=now` means: the request is eligible immediately.
  - If `not_before` exists, Summarizer may treat it as a soft delay, but it may still run earlier if allowed by policy.

- `urgency=scheduled` means: the request must not run before `not_before`.
  - `not_before` is required.
  - Summarizer must enforce this constraint.

---

# Notes on query input mode

`input.mode=query` is intentionally constrained to prevent a second “mini language” from growing in the seam.

Rules:

- Query objects must be shallow and versioned.
- Prefer selection manifests for anything complex.
- If query mode becomes necessary, define `summary_request_query.v1` separately and keep it minimal.

---

# Example requests

## Example A: urgent summary for explicit ids

```json
{
  "schema_version":"summary_request.v1",
  "request_id":"3f1a50c6-61d4-4f1d-8a42-7f5a6a6d2f73",
  "created_at":"2026-02-11T23:02:11Z",
  "requested_by":{"repo":"job_pipeline","component":"scorer","version":"0.7.2","git_commit":"abc1234"},
  "urgency":"now",
  "work":{
    "output_bus":"summary_bus",
    "output_kind":"summary_item",
    "summary_kind":"event_summary",
    "summary_subkind":"ops_brief",
    "flow_ref":{"kind":"registry","flow_id":"gpt.session.summarize.parsed_message.v3"},
    "params":{"max_tokens":350}
  },
  "input":{"mode":"ids","bus":"event_bus","ids":["evt_01HZZ...","evt_01HZY..."]},
  "idempotency_key":"b1b6d6a4b9c2d8e0"
}
```

## Example B: scheduled summary from a selection manifest

```json
{
  "schema_version":"summary_request.v1",
  "request_id":"a2bdbf8e-6e36-4a03-ae59-319d8f3a7b2b",
  "created_at":"2026-02-11T23:05:00Z",
  "requested_by":{"repo":"crm_layer","component":"weekly_digest","version":"1.2.0","git_commit":"def5678"},
  "urgency":"scheduled",
  "not_before":"2026-02-12T09:00:00Z",
  "work":{
    "output_bus":"summary_bus",
    "output_kind":"summary_item",
    "summary_kind":"session_summary",
    "summary_subkind":"crm_update",
    "flow_ref":{"kind":"registry","flow_id":"digest.weekly.summarize.weekly_digest.v1"},
    "params":{}
  },
  "input":{"mode":"selection_manifest","manifest_path":"/home/matias/buses/selection_manifests/2026-02-11.crm-weekly.json","selection_hash":"sha256:9d1c..."},
  "idempotency_key":"9d6f8b3b0c6a"
}
```

---

# Operational responsibilities

## Caller responsibilities

* Emit valid `summary_request.v1` objects to the queue
* Use stable `summary_kind` and `summary_subkind`
* Select a stable `flow_ref.flow_id` (registry-owned)
* Provide `idempotency_key` when possible
* Use `scheduled` for non-urgent requests, with `not_before`

## Summarizer responsibilities

* Validate, quarantine, and continue (never block on one bad line)
* Enforce `scheduled/not_before`
* Resolve `flow_ref` only via the flow registry dataset (no guessing)
* Guarantee idempotency
* Write Summary Bus artifacts and manifests
* Emit acknowledgements for observability

