---
title: Corpora Registry
sidebar_position: 18
---

# Corpora Registry

## Purpose

This page defines a **controlled vocabulary of corpora**: stable, named slices of “what Matias wants to dominate” via ingestion → chunking → summarization → embedding → annotation.

This is a **registry-governance object**:
- it constrains sprawl,
- enables consistent policies (`policy_id`) for summarization/embedding,
- allows portfolio-level observability (“what knowledge streams are feeding what projects?”).

**Key principle:**  
> If a corpus is not in this registry, it does not exist (architecturally).  
No silent “just one more feed” additions.

---

## Phase 1 Corpora (Finite Dominance Set)

These six corpora are **Phase 1**, meaning: they are intended to become operational first, and to provide ~80% of knowledge leverage.

### 1) `news_stream`

**Definition:** Curated stream of news and analysis relevant to Matias’s domains (Argentina + global econ/policy/AI + local priorities).  
**In scope:**
- headlines + full articles (where legally accessible)
- newsletters, RSS feeds, public reports framed as “news”
- editorials/op-eds when they shape narrative context
**Out of scope:**
- academic papers (belongs to `academic_papers`)
- primary legal text (belongs to `norms_legal`)
- personal communications (belongs to `matias_internal`)
**Cadence expectations:**
- daily trickle is fine; do not require completeness
- controlled intake rule (example): *N new items/day* as a throttle
**Policy hooks:**
- summarization: `news.digest.v1`, `news.brief.v1`, `news.factline.v1`
- embeddings: yes, for retrieval + clustering
- annotation: stance, topics, entities, “why it matters”, action prompts
- gating: dedupe by URL + title + similarity

---

### 2) `institutional_governance`

**Definition:** Documents, minutes, emails, memos, policies, decisions, actors and context tied to institutions Matias operates in (university, commissions, departments, academic governance, political/institutional networks).  
**In scope:**
- meeting notes / minutes
- institutional announcements
- internal docs, committees, program plans
- stakeholder maps, decisions, disputes (as artifacts)
**Out of scope:**
- formal law/regulations text (belongs to `norms_legal`)
- general news about institutions (belongs to `news_stream` unless it’s internal)
**Cadence expectations:**
- event-driven (whenever meetings happen)
- weekly review loop recommended (index health)
**Policy hooks:**
- summarization: `inst.decision_log.v1`, `inst.meeting_minutes.v1`, `inst.actor_map.v1`
- embeddings: yes, strong value (entity recall)
- annotation: decisions, action items, owners, deadlines, conflict signals, commitments
- gating: require provenance + meeting date + participants if available

---

### 3) `norms_legal`

**Definition:** Legal and regulatory texts relevant to Matias’s civic monitoring and property/legal workflows (province norms/BO, election rules, institutional statutes, compliance-relevant regulations).  
**In scope:**
- official gazette items / resolutions / decrees / statutes
- legal memos and compliance notes grounded in sources
- change detection diffs (amendments)
**Out of scope:**
- non-primary commentary unless explicitly labeled (commentary may go to `news_stream`)
**Cadence expectations:**
- typically daily (gazette cadence) or per publication schedule
- strict integrity: versioning and diffing matter
**Policy hooks:**
- summarization: `legal.brief.v1` (human-readable), `legal.diff_summary.v1`, `legal.obligation_extract.v1`
- embeddings: yes, but with strong metadata boundaries (jurisdiction/date/source)
- annotation: obligations, affected entities, deadlines, enforcement risk, cross-links
- gating: must capture canonical source pointer + publication date

---

### 4) `academic_papers`

**Definition:** Academic literature and research artifacts powering Matias’s research output and credibility.  
**In scope:**
- papers, working papers, dissertations, preprints
- citations, bibliographic metadata, structured notes
- important figures/tables as extracted text context (where possible)
**Out of scope:**
- “news about research” unless treated as news (`news_stream`)
**Cadence expectations:**
- weekly or sprint-based ingestion (batch OK)
- prioritize “reading list” slices over trying to be comprehensive
**Policy hooks:**
- summarization: `paper.summary.v1`, `paper.methods.v1`, `paper.claims.v1`, `paper.related_work.v1`
- embeddings: yes, chunk-level embeddings are core
- annotation: claims, methods, datasets, threats-to-validity, reuse potential
- gating: strict doc_id stability + citation metadata required

---

### 5) `opportunities`

**Definition:** Structured opportunity surface: jobs, grants, collaborations, clients, postdocs, speaking, consulting leads.  
**In scope:**
- job postings, calls for proposals, tenders, grants
- lead notes, outreach drafts, contact context
- “fit” scoring artifacts and decision notes
**Out of scope:**
- generic “industry news” unless it impacts action (then link to `news_stream`)
**Cadence expectations:**
- daily or 2–3x/week scanning; batching is fine
- must support “next action” extraction
**Policy hooks:**
- summarization: `opp.row.v1` (structured), `opp.fit_analysis.v1`, `opp.followup_draft.v1`
- embeddings: yes (for dedupe + semantic matching to Matias profile)
- annotation: deadlines, requirements, contacts, confidence, next step, risk flags
- gating: de-duplication and closure states are crucial

