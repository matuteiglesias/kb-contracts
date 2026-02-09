---
title: Error taxonomy and stop rules
sidebar_position: 34
---

# Error taxonomy and stop rules

This page standardizes how failures are classified across repos and how they propagate through the ecosystem.

The goal is not to create a long list of edge cases. The goal is to make failure handling predictable so automation and downstream consumers can make correct decisions without inspecting code.

## Scope and non scope

This page defines:

- A small, shared set of error classes
- Conditions that map real failures into those classes
- Required run record fields for each class
- Stop rules: when a pipeline must halt versus when it can emit empty outputs
- Downstream behavior rules for consuming upstream artifacts

This page does not define:

- Per project error messages or implementation details
- Bus schemas or manifest schemas in full
- Monitoring alert thresholds or paging policies

## Why an error taxonomy exists

Without a shared taxonomy:

- different repos label the same failure differently
- automation cannot reliably triage or route failures
- downstream consumers either proceed incorrectly or become overly strict
- repeated failure modes are hard to detect and eliminate

The taxonomy is designed to be small, stable, and useful for governance.

## Canonical error classes

All repos must classify errors into one of the classes below.

Use a single string value in run records:

- `INPUT_MISSING`
- `SCHEMA_MISMATCH`
- `INTEGRITY_MISMATCH`
- `STORAGE_UNAVAILABLE`
- `MODEL_FAILURE`
- `PUBLISH_FAILURE`

If a repo wants more granularity, it may add a `subtype` field, but the top level class must remain one of the six.

## Error class definitions and required run record fields

Each error must be recorded in the run record `errors` list using the error object schema defined in the run record contract.

In addition, each class has specific required details.

### INPUT_MISSING

Meaning: a required input artifact or required input manifest could not be resolved.

Typical conditions:

- required daily file does not exist
- required manifest missing
- allowed seam endpoint missing for a required upstream bus
- input exists but cannot be accessed due to filesystem permissions

Run record requirements:

- `status` must be `error` unless the entrypoint explicitly supports no input mode and documents it
- error object must include:
  - `type: INPUT_MISSING`
  - `stage` where resolution failed
  - `evidence` including the intended `path` and `manifest_path`
  - `details` containing:
    - `input_name`
    - `expected_path`
    - `expected_manifest_path`
    - `resolution` value of missing
- top level `inputs` entry must exist with:
  - `required: true`
  - `resolution: missing`

Recommended remediation:

- check upstream pipeline completion and run record
- verify seam path correctness and expected date partition
- do not fabricate empty input files upstream from the downstream pipeline

Stop rule:

- stop the line for required inputs
- optional inputs may be recorded as warnings, not errors, only if the project explicitly marks them optional

### SCHEMA_MISMATCH

Meaning: an input artifact is present but violates the declared schema contract.

Typical conditions:

- JSONL parse fails for at least one line
- required field missing in object schema
- schema version missing
- schema version present but unsupported by consumer
- field types invalid, for example timestamp not parseable

Run record requirements:

- `status` must be `error`
- error object must include:
  - `type: SCHEMA_MISMATCH`
  - `stage` of validation
  - `details` containing:
    - `artifact_family`
    - `schema_version_seen` if present
    - `schema_version_supported` list or range
    - `validation_error_summary`
    - `sample_evidence` pointers to offending lines or extracted snippets, stored as separate artifacts if needed
- top level `schema_versions.read` must include what was observed, even if invalid

Recommended remediation:

- fix the producer, not the consumer
- if the schema change is intentional:
  - add an ADR
  - bump the schema version
  - add a migration note and compatibility window
- if the schema drift is accidental:
  - revert the producer or fix normalization step
  - rerun producer to regenerate artifacts and manifest

Stop rule:

- always stop the line
- do not attempt to coerce or guess field meanings in downstream consumers

### INTEGRITY_MISMATCH

Meaning: the artifact exists and parses, but its integrity does not match its manifest or integrity rules.

Typical conditions:

- manifest hash does not match file content
- manifest count does not match records
- manifest min max timestamp does not match observed
- ordering requirements violated where ordering is declared part of hashing
- partial file written then manifest written as if complete

Run record requirements:

- `status` must be `error`
- error object must include:
  - `type: INTEGRITY_MISMATCH`
  - `stage` of integrity verification
  - `details` containing:
    - `manifest_path`
    - `observed_hash`
    - `declared_hash`
    - `observed_counts`
    - `declared_counts`
- outputs should not be written, unless the project supports a quarantined output mode and explicitly records it

Recommended remediation:

- treat as publish boundary failure
- rerun the producer with atomic promotion rules enforced
- inspect whether line ending normalization or file ordering changed

Stop rule:

