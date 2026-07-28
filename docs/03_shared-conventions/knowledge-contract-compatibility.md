---
title: Knowledge contract compatibility
sidebar_position: 31
---

# Knowledge contract compatibility and migration

This page explains the compatibility rules enforced by `kb-interop.v1-rc1`. The machine-readable fixtures and release inventory are authoritative; this page is the human guide.

## Compatible within one schema version

- Add an optional field only when absence retains the existing identity and interpretation.
- Add an optional namespaced extension under `extensions`.
- Add an enum value only when the schema and consumer rule explicitly require unknown-value tolerance.
- Add explanatory metadata that does not alter identity, integrity, cardinality, or meaning.

The checked-in optional-extension compatibility case proves that both the base document and candidate document validate and that their identity fields remain unchanged.

## Requires a new schema version

- add a required field;
- remove or rename a field;
- change field semantics;
- change checksum semantics;
- change identity precedence or normalization;
- remove an enum value;
- change artifact cardinality; or
- change what one document represents.

Historical artifacts remain valid under their declared historical schemas. They are not rewritten merely to satisfy the current release.

## Aliases

Every compatibility alias must declare:

- canonical field;
- legacy field;
- precedence rule;
- conflict behavior;
- introduction release;
- deprecation release; and
- planned removal release.

If canonical and legacy values conflict, validation fails. Alias support is a migration bridge, not permission to maintain two ambiguous authorities.

## Consumer support window

Consumers should support the current final version and the immediately previous final version unless they explicitly declare a longer window. Release candidates are immutable once published; corrections receive a new release ID.

The current/previous fixture includes a self-contained historical schema and proves that the historical document remains unchanged while validating under its declared version.

## Machine-readable evidence

- Compatibility fixtures: `contracts/examples/compatibility/`
- Invalid alias and change cases: `contracts/examples/invalid/`
- Stable-reference vectors: `contracts/test_vectors/stable_references.v1.json`
- Migration note: `contracts/migrations/v1-rc1.md`
- Release inventory: `contracts/releases/kb_interop_release.v1-rc1.json`
- Gate: `npm run contract:validate`
