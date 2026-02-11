---
title: Portfolio Bus Matrix
sidebar_position: 6
---

# Portfolio Bus Matrix

## Purpose

This page defines the **portfolio-level wiring diagram** for your ecosystem:  
each project must declare **which buses it reads** and **which buses it writes**.

This is *not* a bus schema (those live in the individual bus contract pages).  
This is the **system topology**: how projects connect, how data flows, and what invariants prevent silent drift.

## Scope

This contract governs:

- The **declaration interface** per project: `reads_buses`, `writes_buses`
- The **portfolio invariants** that make cross-project integration reliable
- The **no side-channels** rule: buses are the only allowed integration surfaces

This contract does **not** define:

- The internal schema of each bus (see each bus’s own contract page)
- Project-specific internal storage layouts (unless they are declared as bus endpoints)

## Key Principle

> **Bus contracts define “what a bus is.”  
> This matrix defines “who uses which bus.”**

Without this, the system becomes a pile of correct specs with no authoritative topology.

---

## Bus Vocabulary

Your portfolio uses the following bus identifiers (extend only by ADR):

- `event_bus`
- `session_bus`
- `summary_bus`
- `digest_bus`
- `chunk_bus`
- `snapshot_bus`
- `cluster_bus`
- `graph_bus`
- `ledger_bus`
- `run_records` *(meta-bus / run log surface)*

### Meaning of “reads” and “writes”

- **reads_buses**: the project’s *inputs* are bus artifacts. The project must treat the bus index as authoritative and must not “discover” data by scanning arbitrary directories.
- **writes_buses**: the project produces bus artifacts as *outputs*. Those outputs must satisfy publishing invariants (below).

---

## Required Project Declarations

Every project in the portfolio registry must declare:

- `reads_buses`: pipe-separated list of bus IDs (or empty)
- `writes_buses`: pipe-separated list of bus IDs (or empty)

**Example:**
- `reads_buses = event_bus|session_bus|summary_bus`
- `writes_buses = summary_bus|digest_bus`

### Strong recommendation

Keep this declaration in the canonical portfolio dataset / registry row for each project, and ensure tools (Control Tower, dashboards, validators) read from there.

---

## Portfolio Invariants

### Invariant 1 — Write implies run record

If a run writes to **any** bus, it MUST emit a `run_record` and MUST be traceable.

**Rule:**
- For every run that writes bus artifacts:
  - A `run_record` is produced (or updated) for that run
  - The run record includes:
    - `run_id`
    - `project_id`
    - `ts_start`, `ts_end`
    - `status`
    - `inputs`: pointers to bus items or selectors
    - `outputs`: pointers to bus items written (bus + item IDs)
    - `manifest_pointer`

**Interpretation:**  
No bus write is “informal”. If something lands on a bus, it’s part of the official machine.

---

### Invariant 2 — Every bus write must have a manifest pointer

If you write bus artifacts, you MUST produce a manifest (or update a manifest) and provide a pointer to it.

**Rule:**
- For each bus write, one of the following must be true:
  1) The written artifact contains a `provenance.manifest_path`, or  
  2) The bus index entry for that artifact contains a `manifest_path`, or  
  3) The `run_record` outputs section enumerates artifacts and provides the manifest path for the run.

**Minimum manifest content (portfolio-level):**
- `run_id`
- `project_id`
- `inputs` (selectors + resolved counts)
- `outputs` (artifact paths + IDs)
- `integrity` checksums/hashes where applicable
- `errors` array (empty if none)

---

### Invariant 3 — Bus indices are authoritative

Consumers must read **bus index files**, not directory trees guessed by convention.

**Rule:**
- Any project that reads a bus must:
  - resolve inputs by reading the authoritative index for that bus
  - treat “missing from index” as “does not exist”

**Forbidden pattern:**
- “List all files in `/data/digests/...` and infer what exists.”

This rule makes rebuilds, migrations, and republishing possible without breaking consumers.

---

### Invariant 4 — Don’t bypass buses (no side-channels)

Projects MUST NOT pass information via undeclared channels.

**Rule:**
- If data crosses a project boundary, it must cross via:
  - a declared bus write → declared bus read, OR
  - a registry/contracted shared surface explicitly named and documented (rare; requires ADR)

**Examples of forbidden side-channels:**
- Writing “temporary” JSONs into another project’s folder
- Reading another project’s internal SQLite/CSV directly
- Passing data via ad-hoc Google Docs without indexing/pointers
- Sharing state via environment variables or undocumented cron scripts

**Allowed exceptions (must be declared):**
- “Bus adapters” that *materialize* external sources into bus items (these are still bus writes)
- “Shared libraries” (code reuse) — but not shared storage

---

### Invariant 5 — Writes must be explicitly declared

If a project writes to a bus, that bus must be listed in `writes_buses`.

No implicit writes.

This is non-negotiable because the topology is what enables:
- observability surfaces
- QA validation
- integration planning
- dependency containment

---

## Validation and QA

### Portfolio-level validator (conceptual)

A validator should run periodically (or per PR / per daily run) to ensure:

1) Every project has `reads_buses` and `writes_buses` fields present (even if empty)
2) Every bus ID used is in the allowed vocabulary (or has an ADR)
3) Every run that writes buses has:
   - a run record
   - a manifest pointer
4) No “foreign writes”:
   - project writes into another project’s internal store
5) Consumers resolve inputs through bus indices, not filesystem scans

---

## How this page is used

This matrix is the foundation for:

- **System observability UI** (tabs per bus, filters by project_id, run_id, status)
- **Dependency mapping** (upstream/downstream graph)
- **Bottleneck analysis** (which buses are congested; where gating should occur)
- **Refactoring safety** (if a project changes buses, it triggers an explicit review)

---

## Appendices

### Appendix A — Canonical serialization (recommended)

Store the declarations as pipe-separated strings in your portfolio dataset:

- `reads_buses`: `event_bus|summary_bus`
- `writes_buses`: `digest_bus|snapshot_bus`

Empty is allowed and must be represented as an empty string.

### Appendix B — Change control

Any of these require an ADR:

- Introducing a new bus
- Changing a bus’s authoritative index rules
- Allowing an exception to the “no side-channels” rule
- Reclassifying a project’s read/write buses in a way that changes downstream dependencies
