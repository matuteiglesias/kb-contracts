---
title: Integration seams and allowed IO
sidebar_position: 15
---

# Integration seams and allowed IO

This page is the enforcement reference for wiring repos together. If a new wiring choice is not explicitly allowed here, treat it as forbidden until an adapter and a contract update exist.

## What this page governs

This page defines:

- The approved integration seams between bus producers, transformers, and publishers
- The only allowed on disk endpoints that consumers may read from upstream
- The rules for version handling and fail fast behavior
- The adapter rule for crossing data families

This page does not define implementation details, internal module layouts, or how any one repo parses raw upstream formats.

## Seam list

A seam is an approved dependency between two bus endpoints. Downstream code may read only the seam endpoints listed below.

### Seam S1: Event Bus reader

Downstream users:

- Sessions Bus producer
- Summary Bus producer
- Any tool that needs atomic events for analytics or validation

Allowed upstream inputs:

- `eventbus/daily/YYYY-MM-DD.jsonl`
- `eventbus/manifest/YYYY-MM-DD.manifest.json`

Notes:

- Read via manifest first when possible
- Never read raw exports, staging files, or repo internal scratch outputs

### Seam S2: Sessions Bus reader

Downstream users:

- Summary Bus producer
- Digest Bus builder

Allowed upstream inputs:

- `sessions/daily/YYYY-MM-DD.sessions.jsonl` or `.parquet`
- `sessions/manifest/YYYY-MM-DD.manifest.json`
- `clusters/daily/YYYY-MM-DD.clusters.parquet`
- `clusters/manifest/YYYY-MM-DD.manifest.json`

Notes:

- Downstream must not recompute session windows
- Downstream must not rewrite clustering assignments

### Seam S3: Summary Bus reader

Downstream users:

- Digest Bus builder
- Any consumer that needs summaries without running the summarizer

Allowed upstream inputs:

- `summaries/events/YYYY-MM-DD.summary.jsonl`
- `summaries/sessions/YYYY-MM-DD.summary.jsonl`
- `summaries/manifest/YYYY-MM-DD.manifest.json`

Notes:

- Digest builders must not call LLMs directly when a Summary Bus exists
- If summaries are missing for a day, follow the error taxonomy and fail fast or explicitly downgrade by policy, never silently

### Seam S4: Digest output consumer

Downstream users:

- Publisher systems
- Sites that render digests

Allowed upstream inputs:

- Digest index files (authoritative)
- Published memo artifacts (secondary, for rendering)

Allowed upstream inputs example set:

- `index/l2_by_window.json` and other defined index files for the digest level
- `digests/L2/.../memo/*.md` and related published markdown

Notes:

- Consumers must not guess directory layout by scanning folders
- Consumers must treat index files as the source of truth

### Seam S5: Chunk Bus reader

Downstream users:

- Retrieval systems
- Enrichment systems (entities, citations)
- Publishers that render document collections

Allowed upstream inputs:

- `chunks/canonical/*.jsonl`
- `chunks/manifest/*.manifest.json`

Notes:

- Chunk Bus is separate from Event Bus
- If you need to connect chunk outputs into other buses, use an adapter that emits a bus compliant artifact

## Forbidden reads

The following are examples of forbidden patterns. These must not appear in production pipelines or in agents that generate pipeline wiring.

### Forbidden: reading raw exports from downstream

Bad:

- Sessions pipeline reads `raw_data/conversations.json` directly
- Digest pipeline reads `raw_data/` files directly
- Summary pipeline reads ChatGPT export formats directly

Required instead:

- Sessions reads Event Bus endpoints only
- Summary reads Event Bus or Sessions Bus endpoints only
- Digests read Summary Bus endpoints, and only if missing, follow the explicit downgrade policy if one exists

### Forbidden: reading upstream scratch outputs

Bad:

- Reading `staging/`, `tmp/`, `junk/`, `outputs/eda_*`, notebook caches, or unmanifested intermediates across repos

Required instead:

- If an intermediate is valuable across repos, promote it into a bus endpoint with a manifest and schema version, or keep it private

### Forbidden: writing into upstream bus directories

Bad:

- Downstream writes into upstream `eventbus/` or `sessions/` directories
- Downstream mutates existing daily files

Required instead:

- Every repo owns the directories it writes
- Publishing happens by producing new artifacts, not by patching upstream buses

## Allowed IO by project role

This table is the allowed IO policy by bus role. If a repo claims a role, it must obey the IO constraints for that role.

| Role | Allowed inputs | Required outputs |
|---|---|---|
| Event Bus producer | Raw exports and acquisition sources local to the repo | Event Bus daily files and manifests, run records |
| Sessions Bus producer | Event Bus daily files and manifests | Sessions daily files, clusters outputs, manifests, run records |
| Summary Bus producer | Event Bus and or Sessions Bus endpoints plus manifests | Summary daily files, manifests, run records |
| Digest Bus builder | Summary Bus endpoints plus manifests, plus selector registries | Digest indexes, published artifacts, atomic index updates, run records |
| Chunk Bus producer | Documents and source files local to the repo | Canonical chunk files, manifests, processed files state, run records |
| Publisher | Digest indexes or any other publish contract input | Snapshot outputs with manifest, tiles, atomic promotion logs |

## Version handling rule

Every consumer must validate schema versions before processing.

Minimum policy:

1. Read manifest if present
2. Validate `schema_version` in manifest and or file objects
3. If version is supported, proceed
4. If version is unsupported, fail fast and write a run record with:
   - error type: `SCHEMA_VERSION_UNSUPPORTED`
   - observed version
   - supported versions
   - affected inputs

Consumers must never silently accept unknown schema versions.

## Minimal adapter rule

If you need to cross families, do it through an adapter that emits a bus compliant artifact.

Examples:

- Paper ingestion to Chunk Bus is an adapter from document sources to chunk objects
- Converting a digest memo stream to a snapshot is an adapter from Digest Bus to publishing artifacts
- Converting sessions to calendar events is an adapter from Sessions Bus to calendar export artifacts

Adapter requirements:

- Output must have a schema version
- Output must have a manifest
- Adapter must write a run record
- Adapter must not become a hidden dependency by being run inside a downstream repo without declaring its outputs as a seam

## Practical checks for agents

When an agent proposes wiring changes, it must be able to answer:

- Which seam is being used
- Which endpoints are read and written
- Which schema versions are expected
- What the smoke test is and what it validates
- What run record will be emitted on success and on failure


<!-- 


Drift vs the manual (what to track, not block v0)

Based on your earlier code snippets and the seam docs you uploaded, the main drift to track is:

Summary request schema shape

Manual tends to want more explicit “seam language” (for example a more structured flow reference)

Current implementation uses work: { template_id, prompt_version, params, ... } and treats it as the flow identifier

This is fine for v0 harness. The “fix” later can be either:

update manual to accept template_id as the canonical flow id for now, or

evolve request schema to add flow_id while keeping backward compatibility (accept either)

Bus manifest strictness

Your fixture manifests may be simpler than the manual’s canonical manifest schema

For v0 harness, keep them minimal but valid JSON, and only tighten once adapters start truly consuming them

I would not block harness v0 on perfect contract alignment. Just keep a short “Drifts” section in the harness runbook so it is explicit. -->