---
title: ADR index and policy
sidebar_position: 5
---

# ADR index and policy

This page defines how architectural decisions are recorded, evaluated, adopted, and changed.

ADRs exist to prevent silent drift across repos. They are the memory of why the ecosystem looks the way it does.

## What an ADR is

An ADR is a short, structured document that captures:

- a decision that constrains future work
- the context that forced the choice
- the tradeoffs and alternatives
- the expected consequences, including failure modes
- the conditions under which the decision should be revisited

ADRs are not meeting notes and not retrospectives. They are change-control for stable interfaces.

## ADR index

Keep an index so decisions are discoverable. Each ADR should be linkable from here.

Add new entries in reverse chronological order.

- ADR-0001: (example) Canonical Event schema v1
- ADR-0002: (example) Run record contract and error taxonomy v1
- ADR-0003: (example) Digest publishing layout and index rules

The index should point to the ADR file paths under this site.

## ADR format rules

Each ADR must include the sections below. If a section is not applicable, explicitly write "Not applicable" and state why.

Required fields:

- **ID**: unique, monotonic (ADR-0001, ADR-0002, ...)
- **Title**: short and specific
- **Status**: proposed, accepted, superseded, deprecated
- **Date**: YYYY-MM-DD
- **Decision**: the chosen approach, written as a constraint
- **Context**: the situation and the pressures that forced a decision
- **Alternatives**: at least two plausible options, including the rejected ones
- **Consequences**: what becomes easier, what becomes harder, what new risks exist
- **Rollback plan**: how to revert safely if it fails
- **Migration plan**: how to move from the current state to the new state
- **Affected contracts**: explicit list of contract pages and schema versions touched
- **Validation plan**: how acceptance will be verified, with measurable criteria

Recommended additions when relevant:

- **Failure modes**: the top ways this can break in production
- **Observability**: what metrics, checks, and run record fields must exist
- **Open questions**: bounded unknowns that will be closed by a date or a test

## ADR lifecycle

### Proposed

A draft ADR exists, but the decision is not yet binding.

A proposed ADR should specify:

- the experiment or validation needed
- what evidence will trigger acceptance or rejection

### Accepted

The ADR is binding. Work across repos must comply.

Acceptance means:

- contract pages are updated
- schema versions are bumped if necessary
- migration notes exist if consumers are affected
- smoke tests and validation checks reflect the new contract

### Superseded

A newer ADR replaces this one. The old decision is no longer active.

Rules:

- the superseding ADR must reference the old ADR ID
- the old ADR must link forward to the superseding ADR
- any remaining compatibility window must be stated explicitly

### Deprecated

The decision is no longer recommended, but may still exist in legacy paths.

Rules:

- define a sunset date or a condition for removal
- define what replaces it, or state that it is being removed without replacement
- define how to detect remaining usage

## When an ADR is mandatory

An ADR is mandatory for any change to stable interfaces, including:

- any change to a bus schema, event types, or required fields
- any change to naming rules (stable IDs, path layout rules, manifest hashing)
- any change to the run record schema or error taxonomy
- any change to the publishing contract (snapshots, tiles, atomic promotion rules)
- any change to storage boundary behavior (vector store adapter contract, idempotency rules, persistence semantics)
- any change to seam rules (what downstream consumers are allowed to read)

If a change can break a downstream consumer or make a run non-reproducible, it needs an ADR.

## What would justify changing an ADR

An accepted decision should not change because of preference. It changes only when the pressures change.

Explicit triggers that justify revisiting a decision:

- **New scale constraints**: throughput, latency, storage size, or cost constraints that invalidate the old approach
- **Version drift**: dependency changes that repeatedly break the boundary (example: storage clients, DB schema drift)
- **Repeated failure modes**: the same class of incident reappears despite normal fixes
- **Simpler architecture exists**: a demonstrably simpler design with fewer seams or fewer moving parts, proven by a spike or prototype
- **New compliance or governance constraints**: data handling, provenance, retention, or audit requirements

When a trigger occurs, write a new proposed ADR rather than editing history.

## Decision quality bar

An ADR must meet a minimum quality bar before acceptance.

### Tradeoffs and failure modes must be explicit

The ADR must state:

- what it optimizes for
- what it sacrifices
- the top plausible ways it fails and how that failure will be detected

### Acceptance criteria must be measurable

The ADR must include measurable acceptance criteria, such as:

- smoke tests pass under defined fixtures
- schema validation passes for defined sample sets
- rebuild-from-scratch yields identical manifests and hashes
- downstream consumers require no code changes, or the migration plan updates them
- error taxonomy produces actionable categories instead of generic exceptions

### Validation must be runnable

The validation plan must specify:

- commands or checks that can be executed
- what artifacts they produce
- what constitutes pass versus fail

If validation cannot be executed reliably, the ADR is not ready to be accepted.
