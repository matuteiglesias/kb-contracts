---
title: Project runbook index
sidebar_position: 70
---

# Project runbook index

This page is a pointer registry.

It exists to make day to day operation possible without turning this site into a clone of each repository README. If you want implementation details, debugging internals, or module inventories, go to the repo. If you want authoritative contracts, seams, and enforcement rules, stay here.

## Operating rule

This page stores only:

- pointer metadata to each repo runbook
- entrypoint and smoke test commands
- bus role and run record path conventions
- the bus endpoints the project writes
- links to the authoritative contract pages

Nothing else.

If a repo needs more explanation than fits this page, that is a sign the repo runbook is missing or unclear.

## Projects

| Project | Bus role | Writes bus endpoints | Entrypoint | Smoke test | Run record path | Repo runbook | Contract pages |
|---|---|---|---|---|---|---|---|
| GPT Chats Ingest to Event Bus | Event Bus producer | Event daily files and manifests | See repo runbook | See repo runbook | See run record contract | Link to repo runbook | Event Bus contract, Manifests and integrity, Run record contract, Error taxonomy, Integration seams |
| Session Mining and Clustering | Sessions Bus producer | Sessions daily outputs, cluster outputs, manifests | See repo runbook | See repo runbook | See run record contract | Link to repo runbook | Sessions Bus contract, Manifests and integrity, Run record contract, Error taxonomy, Integration seams |
| Summarizer Engine | Summary Bus producer | Event summaries, session summaries, manifests | See repo runbook | See repo runbook | See run record contract | Link to repo runbook | Summary Bus contract, Manifests and integrity, Run record contract, Error taxonomy, Integration seams |
| Digest Engine / Memory Bags | Digest Bus producer | Published digests, indexes, metadata, manifests | See repo runbook | See repo runbook | See run record contract | Link to repo runbook | Digest Bus contract, Snapshot publishing contract if used, Manifests and integrity, Run record contract, Error taxonomy, Integration seams |
| KB Chunk Bus and document ingestion | Chunk Bus producer | Canonical chunks and manifests | See repo runbook | See repo runbook | See run record contract | Link to repo runbook | Chunk Bus contract, Manifests and integrity, Run record contract, Error taxonomy, Integration seams |

## What each project row must include

Each project must have a local runbook in its repo. This site does not store the runbook content, only the pointers.

A project entry is compliant only if it provides:

- the bus role
- the bus endpoints it writes, as path patterns
- the canonical entrypoint command
- the canonical smoke test command
- the run record directory path pattern
- links to the applicable contract pages

## Change protocol for this page

Update this page only when:

- a new project is admitted into the constellation
- a project changes its entrypoint or smoke test
- a project changes its bus endpoints, which also requires contract updates and an ADR

This page should not change as a side effect of refactors.

## Notes on pointers

This page intentionally uses placeholders for repo links and commands.

The authoritative sources are:

- each repo local runbook for exact commands and paths
- contract pages in this site for invariants and enforcement rules

If you want, we will replace the placeholders with concrete repo relative paths and concrete smoke commands once the runbooks in each repo are in their final location and naming.
