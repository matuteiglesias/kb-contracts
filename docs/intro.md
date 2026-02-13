---
title: Start
sidebar_position: 1
---

This manual is a contract catalog for a multi repo knowledge ecosystem.

It exists to keep integration cheap, drift visible, and interventions obvious.

> **Primary invariant:** consumers read indexes and contracts, not directory trees and not private internals.

## Choose your path

### I need to decide what to do next (under 60 seconds)
If you want a fast, reliable "where do I intervene" answer:

1. **Observability indexes (UI contract):** what the UI can read and what is authoritative  
   [/docs/shared-conventions/observability-indexes-contract](/docs/shared-conventions/observability-indexes-contract)

2. **Run record contract:** what every run must emit and how status is represented  
   [/docs/shared-conventions/run-record-contract](/docs/shared-conventions/run-record-contract)

3. **Error taxonomy and stop rules:** what must stop the line and what may warn  
   [/docs/shared-conventions/error-taxonomy-and-stop-rules](/docs/shared-conventions/error-taxonomy-and-stop-rules)

### I am adding a new producer or consumer repo
Use this sequence to avoid accidental coupling:

1. **Ecosystem map and registry:** declare what the repo is and which bus it touches  
   [/docs/registry-governance/ecosystem-map-and-registry](/docs/registry-governance/ecosystem-map-and-registry)

2. **Corpora registry:** ensure the corpus vocabulary exists and is governed  
   [/docs/registry-governance/corpora_registry](/docs/registry-governance/corpora_registry)

3. **Integration seams and allowed IO:** confirm you are using a sanctioned seam  
   [/docs/bus-contracts/integration-seams-and-allowed-io](/docs/bus-contracts/integration-seams-and-allowed-io)

4. **Pick the bus contract you will produce or consume:**  
   - Event Bus: [/docs/bus-contracts/event-bus-contract](/docs/bus-contracts/event-bus-contract)  
   - Sessions Bus: [/docs/bus-contracts/sessions-bus-contract](/docs/bus-contracts/sessions-bus-contract)  
   - Summary Bus: [/docs/bus-contracts/summary-bus-contract](/docs/bus-contracts/summary-bus-contract)  
   - Digest Bus: [/docs/bus-contracts/digest-bus-contract](/docs/bus-contracts/digest-bus-contract)  
   - Chunk Bus: [/docs/bus-contracts/chunk-bus-contract](/docs/bus-contracts/chunk-bus-contract)

5. **Shared invariants:** stable ids, manifests, run records  
   - Stable IDs: [/docs/shared-conventions/stable-ids-and-naming-rules](/docs/shared-conventions/stable-ids-and-naming-rules)  
   - Manifests: [/docs/shared-conventions/manifests-and-integrity-rules](/docs/shared-conventions/manifests-and-integrity-rules)  
   - Run records: [/docs/shared-conventions/run-record-contract](/docs/shared-conventions/run-record-contract)

6. **Contract compliance tests:** define how you prove you did not drift  
   [/docs/contract-tests/contract-compliance-tests](/docs/contract-tests/contract-compliance-tests)

### I am debugging a broken pipeline
Debug should start from the contracted surfaces, not from guessing.

Recommended order:

1. **Observability indexes contract** (what the UI is allowed to conclude)  
   [/docs/shared-conventions/observability-indexes-contract](/docs/shared-conventions/observability-indexes-contract)

2. **Run record contract** (did the run emit the expected record)  
   [/docs/shared-conventions/run-record-contract](/docs/shared-conventions/run-record-contract)

3. **Manifests and integrity rules** (is the artifact set complete and verifiable)  
   [/docs/shared-conventions/manifests-and-integrity-rules](/docs/shared-conventions/manifests-and-integrity-rules)

4. **Bus contract for the failing stage** (schema and endpoint invariants)  
   [/docs/bus-contracts/integration-seams-and-allowed-io](/docs/bus-contracts/integration-seams-and-allowed-io)

5. **Stop rules** (what must halt, what may warn, what may continue)  
   [/docs/shared-conventions/error-taxonomy-and-stop-rules](/docs/shared-conventions/error-taxonomy-and-stop-rules)

### I am designing or changing a contract
Do not change contracts by editing files first.

1. **ADR index and policy** (how decisions are proposed and frozen)  
   [/docs/registry-governance/adr-index-and-policy](/docs/registry-governance/adr-index-and-policy)

2. **Glossary** (terms must be unambiguous before schemas are updated)  
   [/docs/registry-governance/glossary](/docs/registry-governance/glossary)

