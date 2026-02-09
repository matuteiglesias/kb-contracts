---
title: Stable IDs and naming rules
sidebar_position: 31
---

# Stable IDs and naming rules

This page freezes naming semantics so IDs do not drift across repos, refactors, or reruns.

It is a behavioral contract only. It does not contain an implementation.

## Scope and non scope

This page defines:

- The canonical behavior of the stable id function
- Normalization rules applied to id inputs
- Hash algorithm and output constraints
- Filename rules derived from ids
- Naming rules by artifact family
- Test vectors for validation

This page does not define:

- Any specific code implementation
- Where ids are computed in a pipeline
- How to migrate old ids without an ADR and version bump

## Canonical stable id behavior

### What stable id is

A stable id is a deterministic identifier derived from a list of inputs after canonical normalization. The same normalized inputs must always produce the same id.

### What inputs are allowed

Inputs to stable id must be:

- Strings
- Integers
- Booleans
- Null values are not allowed as direct inputs

If a producer has optional information:

- Omit the input entirely, or
- Use an explicit sentinel string such as `none`

Do not rely on implicit serialization of complex objects. Complex objects must be converted to a stable canonical string first.

### Canonical normalization rules

Each input element is normalized before hashing.

Minimum normalization requirements:

- Convert to string using an explicit rule:
  - integers to base 10 string
  - booleans to `true` or `false`
- Trim leading and trailing whitespace
- Normalize internal whitespace runs to a single space
- Normalize unicode to NFC
- Normalize newlines to `\n`
- Lowercase only when explicitly declared for that id family
- For filesystem paths:
  - normalize separators to `/`
  - remove redundant `./`
  - do not resolve symlinks
- For URLs:
  - strip trailing slash
  - lowercase scheme and host
  - preserve path case
  - remove default ports when present

A stable id must not depend on environment specific values such as absolute local paths, unless the contract explicitly declares that path as the canonical source reference.

### Hash algorithm

Stable ids use a cryptographic hash of the canonical input string.

Behavioral rules:

- Use a single, fixed hash algorithm for the stable id family
- Use a single, fixed canonical input string format
- The input string must include a version marker for the stable id specification

Recommended contract defaults:

- Algorithm: sha256
- Encoding: UTF 8
- Canonical concatenation: join normalized parts with a single separator that cannot appear unescaped

Any change to:

- algorithm
- canonical concatenation format
- normalization rules
requires an ADR and a version bump of this page and the emitting schemas.

### Canonical input string format

The canonical string must be unambiguous.

Behavioral requirements:

- Include a stable id spec marker such as `stable_id:v1`
- Include the number of parts
- Include per part length or an escaping rule so separators cannot cause ambiguity

### Output format constraints

Stable id output must satisfy:

- Lowercase ascii only
- Fixed prefix indicating family and version when applicable
- Fixed length by convention
- No punctuation that is unsafe in filenames

Recommended output format:

- `id_<hashprefix>`
- hashprefix length should be long enough to make collisions negligible in your scale

### Collision stance

Collision risk is treated as negligible but not impossible.

Rules:

- If a collision is detected, the producer must fail fast
- The run record must capture the colliding inputs and ids
- Do not silently dedupe collisions by keeping the first

## Filenames derived from ids

File and directory names derived from ids must be portable and safe.

### Allowed characters

Allowed characters set:

- lowercase letters a to z
- digits 0 to 9
- underscore
- hyphen

Do not use:

- spaces
- uppercase
- colons
- slashes
- unicode punctuation

### Max length and truncation

Rules:

- Filenames should remain under a conservative limit such as 120 characters for compatibility
- If an id derived name would exceed the limit:
  - keep the id portion intact
  - truncate any human label or slug portion
  - append a short checksum of the truncated label to avoid collisions

### Duplicates

If two items map to the same filesystem path:

- Treat as an integrity error
- Do not auto rename with random suffixes

If a human label is part of the path, and labels collide:

- Keep the path based on the id
- Store the human label in metadata, not the path

### Slugs

Slugs are for readability, not identity.

Rules:

- Slugs must be derived from a human title field, not from the id
- Slugs may change without breaking identity, but should not be used as lookup keys
- If slug changes, the id remains the same

## Naming rules by artifact family

This section defines what each primary id represents and what must be included in its stable id inputs.

These rules are behavioral. Exact field names live in the bus contract pages.

### Event id

Event id identifies a single atomic message event.

Stable id inputs must include:

- source system identifier
- source conversation identifier
- source message identifier when present
- canonical timestamp
- normalized author role
- normalized message content hash

Event id must not depend on:

- enrichment fields
- downstream processing results

### Session id

Session id identifies a session derived from a set of events and a window policy.

Stable id inputs must include:

- window policy identifier
- session start timestamp
- session end timestamp
- ordered list hash of included event ids

Session id must not depend on:

- session summary text
- cluster assignment
- labels or tags

### Summary id

Summary id identifies a summary artifact for a specific source set.

Stable id inputs must include:

- summary type identifier
- ordered list hash of source ids
- source selection checksum
- summarizer version identifier
- prompt hash identifier

Summary id must not depend on:

- non deterministic model output text itself

### Bag id

Bag id identifies a compiled bag produced by selection rules.

Stable id inputs must include:

- bag type identifier
- selector or rule id
- selection window identifier
- ordered list hash of upstream summary ids

Bag id must not depend on:

- rendered markdown content

### Snapshot id

Snapshot id identifies a published snapshot.

Stable id inputs must include:

- publisher name and version
- input stream id or artifact family identifier
- ordered list hash of included item ids
- publish config hash

Snapshot id must not depend on:

- filesystem paths of the output directory

## Non scope reminder

This page deliberately avoids implementation details.

All code must be validated against this behavior using test vectors, and any deviation requires an ADR plus version bump.

## Test vectors

These are validation anchors. Implementations must reproduce these outputs exactly.

Note: replace the example outputs with real computed outputs from the reference implementation, then freeze them.

### Stable id core vectors

Vector 1:

- Inputs:
  - `stable_id:v1`
  - `event`
  - `conversation:abc123`
  - `message:def456`
- Expected:
  - `id_<frozen_hash_here>`

Vector 2:

- Inputs:
  - `stable_id:v1`
  - `session`
  - `window:policy_v1`
  - `start:2026-02-08T00:00:00Z`
  - `end:2026-02-08T01:00:00Z`
  - `events_hash:<hash_of_ordered_event_ids>`
- Expected:
  - `id_<frozen_hash_here>`

Vector 3:

- Inputs:
  - `stable_id:v1`
  - `summary`
  - `type:sessions`
  - `sources_hash:<hash_of_ordered_source_ids>`
  - `selection_checksum:<checksum>`
  - `prompt_hash:<hash>`
  - `summarizer:engine_v1`
- Expected:
  - `id_<frozen_hash_here>`

### Filename safety vectors

Slug normalization:

- Input slug: `Hello, World 2026`
- Output slug: `hello-world-2026`

Truncation rule:

- Input label: a label longer than the max length
- Output filename:
  - `id_<hashprefix>__label_truncated__chk_<shortchk>.json`

## Change control

Any change to:

- stable id normalization
- hash algorithm
- output format
- id family input rules
requires:

- ADR
- schema version bumps for affected buses
- migration note describing how old ids are handled
