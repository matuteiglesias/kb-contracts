---
title: Ecosystem map and registry
sidebar_position: 3
---

# Ecosystem map and registry

This page is the single place where the ecosystem is enumerated and governed.

It lists the active projects, assigns each project a primary role in the constellation, and specifies the stable seams that are allowed between them.

This is a **planning and enforcement artifact**, not a feature list. If something is not captured here, it is not a stable dependency.

## What this page is for

This registry is used to:

- Plan integration work without guessing how repos connect
- Enforce that consumers read only from bus endpoints
- Provide a fast audit surface for health checks and smoke tests
- Make drift visible as soon as it happens

## Core concept: bus role

A **bus role** is the primary responsibility a repo has in the ecosystem, defined by the artifacts it emits and the contracts it guarantees.

Why each repo has exactly one primary role:

- It forces clean boundaries and prevents hidden coupling
- It makes ownership of a bus explicit
- It keeps pipelines composable: producers produce, consumers consume, publishers publish
- It reduces rework by making failures attributable to one contract boundary

A repo may have secondary utilities, but it must have one primary role that determines:
- its required outputs
- its schema versions
- its smoke test
- its run record format and location

## The registry

The table below is the authoritative map of projects and integration seams.

Update this table whenever a repo becomes a dependency of another repo.

| Project | Bus role | Primary inputs | Primary outputs | Entrypoints | Smoke test | Run record location | Schema versions emitted |
|---|---|---|---|---|---|---|---|
| gpt_eventbus | Event bus producer | Raw exports (local input only) | Daily event JSONL + manifest | CLI entrypoint for ingest | Smoke: ingest yesterday with empty allowed | artifacts/run_records/ | event.v1 |
| gpt_sessions | Sessions bus producer | Event bus daily + manifest | Sessions daily + clusters + manifest | CLI entrypoint for sessionize | Smoke: read eventbus and emit empty valid sessions | artifacts/run_records/ | sessions.v1, clusters.v1 |
| summarizer | Summary bus producer | Event bus, Sessions bus | Summary daily + manifest | CLI entrypoint for summarize | Smoke: summarize zero items deterministically | artifacts/run_records/ | summary.v1 |
| kb_digests | Digest bus packager | Summary bus (preferred), Sessions bus (fallback) | Digests + indexes + published markdown | CLI entrypoint for bag build | Smoke: build with empty input and emit indexes | artifacts/run_records/ | digests.l2.v1 |
| kb_chunks | Chunk bus producer | Papers, notes, parsers | Canonical chunks + manifest | CLI entrypoint for chunk ingest | Smoke: ingest a single fixture into chunks | artifacts/run_records/ | chunks.v1 |

Notes:

- Inputs listed here are the only allowed integration seams.
- Any additional coupling is considered a contract violation.

## Integration constraints

These constraints are not suggestions. They are hard rules that keep integration cheap.

### Consumers read buses only

A consumer must read only:

- the bus endpoint artifacts (daily files plus manifests)
- the index files that are explicitly part of a contract

A consumer must not:

- reach into upstream repo internals
- import upstream internal modules
- read upstream staging folders
- depend on upstream local caches

### No raw upstream reads across repos

Raw inputs are private to the producer repo.

If a downstream repo needs something that only exists in raw form upstream, the correct fix is:

- add a field to the bus contract and bump the schema version
- or add a new bus artifact with a manifest
- and document the change with an ADR

## How to add a new project

A new project can be added only when it is intended to become a stable dependency in the ecosystem.

Criteria for adding a project:

- It has a single primary bus role
- It emits at least one contract defined artifact that other repos will consume
- It can be run deterministically on a defined input set
- It can fail fast on contract violations

Required for admission:

1) Contracts
- Declared schemas for its emitted bus artifacts
- A manifest format for emitted artifacts
- Versioning rules and compatibility expectations

2) Smoke test
- A command that runs in a clean environment
- Uses a minimal fixture or an empty day
- Emits required outputs even if empty
- Validates schemas and writes a run record

3) Run record compliance
- Writes a run record on every run, success or failure
- Records input manifests, output paths, schema versions, and error taxonomy
- Records deterministic identifiers for the run (run_id, prompt hash if applicable, code version if available)

After admission, the project must be added to the registry table with:

- bus role
- seams
- entrypoint and smoke test
- run record location
- schema versions emitted

## Allowed exceptions

Exceptions exist, but they must remain quarantined.

Allowed exceptions:

- Experimental scratchpads can exist for exploration and spikes.
- They may read bus artifacts for analysis.

Not allowed:

- Scratchpads must not become upstream dependencies.
- No other repo may depend on scratchpad outputs.
- Scratchpad artifacts must not be treated as buses.
- Any reusable result must be promoted into a proper repo with contracts, manifests, smoke tests, and run records.

If an experiment proves valuable, promote it by extracting a stable contract and creating a proper bus producing or consuming module, then add it to this registry.
