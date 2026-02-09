---
title: Quartz or site consumer interface
sidebar_position: 50
---

# Quartz or site consumer interface

This page defines the **consumer interface** for turning published artifacts into a website without tight coupling.

The consumer is a site builder, for example Quartz, Docusaurus, or any static site pipeline. The consumer must treat published outputs as immutable inputs and must not depend on upstream repo internals.

## Scope and non scope

This page defines:

- Which published endpoints are valid inputs to a site consumer
- The rule that consumers use index files or snapshot manifests only
- Minimal mapping from published artifacts to site pages
- URL stability rules and update handling rules
- Required IO expectations for a consumer integration

This page does not define:

- Installation tutorials
- Build tool configuration details
- Theme, styling, UI components, or routing frameworks
- Any upstream pipeline implementation details

## Consumer inputs

A site consumer may consume one or both of the following.

### Input family A: Digest outputs

Valid inputs:

- Digest index files declared as authoritative
- Published memo content referenced by those index files
- Any digest level indexes used to enumerate content windows

The consumer must not discover digest content by walking directories. It must enumerate via index files only.

### Input family B: Snapshot outputs

Valid inputs:

- Snapshot manifest file
- Tiles referenced by the manifest
- Optional snapshot accelerators referenced by the manifest

The consumer must not guess tile names or optional files. It must follow the manifest only.

## Authoritative read rule

The consumer reads only these authority documents:

- digest indexes for digest outputs
- snapshot manifests for snapshot outputs

The consumer must never infer structure by directory naming conventions alone.

Examples of forbidden behavior:

- globbing all markdown files under a digests folder
- assuming a directory tree implies bag types or time windows
- reading intermediate scratch outputs or local run directories
- reading upstream raw inputs from producers

## Minimal mapping rules

The consumer must map published artifacts into a stable site surface with minimal assumptions.

### Digest memos to pages

The consumer must treat each memo as a page candidate only if it is referenced by the digest indexes.

The mapping must define:

- page identifier derivation, based on stable ids or stable slugs declared in indexes
- page title derivation, using metadata from indexes and memo frontmatter where present
- page grouping, based on bag type, topic tags, or window identifiers from the indexes

The consumer must not derive identifiers from file paths alone. If a file path changes but the index stable id remains the same, URLs must remain stable.

### Snapshot docs to pages

A snapshot doc may become:

- a page
- a section on an index page
- an entry in a list view page

The mapping must define:

- doc id and stable URL mapping based on doc id or stable id
- grouping and navigation based on doc metadata declared in the manifest doc schema

The consumer must not reorder docs. It must preserve snapshot ordering where it affects navigation.

## Update handling

Updates are expected. The consumer must support re builds without breaking URLs or producing partial site state.

### Digest updates

Digest outputs should be updated atomically. The consumer should:

- read index files
- generate pages and lists accordingly
- treat missing referenced memos as a hard error unless the index declares recoverable mode

The consumer should not keep stale pages that are no longer referenced by current indexes unless it has an explicit retention policy.

### Snapshot updates

Snapshots are immutable once promoted. Updates happen by producing a new snapshot directory. The consumer should:

- treat the manifest as the entry point
- consider the snapshot id as the version key
- support selecting latest snapshot by a configured pointer if needed, but that pointer must be explicit and not inferred

## URL stability rules

The consumer must preserve URLs across re builds.

Rules:

- URLs should be derived from stable ids or stable slugs declared by authoritative indexes or manifests
- Renaming a directory or changing internal file layout must not change URLs
- If a URL must change, it must be handled as a formal migration with redirects or alias mapping, and it should trigger an ADR

Recommended structure:

- stable top level namespaces by artifact family
- stable second level grouping by bag type or doc family
- stable per item slug derived from stable id and a human readable hint

If a consumer cannot support redirects, then URL changes must be avoided by design.

## Compatibility and version handling

The consumer must:

- validate schema versions of inputs
- fail fast when schema versions are unsupported
- treat unknown fields as ignorable unless required fields are missing

For digest indexes:

- required fields must exist for enumeration and URL mapping

For snapshot manifests:

- required fields must exist for locating tiles, ordering docs, and verifying integrity

If versions are incompatible, the consumer must stop the line and record the failure in its run record.

## Output contract of the consumer

The consumer should emit:

- a build log that references input index or manifest identifiers
- a run record that includes:
  - input manifests and indexes used
  - output location or deployment target identifier
  - validation results and any integrity failures

This ensures the website itself fits the ecosystem observability pattern.

## Summary: coupling boundaries

The consumer integration must keep coupling low by obeying two rules:

- The consumer reads only authoritative indexes or manifests.
- The consumer never reaches upstream to compute meaning, enumerate content, or parse raw inputs.

This lets upstream repos evolve internally without breaking the website surface, while maintaining stable contracts at the publish boundary.
