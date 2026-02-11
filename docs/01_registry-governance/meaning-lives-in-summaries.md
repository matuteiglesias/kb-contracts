---
title: Meaning Lives in Summaries
sidebar_position: 26
---

# Meaning Lives in Summaries

## Why this page exists

Your portfolio stopped feeling “heavy” the moment you made summaries the **control surface**.

This is not a slogan. It’s an architectural rule:

> **Summaries are the representation layer for knowledge.**  
> They are the normalized interface between raw corpora and downstream products.

If you don’t freeze this, the system quietly regresses to “raw chunks everywhere” and everything becomes expensive again: queries, decisions, publishing, even planning.

---

## The control-surface rule

### 1) Summaries are the meaning surface

Raw text is the substrate. Summaries are the **operational surface** you can route, join, gate, publish, and audit.

- Raw chunks are high-entropy and expensive to reason over.
- Summaries are low-entropy and composable.
- The system’s *center of gravity* should live at the summary layer.

### 2) Summaries are the join key across corpora

Corpora are your *what to know*. Projects are your *what to do*.  
Summaries are the *bridge*.

In practice:
- Corpora ingest → chunk → **summarize** (plus optional embed/annotate)
- Downstream projects consume summaries to produce digests, snapshots, posts, decisions, action queues.

**This makes summaries the “exchange currency” of the portfolio.**

### 3) The Summary Bus is a hub, not a leaf

Treat `summary_bus` as your **main junction**:
- Producers (Role A) output raw truth to `chunk_bus` / `event_bus`.
- Transformers (Role B) convert raw truth → summaries on `summary_bus`.
- Publishers (Role C) are mostly consumers of `summary_bus` (often via `digest_bus` / `snapshot_bus`).
- Governance (Role D) watches all of it and enforces stop rules.

If the Summary Bus is not a hub, the portfolio becomes raw-data-centric again.

---

## Minimal definitions to add to Glossary

Add these terms to `/docs/01_registry-governance/glossary`:

- **corpus**: a governed slice of knowledge with explicit in-scope/out-of-scope boundaries; the unit of “finite dominance”.
- **summary**: a controlled, policy-defined representation of source content whose purpose is to preserve meaning while reducing entropy; must carry provenance pointers back to canonical sources.
- **meaning surface**: the portfolio layer where knowledge becomes operationally usable (routable, joinable, auditable). In this system, that layer is summaries.
- **digest**: a packaged multi-summary artifact intended for consumption (human or publisher), typically assembled via selection + ordering + framing rules.
- **snapshot**: a published, immutable surface artifact (site page, post, dataset release, docs build) traceable to upstream digests/summaries/manifests.

---

## Ecosystem map adjustment

In `/docs/01_registry-governance/ecosystem-map-and-registry` (or wherever the system diagram lives):

- draw `summary_bus` as a central hub
- show `chunk_bus` and `event_bus` feeding into it via Role B transformers
- show `digest_bus` and `snapshot_bus` as **downstream of summaries**, not parallel alternatives

A portfolio that routes on summaries stays light.
A portfolio that routes on raw text gets slower the more it grows.

---
