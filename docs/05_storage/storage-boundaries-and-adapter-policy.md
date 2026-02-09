---
title: Storage boundaries and adapter policy
sidebar_position: 60
---

# Storage boundaries and adapter policy

This page freezes the storage rules that keep the ecosystem stable over time.

Storage is a source of hidden coupling. Version drift, schema drift, and inconsistent persistence patterns create failures that are expensive to diagnose and easy to repeat. The goal of this policy is to define a small set of **allowed storage types** and enforce a strict **adapter boundary** so that each project can evolve without re learning the same storage failures.

## Scope and non scope

This page defines:

- Allowed storage types and what each is for
- The adapter boundary rule and what is forbidden
- Strategy for version drift and state incompatibility
- Idempotency patterns that prevent reprocessing and storage churn
- Behavioral constraints that all repos must follow

This page does not define:

- Code implementations
- Vendor specific documentation
- Deployment guides
- Performance tuning recipes

## Allowed storage types

Projects may use only these storage families.

### 1) Local filesystem artifacts

Definition: files and directories written as pipeline outputs or intermediate artifacts, stored on disk.

Allowed uses:

- bus endpoints and their manifests
- published artifacts and their indexes
- run records
- staged outputs prior to atomic promotion
- small indexes that enable browsing or linking

Required constraints:

- all bus artifacts must have manifests
- all publish outputs must be promoted atomically
- files must be readable without runtime services

### 2) SQLite caches

Definition: local SQLite databases used for idempotency, caching, dedupe, and small metadata indexes.

Allowed uses:

- processed_files tracking
- embedding cache
- dedupe index
- lightweight query accelerators for development and QA

Required constraints:

- SQLite is a cache, not the canonical store for bus artifacts
- SQLite state must be reconstructible from canonical filesystem artifacts or raw source inputs as declared by contracts
- schema version must be recorded and validated by the adapter boundary

### 3) Vector store

Definition: a store for embeddings and vector search, backed by a persistent directory or service.

Allowed uses:

- embedding upserts keyed by stable ids
- retrieval operations that are explicitly downstream of chunk or unit materialization
- optional acceleration for search and ranking

Required constraints:

- the canonical source of truth remains the bus artifacts on disk
- vector store state must be rebuildable from canonical chunks or units
- adapters must handle version compatibility and state validation

## Storage boundary policy

This policy defines a hard boundary between project logic and storage implementations.

### Adapter boundary is mandatory

Rule:

- Projects must not import or depend on vector store libraries directly in core pipeline code.
- All interactions with vector store and cache schemas must go through an adapter module owned by the ecosystem.

Meaning:

- pipeline logic speaks in terms of canonical ids, canonical metadata, and declared contracts
- adapters translate that into storage specific calls and state management

### Direct storage imports are forbidden in pipeline core

Forbidden examples:

- a pipeline module that imports Chroma client classes directly
- a pipeline module that writes directly into vector store internals
- project code that assumes a vector store directory layout
- downstream consumers that read cache DBs from upstream repos

Allowed exceptions:

- a dedicated adapter module may import the vendor library
- tests that validate adapter behavior may import vendor library
- experimental scratchpads may import vendor libs but must not become upstream dependencies

## Version drift strategy

Vector stores and their clients drift. The ecosystem stance is to treat this as normal and contain it.

### Supported modes

The ecosystem supports a small number of explicitly declared modes for vector store usage. Each adapter must declare:

- which mode it is using
- what compatibility assumptions exist
- how state is validated

Supported modes must be listed by the adapter and referenced by projects. Projects do not choose ad hoc connection styles.

### Detecting incompatible state

The adapter must detect incompatible state before writes.

Minimum checks:

- the store directory exists and is readable
- the expected schema or metadata markers exist
- collection naming rules match the current contract
- schema version markers are present and supported

If incompatible, the adapter must:

- stop the line
- record a storage incompatible error in the run record
- provide a remediation hint pointing to the migration stance

### Migration stance

Migrations must be explicit and controlled.

Rules:

- do not attempt silent in place migrations during a normal pipeline run
- migration operations must be invoked by an explicit migration entrypoint
- migration must produce a migration log artifact and a run record
- migration must be reversible or have a rollback plan documented in an ADR

If a migration cannot be safely automated, the stance must be:

- fail fast and declare manual steps in a migration note

## Idempotency pattern

Idempotency is mandatory for storage related operations.

The canonical pattern is a processed_files style ledger.

### processed_files concept

Definition:

- a table or index that records which source items have been processed into which artifacts under which version conditions

The minimal required fields include:

- source identifier and a stable checksum or fingerprint
- processing timestamp
- pipeline version and schema versions used
- output artifact identifiers
- status field, including success and failure states

### Requirements for avoiding rework

Rules:

- re running a pipeline with the same inputs must not duplicate stored items
- adapters must guard against duplicate upserts by stable id
- if inputs changed, the system must either:
  - create new versioned outputs, or
  - explicitly replace outputs under an atomic promotion rule, but only if the contract allows replacement

### Failure recording

If a source item fails to process, processed_files must record:

- failure status
- error type
- evidence pointer
- whether the item is eligible for retry

This prevents endless loops of reprocessing and makes retries explicit.

## Behavioral constraints by project role

These are enforcement rules, not suggestions.

- Producers must write canonical artifacts to disk first. Storage services are optional accelerators.
- Consumers must never depend on upstream caches or vector store internals.
- If a project uses vector retrieval, it must treat vector store as rebuildable and validate state via adapter checks.
- Any change in adapter behavior that impacts compatibility must trigger an ADR.

## Summary

This policy creates three outcomes:

- storage coupling is contained behind adapters
- version drift produces controlled failures with actionable run records
- idempotency reduces rework and prevents silent duplication

If a project cannot comply with these rules, it is not allowed to become a dependency in the constellation until it does.
