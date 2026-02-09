---
title: Snapshot publishing contract
sidebar_position: 40
---

# Snapshot publishing contract

This page defines **snapshot publishing** as a formal artifact type.

A snapshot is a deterministic, static publish output optimized for consumption by downstream tools and frontends. It is designed to be browsable, cacheable, and verifiable, while remaining cheap to regenerate.

## Scope and non scope

This page defines:

- Snapshot model and required invariants
- Snapshot id derivation rules
- Directory layout, manifest contract, and tile contract
- Ordering rules and integrity anchors
- Atomic publish protocol: stage, validate, promote
- Compression rules and how they are signaled
- Consumer rules for reading snapshots and handling missing or invalid pieces

This page does not define:

- Frontend UI behavior, styling, or routing conventions
- How upstream pipelines produce the underlying doc stream
- Business logic for selecting what content enters a snapshot

## When to publish a snapshot

Publish a snapshot when you need:

- a stable, deterministic materialization of an ordered stream of docs
- efficient partial loading (page through docs without loading everything)
- verifiable integrity (manifests, hashes, counts, and ordering rules)
- atomic updates so consumers never observe partial state

A snapshot is a publish boundary. Once promoted, it is treated as read only.

## Snapshot model

A snapshot is composed of:

- one **manifest** file that describes the snapshot and how to read it
- a set of **tiles** that contain the docs in a deterministic order
- optional integrity anchors such as checksums or per tile digests

A snapshot may contain any doc family, as long as each doc conforms to the declared doc schema for that snapshot.

### Terms

- **doc**: a single logical record published inside tiles. Its schema is declared in the manifest.
- **tile**: a container for a contiguous segment of the ordered doc stream.
- **ordering**: the declared ordering rule that defines doc sequence and tile boundaries.

## Snapshot id derivation

The snapshot id must be deterministic and stable.

A snapshot id is derived from:

- publisher identity and publisher version
- snapshot kind identifier
- ordering rule identifier
- the set of input manifests referenced
- the snapshot schema version

The snapshot id must not depend on filesystem paths, timestamps of build, or random data.

The snapshot id may change when any of the above changes.

## Directory layout

A snapshot must be materialized under a single directory, referred to as `snapshot_root`.

Required layout:

- `snapshot_root/manifest.json`
- `snapshot_root/tiles/`
- `snapshot_root/tiles/` contains tile files and optional per tile integrity artifacts

Optional layout:

- `snapshot_root/bitsets/` or other accelerators, if declared in the manifest
- `snapshot_root/nodes/` for auxiliary indexes, if declared in the manifest
- `snapshot_root/order/` for separate ordering structures, if declared in the manifest

Consumers must treat only the manifest as authoritative. All optional subtrees must be referenced explicitly from the manifest to be considered part of the contract.

## Manifest contract

The manifest is the only authoritative entry point for consumers.

The manifest must include at least:

- `schema_version` for the manifest itself
- `snapshot_id`
- `snapshot_kind`
- `produced_at` timestamp
- `producer` metadata: project id and version
- `ordering` declaration:
  - ordering rule identifier
  - ordering key semantics and stability expectations
- `doc_schema` declaration:
  - doc family identifier
  - doc schema version
- `tile_index`:
  - tile count
  - tile naming pattern or explicit list
  - docs per tile rule or observed distribution
- `counts`:
  - total docs count
  - optional per category counts if relevant
- `integrity`:
  - hash algorithm identifier
  - hash of manifest canonical representation or a declared manifest hash
  - hashes for tiles or a reference to a tile hash index
- `inputs`:
  - list of input manifests referenced by path or id
  - optional input hashes

The manifest must be written only after all tiles have been written and validated.

### Ordering rules

The ordering must be explicit. Examples of valid ordering declarations:

- stable sort key by document timestamp then stable id
- stable id order only
- predefined order file plus stable id tiebreaker

If ordering depends on a sort key that can change, the snapshot must declare that it is not stable across reruns and must bump snapshot id on changes.