- always stop the line
- downstream must not proceed if upstream manifest is missing or invalid

### STORAGE_UNAVAILABLE

Meaning: the pipeline cannot read or write required storage layers.

Typical conditions:

- persistent store directory not accessible
- sqlite database locked or corrupt
- vector store service unreachable if using a networked store
- disk full or I O errors at storage boundary

Run record requirements:

- `status` must be `error` if storage is required for the entrypoint
- error object must include:
  - `type: STORAGE_UNAVAILABLE`
  - `stage` of store access
  - `details` containing:
    - `storage_kind` example: filesystem, sqlite, chroma
    - `storage_location`
    - `operation` example: read, write, upsert
    - `retryable` true or false
- environment section should include any relevant store mode flags

Recommended remediation:

- validate storage boundary health, permissions, and free space
- for sqlite, check lock contention and process hygiene
- for vector store, confirm expected version and config, and isolate adapter drift

Stop rule:

- stop the line when storage is required
- if storage is optional and the project explicitly supports a no store mode, it may produce bus outputs and record a warning plus clear `outputs` markings

### MODEL_FAILURE

Meaning: a model driven step failed to produce required outputs or violated the model output contract.

Typical conditions:

- model call fails or times out
- output cannot be parsed into required schema
- prompt version mismatch when prompt hashes are required
- model produced outputs but selection counts do not match declared intent and no reasons recorded

Run record requirements:

- `status` must be `error` if model output is required for the pipeline stage
- error object must include:
  - `type: MODEL_FAILURE`
  - `stage` of summarization or enrichment
  - `details` containing:
    - `model_id` if known
    - `prompt_hash` if applicable
    - `selection_manifest_refs` to the inputs that defined what should be summarized
    - `retryable` true or false
- run record must still record deterministic selection counts, even if the model step failed

Recommended remediation:

- first check that selection logic was deterministic and recorded
- then check prompt hash and summarizer version
- if the failure is persistent, reduce batch size or isolate problematic items into a quarantine path, but do not silently drop

Stop rule:

- stop the line if model output is required for downstream consumers
- if model output is optional, the pipeline may produce empty summary outputs with explicit counts and reasons, but only if the contract for that pipeline allows it

### PUBLISH_FAILURE

Meaning: the pipeline attempted to publish artifacts but failed the publish contract or atomic promotion.

Typical conditions:

- staged directory created but promotion did not complete
- partial publish occurred
- manifest written but tiles or memos missing
- index update not atomic
- writer did not validate schemas before promotion

Run record requirements:

- `status` must be `error`
- error object must include:
  - `type: PUBLISH_FAILURE`
  - `stage` publish
  - `details` containing:
    - `publish_target`
    - `staging_path`
    - `intended_promoted_path`
    - `promotion_status`
- the run record must include evidence pointers to staged files, if they are preserved for debugging

Recommended remediation:

- roll back by removing staged directory or restoring previous promoted snapshot
- fix writer to enforce atomic promotion and validate before promotion
- rerun publish step only if inputs and manifests are stable and unchanged

Stop rule:

- stop the line
- do not let downstream consumers discover partially published outputs

## Stop rules: when to halt vs when to emit empty outputs

The default stance is fail fast. Empty outputs are allowed only when they are valid artifacts.

### Allowed empty outputs

A pipeline may emit empty outputs when:

- inputs are present and valid
- selection logic yields zero items and records zero explicitly
- the bus contract defines empty outputs as valid and requires a manifest with counts 0
- the run record status is `empty_success` and includes explicit reason codes

Empty outputs are not a workaround for missing inputs.

### Mandatory halt conditions

A pipeline must halt with `status: error` when any of these occurs:

- required input missing
- schema mismatch on required input
- integrity mismatch on required input
- publish contract violated for required outputs
- storage unavailable for required store operations
- model failure for required model outputs

If a pipeline halts, it still must write a run record.

## Downstream behavior rules

Downstream consumers must apply these rules without exception:

1. Do not proceed if upstream manifest is missing
2. Do not proceed if upstream manifest is invalid or does not match the artifact
3. Validate schema version before reading data
4. If schema version unsupported, fail fast and record `SCHEMA_MISMATCH`
5. Never repair upstream artifacts in place
6. Never bypass seams by reading upstream raw inputs or intermediate scratch outputs

When downstream fails due to upstream problems, the downstream run record must reference the upstream run record if available and include the upstream manifest paths used.

## Minimal compliance checklist

A repo is compliant with this page if:

- every failure is mapped to one of the six classes
- stop rules are enforced consistently
- run records contain the required details per class
- downstream consumers fail fast on missing or invalid manifests
- empty outputs are produced only when allowed by contract and manifested explicitly
