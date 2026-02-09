# KB Manual

A decision registry and contract catalog for a multi repo knowledge pipeline ecosystem.

This repo exists to prevent integration drift in systems that combine LLM workflows, knowledge management, and data pipelines. It defines the stable seams between projects: buses, schemas, manifests, run records, publishing contracts, and the rules for how repos are allowed to read and write data.

## What this is

- A decision registry: the “why” behind architectural choices, frozen as ADRs.
- A contract catalog: authoritative specs for buses and shared conventions.
- An enforcement reference: the page you consult before wiring two repos together.

## Operating rule

Every pipeline run must be explainable using only this manual:

- allowed inputs
- required outputs, even if empty
- schema versions emitted
- where the run record is written
- the smoke test command

If you cannot explain a run using only this repo, the system is not integrated yet.


## How agents should use this repo

Treat this manual as authoritative.

- Prefer reading contract pages over inspecting code.
- Never bypass seams by reading upstream raw inputs directly.
- If a cross family move is needed, do it via an adapter that emits a bus compliant artifact.

## Contents

The site is organized around a small number of stable concepts:

- Registry and governance layer
  - ecosystem map and registry
  - ADR index and policy
  - glossary

- Bus contracts and seams
  - event bus contract
  - sessions bus contract
  - summary bus contract
  - digest bus contract
  - chunk bus contract
  - integration seams and allowed IO

- Shared conventions
  - stable IDs and naming rules
  - manifests and integrity rules
  - run record contract
  - error taxonomy and stop rules

- Publishing contract and consumers
  - snapshot publishing contract
  - consumer interface rules

- Storage boundaries and adapters
  - adapter policy and version drift strategy

- Minimal runbooks index
  - links to per repo runbooks without duplicating them

- Contract compliance tests
  - cross repo tests for contract correctness

## Local development

This repo is a Docusaurus site.

```bash
npm install
npm run start