Consumers must not invent ordering.

## Tile contract

Tiles contain the actual docs.

Tile requirements:

- Each tile file must declare its own `tile_schema_version`
- Each tile must contain:
  - `snapshot_id`
  - `tile_id`
  - `range` information:
    - index range in global doc order, or key range if using key based partitions
  - `docs` list, in the declared ordering
  - optional `integrity` section for the tile payload

Tiles must not overlap. Together they must cover exactly the declared doc stream.

A tile file must be valid even if it contains zero docs, but only if the manifest declares it can happen and includes it in counts.

### Tile naming

Tile filenames must be deterministic and derived from tile index in order, not from build timestamps.

A common pattern is:

- `tiles/tile_00000.json`
- `tiles/tile_00001.json`

If compression is enabled, the extension changes accordingly.

## Atomic publish protocol

Publishing must be atomic from the consumer perspective.

The publisher must implement:

1. **Stage**
   - Create a staging directory that is not visible as a live snapshot root.
   - Write all tiles and the manifest into staging.
2. **Validate**
   - Validate every tile against the declared tile schema.
   - Validate that doc ordering and partition boundaries satisfy ordering rules.
   - Validate counts, uniqueness of doc ids where required, and internal consistency.
   - Validate integrity anchors, including recomputing hashes and comparing to manifest entries.
3. **Promote**
   - Promote staging to the final snapshot root in one atomic operation.
   - If the platform does not support atomic directory rename reliably, the publisher must use an equivalent atomic promotion strategy and document it in the publisher implementation runbook.
4. **Record**
   - Write a run record referencing the promoted snapshot root and the input manifests.

Partial promotion is forbidden.

If promotion fails, the publisher must not leave a partially visible snapshot root. Either the old snapshot remains visible, or nothing is visible.

## Compression rules

Compression is optional, but must be explicit and verifiable.

Allowed compression rules:

- Compression must be applied at the file level, not by mixing compressed and uncompressed content in one file.
- Compression type must be declared in the manifest and, when applicable, in tile metadata.
- The integrity anchors must apply to the decompressed canonical content or must declare exactly what is hashed.

The manifest must include:

- `compression.enabled`
- `compression.type` for example br, gzip, none
- `compression.applies_to` list such as tiles, order, nodes

Consumers must not guess compression from file extensions alone.

## Integrity anchors

A snapshot must be verifiable.

At minimum:

- the manifest must be hash anchored
- tiles must be verifiable via either:
  - per tile hashes recorded in the manifest, or
  - a tile hash index file referenced from the manifest

The hashing algorithm must be declared.

Hashing must specify:

- canonicalization rules for hashing text bytes, including line ending normalization
- ordering requirements prior to hashing

If hashes are computed over compressed bytes, this must be stated explicitly in the manifest.

## Consumer rules

Consumers must follow these rules when reading snapshots:

1. Read the manifest first. The manifest is authoritative.
2. Validate the manifest schema version. If unsupported, fail fast.
3. Validate manifest integrity anchors. If invalid, fail fast.
4. Use the tile index in the manifest to locate tiles.
5. Validate each tile before using its docs, at least:
   - tile schema version
   - snapshot id match
   - tile range consistency
6. Handle missing tiles by failing fast, unless the manifest explicitly declares a recoverable mode.

### Handling missing or invalid tiles

Default rule: missing or invalid tile is a hard failure.

A snapshot may declare a recoverable mode only if:

- it declares which tiles may be missing and under what conditions
- it declares consumer behavior and the resulting semantics
- it declares how counts and integrity should be interpreted

If recoverable mode is not declared, consumers must treat missing or invalid tiles as `INTEGRITY_MISMATCH` or `PUBLISH_FAILURE` depending on context and must stop the line.

## Non scope reminder

This page defines the artifact contract only.

It intentionally does not describe:

- how a frontend renders docs
- how docs are searched or filtered in the UI
- how navigation is structured

Those behaviors may change without contract changes, as long as consumers continue to respect the snapshot artifact boundaries and invariants.
