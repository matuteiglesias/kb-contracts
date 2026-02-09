---
title: Run record contract
sidebar_position: 33
---

# Run record contract

Run records unify observability across the ecosystem and let automation reason over pipelines consistently.

A run record is the authoritative audit trail for a single execution of a pipeline entrypoint. It is required even when the run produces empty outputs, produces no outputs, or fails early.

## Scope and non scope

This page defines:

- The run record schema and required fields
- The error object schema and required error metadata
- Required counters and per stage accounting
- Status semantics and stop the line rules
- Traceability linkage to manifests and evidence

This page does not define:

- How to implement logging frameworks
- Per bus object schemas (see bus contract pages)
- Per project internals or CLI argument conventions

## Why run records exist

Run records are the single artifact that answers, after the fact:

- What ran, when, and with what configuration
- What inputs were used and what outputs were produced
- What schema versions were read and written
- What was skipped and why
- What failed, where, and with what evidence
- Whether downstream consumers are allowed to proceed

Downstream systems and agents must treat run records as first class artifacts. If a pipeline run did not emit a run record, the run is considered invalid.

## Location and naming

Each project must define a canonical run record directory. The directory is part of the project registry.

Rules:

- Every run produces exactly one run record file
- The run record filename is derived from the run id
- Run records are append only as a set. A run record file is immutable after promotion

Recommended pattern:

- `artifacts/run_records/<run_id>.run_record.json`

Do not scatter run records across ad hoc folders.

## Run record schema

### Required top level fields

A run record must include:

- `run_record_version`
  - version of the run record schema
- `run_id`
  - globally unique id for this run within the project
- `created_at`
  - UTC ISO 8601 timestamp for record creation
- `completed_at`
  - UTC ISO 8601 timestamp for run completion, may be null if the process crashed before finalization
- `status`
  - one of: success, empty_success, partial_success, error
- `project`
  - `project_id`
  - `project_name`
  - `repo_path` optional
- `entrypoint`
  - stable entrypoint identifier, not a freeform description
  - may include `command` as executed, and a normalized `entrypoint_name`
- `stages`
  - an ordered list of stage records
- `inputs`
  - structured references to input artifacts and manifests
- `outputs`
  - structured references to output artifacts and manifests
- `schema_versions`
  - `read`
  - `written`
- `counters`
  - required counters for the run, plus per stage breakdown
- `warnings`
  - list of warning objects
- `errors`
  - list of error objects
- `environment`
  - minimal environment metadata

### Stage record schema

A stage record describes one pipeline stage boundary. Stages should match the ecosystem stage model used elsewhere.

Each stage record must include:

- `stage`
  - name from the standard stage set used across the ecosystem
- `started_at`
- `completed_at`
- `status`
  - success, skipped, error
- `counters`
  - stage scoped counters
- `warnings`
  - warning ids or embedded warning objects
- `errors`
  - error ids or embedded error objects
- `evidence`
  - pointers to logs, files, or artifacts relevant to the stage

Stages must be listed in the order they were executed.

### Inputs section

Inputs must be structured and traceable.

Each input entry must include:

- `name`
  - logical name, example: event bus daily, sessions bus daily, chunk bus canonical
- `artifact_family`
- `path`
  - path to the input data file or directory root
- `manifest_path`
  - path to the input manifest
- `data_hash`
  - hash of the input data as declared in the input manifest
- `schema_version`
  - schema version emitted by the input
- `required`
  - true or false
- `resolution`
  - present, missing, or substituted

If a required input is missing, the run status must become error unless the entrypoint explicitly defines an allowed no input mode and records it as empty_success with reason codes.

### Outputs section

Outputs must be declared with the same discipline as inputs.

Each output entry must include:

- `name`
- `artifact_family`
- `path`
- `manifest_path`
- `data_hash`
- `schema_version`
- `promotion_status`
  - staged, promoted, or not_written
- `required`
  - true or false

A run that writes outputs but fails to promote them is a failure unless the project defines a safe rollback behavior and records it.

### Schema versions section

A run record must declare:

- `schema_versions.read`
  - map from artifact family to schema versions seen