---

### 6) `matias_internal`

**Definition:** Matias-produced knowledge: logs, chats, session summaries, decisions, reflections, drafts, run records, project notes.  
**In scope:**
- Chat transcripts and derived summaries
- mind debrief voice/text
- run manifests / run records (meta)
- internal drafts and notes
**Out of scope:**
- external corpora unless imported and tagged as such
**Cadence expectations:**
- continuous; should be the most reliable stream
- high-value because it ties everything together and drives execution
**Policy hooks:**
- summarization: `session.brief.v1`, `decision.adr.v1`, `weekly.review.v1`, `project.context_brief.v1`
- embeddings: yes (to retrieve your own prior reasoning)
- annotation: decisions, blockers, commitments, next actions, “why”
- gating: privacy boundaries + “public vs private” labeling

---

## Ingestion Boundaries and “Stop the Sprawl” Rules

### Rule A — Corpus addition requires governance
Adding a new corpus ID requires:
- update to this registry page
- an ADR (or explicit registry entry change record)
- an owner + a minimal ingestion boundary definition

### Rule B — Corpus ≠ source
A “source” (e.g., one newsletter) does not justify a new corpus.  
Sources map into existing corpora unless they change the semantic contract.

---

## How Corpora Connect to Summarizer / Embedding / Annotation Policies

### Policy model

Each corpus maps to one or more `policy_id` definitions in `policies.yml`.

A corpus should define:
- default summarization policy (baseline)
- optional variants (brief vs deep; public vs private; extraction vs narrative)
- embedding policy (chunking rules, vector namespace)
- annotation schema (fields to extract)

**Example mapping (conceptual):**
- `news_stream` → `news.brief.v1`, `news.digest.v1`
- `norms_legal` → `legal.diff_summary.v1`, `legal.obligation_extract.v1`
- `opportunities` → `opp.row.v1` (structured), `opp.followup_draft.v1`
- `matias_internal` → `session.brief.v1`, `decision.adr.v1`

### Minimal policy requirements per corpus

For every corpus in Phase 1, define at least:
- one summarization policy
- one embedding/chunking rule set
- one annotation schema (even small)
- a gating/dedupe rule

---

## Update Cadence Expectations (Portfolio-level)

These are *targets* not commandments—used for planning and observability.

- `news_stream`: daily trickle, capped intake
- `institutional_governance`: event-driven + weekly consolidation
- `norms_legal`: per official cadence (often daily)
- `academic_papers`: weekly batches (reading-list driven)
- `opportunities`: 2–7x/week scanning; follow-up loop weekly
- `matias_internal`: continuous + daily/weekly rollups

---

## Phase 2+ Candidate Corpora (Valid, but Deferred)

These are **allowed future expansions**—but explicitly *not Phase 1*.

### A) Culture & Context
- `cultural_context` — key cultural references, canon summaries, historical frames
- `speech_rhetoric` — rhetoric, persuasion, discourse patterns, political speech craft
- `media_library` — movies/series/books/song summaries (as “cultural literacy cache”)

### B) Market & Product Intelligence
- `product_research` — SaaS competitors, feature matrices, product reviews
- `pricing_market_data` — structured pricing across marketplaces (when elevated beyond “news”)

### C) Personal Ops Knowledge
- `lifestyle_protocols` — sleep/fitness/nutrition “protocol notes” (not raw tracking)
- `cooking_recipes` — recipe playbooks + technique summaries (if it becomes a real system)

### D) Client / Consulting Knowledge
- `client_casefiles` — per-client corpora, separated by confidentiality boundaries
- `sector_briefs` — ministry/sector-specific briefings for consulting

### E) Geographic / Spatial Intelligence
- `geo_reference` — boundaries, gazetteers, geocoding metadata, spatial standards notes

### F) Learning / Skills
- `skill_drills` — curated exercises, lessons learned, critique cycles for writing/singing/etc.

**Rule:** these remain *candidates* until promoted by governance.

---

## Operational Hook: `phase1_corpora_consumed`

Each portfolio project may declare a pipe/semicolon list (as per your dataset conventions) of Phase 1 corpora it consumes.

This enables:
- dashboards: “which projects depend on which corpora”
- planning: ensure Phase 1 pipelines unblock the maximum downstream projects
- containment: prevents accidental “18 corpora” drift

---

## Change Control

Any change to:
- Phase 1 corpus list
- a corpus canonical ID
- a corpus boundary definition (in/out scope)
- default policy mapping

…must be recorded as an ADR or an explicit registry change note.

---

## Quick Reference (Phase 1)

| corpus_id | short name | core value |
|---|---|---|
| news_stream | News | narrative + situational awareness |
| institutional_governance | Institutions | power map + decision memory |
| norms_legal | Law/Norms | compliance + civic monitoring |
| academic_papers | Papers | research depth + authority |
| opportunities | Opportunities | jobs/clients/collabs engine |
| matias_internal | Internal | execution + coherence glue |
