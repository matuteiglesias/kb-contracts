---
title: Glossary
sidebar_position: 3
---

# Glossary

Short, precise definitions used across the ecosystem. The goal is to prevent semantic drift.

Each entry includes:

- Meaning: one line
- Not: what it is not
- Defined in: the contract page that is authoritative for the term

This page is not a tutorial. If you need rationale or examples, follow the contract link.

## Event

Meaning: An atomic record of something that happened at a point in time, represented as a single JSON object in an append-only stream.  
Not: A session, a summary, or a document chunk.  
Defined in: Bus contracts: Event.

## Session

Meaning: A time window grouping of related events, with explicit boundaries and pointers back to source event IDs.  
Not: A conversation, a topic, or a cluster label by itself.  
Defined in: Bus contracts: Session.

## Unit

Meaning: A normalized, schema-validated payload produced by a pipeline stage as a stable intermediate representation for downstream work.  
Not: A raw input, an ad hoc dict, or a UI-only object.  
Defined in: Canonical unit model.

## Chunk

Meaning: A document-centric unit representing a span of a source document (pages, sections, offsets) with stable provenance metadata.  
Not: A chat message event or a digest memo.  
Defined in: Bus contracts: Chunk.

## Summary

Meaning: a controlled, policy-defined representation of source content whose purpose is to preserve meaning while reducing entropy; must carry provenance pointers back to canonical sources.
Not: A digest, a bag, or a free-form note without provenance.  
Defined in: Bus contracts: Summary.

## Digest

Meaning: A packaged multi-summary artifact intended for consumption (human or publisher), typically assembled via selection + ordering + framing rules.  
Not: The summary bus itself, or raw model output.  
Defined in: Bus contracts: Digest.

## Bag

Meaning: A curated collection of related summaries or units assembled by explicit selection rules and emitted as a digest subtype.  
Not: A database table, a generic folder of markdown, or an untracked aggregation.  
Defined in: Digest contract: Bag types and selection rules.

## Artifact

Meaning: Any materialized output of a pipeline run that is intended to be consumed downstream, including indexes, manifests, snapshots, and published markdown.  
Not: Temporary scratch files or intermediate debug outputs without run records.  
Defined in: Artifact contract: Outputs and naming.

## Manifest

Meaning: A small integrity and bookkeeping record that describes a produced batch or snapshot, including counts, hashes, schema versions, and pointers to payload files.  
Not: A run record, an index, or a config file.  
Defined in: Manifest contract.

## Run record

Meaning: The canonical audit log of a pipeline run, capturing inputs, outputs, status, errors, versions, and validation results.  
Not: Application logs, notebooks, or ad hoc print statements.  
Defined in: Run record contract and error taxonomy.

## Seam

Meaning: A defined integration boundary where downstream consumers are allowed to read upstream outputs only via specified endpoints and manifests.  
Not: Importing upstream internal modules, or reading upstream raw inputs directly.  
Defined in: Seams and integration rules.

## Bus

Meaning: A shared, contract-defined stream or directory of artifacts that multiple modules read and write through stable conventions.  
Not: A message queue requirement, or a shared database schema you mutate freely.  
Defined in: Bus overview and seam rules.

## Publisher

Meaning: A component that materializes consumable outputs from an ordered stream of units or digests, typically as snapshots, tiles, and indexes with atomic promotion.  
Not: A producer of raw events or a summarizer.  
Defined in: Publishing contract: Snapshots and tiles.

## Source adapter

Meaning: A boundary module that converts an external source format into canonical units on a bus, enforcing schema validation and idempotency.  
Not: A consumer that enriches or republishes existing bus artifacts.  
Defined in: Source adapters: Inputs, outputs, and validation.

- **corpus**: a governed slice of knowledge with explicit in-scope/out-of-scope boundaries; the unit of “finite dominance”.

- **meaning surface**: the portfolio layer where knowledge becomes operationally usable (routable, joinable, auditable). In this system, that layer is summaries.

- **snapshot**: a published, immutable surface artifact (site page, post, dataset release, docs build) traceable to upstream digests/summaries/manifests.
