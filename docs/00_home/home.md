---
title: Home
sidebar_position: 2
---

# Ecosystem Ops Manual

This site is the **decision registry** and **contract catalog** for a multi repo pipeline ecosystem.

It exists to freeze the few things that must remain stable across repos so that integration stays cheap, runs stay reproducible, and drift stays visible.

## What this site is

A single authoritative reference for:

- **Contracts**: schemas, invariants, required fields, allowed optional fields
- **Buses and seams**: what each bus carries and the only allowed integration points
- **On disk layouts**: canonical folder structures and naming rules
- **Observability**: run record format, error taxonomy, and what must be recorded on every run
- **Decisions**: ADRs that capture why a choice was made and what would justify changing it

If it is not stable, it does not belong here.

## What this site is not

This site is not:

- Tutorials that will go stale
- Implementation details tied to internal modules or refactors
- Per repo README clones
- A replacement for repo level runbooks and developer notes

The code remains the source of truth for how a repo works internally. This site is the source of truth for how repos must interoperate.

## The operating rule

Every pipeline run must be explainable using only this site:

- What inputs are allowed
- What outputs must exist even if empty
- What schema version is emitted
- What run record will be written
- What the smoke test is

If a run cannot be explained using these pages, the ecosystem is missing a decision or a contract.

## Stop the line policy

Contracts are enforced at boundaries.

If outputs violate contracts:

- **Downstream consumers must fail fast**
- The failure must be recorded in a run record
- The system must not silently degrade or "best effort" its way forward

This keeps bad artifacts from propagating downstream and turning into expensive rework.

## Rule for updates

Any change to a contract requires:

1) An ADR explaining the change and its impact  
2) A schema version bump  
3) A minimal migration note describing:
   - what changed
   - how to detect affected artifacts
   - what to regenerate or migrate

If the change would break consumers without a version bump, it is not allowed.

## How agents should use this site

Agents must treat this site as authoritative.

Rules:

- Prefer reading contract pages over inspecting code
- Never bypass seams by reading upstream raw inputs directly
- When generating artifacts, emit required files even if empty, and record the run
- When unsure, follow the contract pages first, then consult repo runbooks, then consult code

## Day to day usage

Use this site as a gate at the start and end of work:

Before you run or modify anything:

- Identify the bus and seam being used
- Confirm allowed inputs and required outputs
- Confirm the schema versions involved
- Confirm the smoke test and run record expectations

After a run:

- Confirm required outputs exist
- Validate schemas
- Write or update the run record
- If any contract is violated, stop and fix upstream before continuing

This is how the ecosystem stays coherent while the internals keep evolving.