- `schema_versions.written`
  - map from artifact family to schema versions emitted

If multiple inputs are read within a family, include the set of versions or list them per input.

### Environment section

Environment metadata must be sufficient to debug or reproduce.

Required fields:

- `hostname` optional
- `os` and `arch`
- `python_version` if relevant
- `toolchain`
  - name and version, example: python, node, go
- `git`
  - `commit` if available
  - `dirty` true or false if available
- `dependency_lock_hash` optional but recommended
- `config_fingerprint`
  - a hash of effective config inputs that influence behavior

Do not dump secrets. Environment metadata must be safe to store.

## Error object schema

Errors are structured objects. They must support automation and remediation.

Each error object must include:

- `error_id`
  - stable id within the run, can be derived from stable_id of key fields
- `type`
  - a controlled taxonomy value, not a freeform string
- `stage`
  - the stage where the error occurred
- `message`
  - short human readable summary
- `details`
  - optional structured payload, safe to store
- `exception`
  - optional
  - `class`
  - `trace` optional and may be truncated
- `evidence`
  - list of evidence pointers
- `remediation_hint`
  - short, actionable hint
- `severity`
  - error or fatal
- `recorded_at`
  - UTC ISO 8601

### Evidence pointers

Evidence pointers link to durable artifacts, not ephemeral stdout.

Each pointer should include:

- `kind`
  - file, manifest, log, artifact, url
- `path` or `ref`
- `note` optional

If traces are stored, they should be stored as a separate artifact and referenced by pointer.

## Warning object schema

Warnings are like errors but do not necessarily stop the line.

Each warning must include:

- `warning_id`
- `type`
- `stage`
- `message`
- `evidence` optional
- `recorded_at`

Warnings should be used for recoverable issues like optional inputs missing, minor schema drift handled, or non fatal validation downgrades.

## Required counters

Every run record must include these counters at top level, plus per stage where applicable:

- `files_seen`
- `files_processed`
- `files_skipped`
- `records_seen`
- `records_processed`
- `records_skipped`
- `artifacts_written`
- `errors_count`
- `warnings_count`

Projects may add additional counters, but they must not remove or rename the required counters without an ADR and run_record_version bump.

### Counter semantics

Rules:

- Seen means discovered as candidate input
- Processed means actually consumed and transformed
- Skipped means intentionally not processed, with a reason code recorded somewhere in the run record

If records are not a concept in a project, set record counters to 0 and explain the stance in the project registry.

## Stop the line semantics

Stop the line means contract violations must not propagate silently.

### Status definitions

- `success`
  - required outputs produced, promoted, and valid
- `empty_success`
  - run completed successfully, produced valid empty outputs, with manifests and run record
- `partial_success`
  - run completed and produced some outputs, but one or more optional outputs failed, or non critical portions were skipped
  - partial success is allowed only when the project explicitly declares which outputs are optional and the run record records the reason codes
- `error`
  - required input missing, required output missing, schema validation failed, manifest mismatch, integrity error, or atomic promotion violated

### Required rule

A partial run must still produce a run record.

If a run cannot write any bus outputs due to failure, it must still write a run record that includes:

- the inputs it attempted to resolve
- the stage and error details
- the remediation hint

### Contract violation rule

If an output violates a contract, downstream consumers must:

- fail fast
- write their own run record with a schema mismatch or integrity error
- not attempt to guess or auto repair upstream outputs

## Linkage and traceability

A run record must be traceable end to end.

Rules:

- Every input reference must include the input manifest path and hash
- Every output reference must include the output manifest path and hash
- The run record must include the set of input manifests referenced, even if no outputs were produced
- If an output depends on multiple inputs, record them explicitly

This is what enables replay and reproducibility without reading implementation code.

## Validation requirements

Producers must validate the run record before promotion.

Consumers and orchestration layers must treat run record validation failures as errors.

## Change control

Any change to:

- top level required fields
- error taxonomy values
- required counters
- stop the line status semantics
requires:

- ADR
- run_record_version bump
- a short migration note describing how agents and consumers handle mixed versions