3. **Ecosystem map and registry** (update who is affected)  
   [/docs/registry-governance/ecosystem-map-and-registry](/docs/registry-governance/ecosystem-map-and-registry)

4. **Contract compliance tests** (define the gate that enforces the change)  
   [/docs/contract-tests/contract-compliance-tests](/docs/contract-tests/contract-compliance-tests)

## Authority hubs

These are the pages that define what is real. If they drift, downstream work becomes guesswork.

### Governance and meaning
- Ecosystem map and registry  
  [/docs/registry-governance/ecosystem-map-and-registry](/docs/registry-governance/ecosystem-map-and-registry)
- ADR index and policy  
  [/docs/registry-governance/adr-index-and-policy](/docs/registry-governance/adr-index-and-policy)
- Glossary  
  [/docs/registry-governance/glossary](/docs/registry-governance/glossary)
- Knowledge management value chains  
  [/docs/registry-governance/knowledge-management-value-chains](/docs/registry-governance/knowledge-management-value-chains)
- Meaning lives in summaries  
  [/docs/registry-governance/meaning-lives-in-summaries](/docs/registry-governance/meaning-lives-in-summaries)
- Corpora registry  
  [/docs/registry-governance/corpora_registry](/docs/registry-governance/corpora_registry)
- Portfolio bus matrix  
  [/docs/registry-governance/portfolio-bus-matrix](/docs/registry-governance/portfolio-bus-matrix)

### Contracts and seams
- Integration seams and allowed IO  
  [/docs/bus-contracts/integration-seams-and-allowed-io](/docs/bus-contracts/integration-seams-and-allowed-io)
- Event Bus contract  
  [/docs/bus-contracts/event-bus-contract](/docs/bus-contracts/event-bus-contract)
- Sessions Bus contract  
  [/docs/bus-contracts/sessions-bus-contract](/docs/bus-contracts/sessions-bus-contract)
- Summary Bus contract  
  [/docs/bus-contracts/summary-bus-contract](/docs/bus-contracts/summary-bus-contract)
- Digest Bus contract  
  [/docs/bus-contracts/digest-bus-contract](/docs/bus-contracts/digest-bus-contract)
- Chunk Bus contract  
  [/docs/bus-contracts/chunk-bus-contract](/docs/bus-contracts/chunk-bus-contract)
- Summary request seam  
  [/docs/bus-contracts/summary-request-seam](/docs/bus-contracts/summary-request-seam)

### Shared conventions and invariants
- Stable IDs and naming rules  
  [/docs/shared-conventions/stable-ids-and-naming-rules](/docs/shared-conventions/stable-ids-and-naming-rules)
- Manifests and integrity rules  
  [/docs/shared-conventions/manifests-and-integrity-rules](/docs/shared-conventions/manifests-and-integrity-rules)
- Run record contract  
  [/docs/shared-conventions/run-record-contract](/docs/shared-conventions/run-record-contract)
- Error taxonomy and stop rules  
  [/docs/shared-conventions/error-taxonomy-and-stop-rules](/docs/shared-conventions/error-taxonomy-and-stop-rules)
- Observability indexes contract  
  [/docs/shared-conventions/observability-indexes-contract](/docs/shared-conventions/observability-indexes-contract)

### Publishing and consumers
- Snapshot publishing contract  
  [/docs/publishing/snapshot-publishing-contract](/docs/publishing/snapshot-publishing-contract)
- Site consumer interface  
  [/docs/publishing/site-consumer-interface](/docs/publishing/site-consumer-interface)

### Storage and test discipline
- Storage boundaries and adapter policy  
  [/docs/storage/storage-boundaries-and-adapter-policy](/docs/storage/storage-boundaries-and-adapter-policy)
- Contract compliance tests  
  [/docs/contract-tests/contract-compliance-tests](/docs/contract-tests/contract-compliance-tests)

### Runbooks
- Project runbook index  
  [/docs/runbooks/project-runbook-index](/docs/runbooks/project-runbook-index)

## Legend

- **Bus**: a canonical artifact stream with stable endpoints and schema.
- **Seam**: the only allowed IO between repos. Prefer append only requests and index driven reads.
- **Manifest**: integrity and traceability surface for an artifact set.
- **Run record**: the audit entry for what ran, with status and provenance.
- **Corpus**: a governed vocabulary for knowledge streams, used to reason about throughput and backlog.

:::caution
If you cannot point to the contract page that justifies a field, path, or behavior, treat it as non canonical and do not build dependencies on it.
:::

## Quick links

- Home  
  [/docs/home/home](/docs/home/home)
- Start here (this page)  
  [/docs/intro](/docs/intro)
