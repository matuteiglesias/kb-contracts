# Shared contract decision packet (Phase 1 evidence audit)

**Status:** `APPROVED WITH BOUNDED CORRECTIONS`
**Audit date:** 2026-07-28
**Repository baseline audited:** `1065f9bcd91a0f1ded092f9e4ad4b2afa5d4fa0c`
**Scope:** evidence and Gate 1 recommendations only. This packet does not approve an ADR, implement a schema, or freeze a public artifact shape.

## Audit framing and Local Write Gate 0B

The checkout identified itself as `/workspace/kb-contracts`, was clean on branch `work`, and matched the expected baseline. No `AGENTS.md`, configured Git remote, or remote default branch was present. Repository ownership is inferred unambiguously from the supplied checkout path and the repository's own description as the KB contract catalog (`README.md`, **What this is**). The absence of a remote is recorded rather than treated as a blocker. No other task was editing the checkout.

**LOCAL WRITE GATE: PASS.** Work was isolated by creating `retrofit/shared-contract-release-v1` from the verified HEAD.

| Gate fact | Result |
|---|---|
| Repository | `kb-contracts` |
| Repository root | `/workspace/kb-contracts` |
| Branch / HEAD before work | `work` / `1065f9bcd91a0f1ded092f9e4ad4b2afa5d4fa0c` |
| Remote URL | unavailable (no configured remotes) |
| Remote default branch | unavailable |
| Working tree | clean (`## work`) |
| `AGENTS.md` instructions | none found under `..` |

## Approved Gate 1 disposition (2026-07-28)

Matías Iglesias approved the evidence audit with a narrower authority boundary. KB Contracts owns knowledge-artifact interoperability, not universal pipeline execution. Accordingly:

- the shared product schema is `knowledge_artifact_manifest.v1`, describing one finalized knowledge product;
- `run_bundle_manifest.v1` and a universal run-record schema are excluded from this release and deferred to a future operational-evidence authority;
- producer-native `run_id`, `run_record_ref`, and `producer_manifest_ref` values may be carried only as opaque, case-preserved references;
- Knowledge Interoperability Profile 1 requires a module descriptor, public knowledge schemas, one knowledge artifact manifest per promoted product, portable provenance/checksum, a declared seam, fixtures, offline validation, and compatibility behavior—not a universal run architecture;
- shared IDs are explicit, opaque, case-preserved references. Only registry-assigned module and producer IDs use the lowercase grammar `[a-z0-9][a-z0-9._-]{0,127}`. Universal computed hash vectors are out of scope for v1.

ADR-0006 is the normative authority-boundary decision. The original analysis below remains audit evidence; where a recommendation conflicts with this disposition, the approved disposition controls.

## 1. Current authority map

Material claims below name a file and heading, describe current behavior, and state the implication. "Authority" means current documentary authority, not an assertion that a proposed ADR is accepted.

| Topic | Authoritative current file | Supporting files | Contradictions | Confidence |
|---|---|---|---|---|
| Module identity | `docs/01_registry-governance/ecosystem-map-and-registry.md`, **The registry**: projects have names, bus roles, inputs, outputs, entrypoints, smoke tests, run-record locations, and emitted versions; implication: this is the closest current module registry but defines no machine-readable module ID. | `README.md`, **Operating rule**; `docs/02_bus-contracts/integration-seams-and-allowed-io.md`, **Allowed reads and writes by project role** | No `module.v1`, producer-ID rule, repository URL field, or machine-readable registry exists. Project name, project ID, producer name, and repo are used without a declared identity relationship. | Medium |
| Artifact identity | `docs/03_shared-conventions/manifests-and-integrity-rules.md`, **Manifest schema / Required fields**: family, kind, emitted schema, producer, run, paths, counts and hash characterize a data file; implication: identity is descriptive and path/run-linked, not a frozen `artifact_id`. | Bus-specific manifest sections; `docs/04_publishing/snapshot-publishing-contract.md`, **Snapshot identity** | Shared manifest requires no artifact ID, media type, or exact identity derivation; snapshot IDs do have special determinism rules. | High |
| Stable IDs | `docs/03_shared-conventions/stable-ids-and-naming-rules.md`, **Canonical stable id behavior** and **Naming rules by artifact family**: normalized primitive parts feed a versioned, unambiguous cryptographic hash; implication: implementation requires a frozen serialization, prefix and length that the document currently only recommends. | Bus pages' event/session/summary/chunk ID sections; snapshot publishing identity | The **Test vectors** contain placeholders; algorithm/output defaults are recommendations; some bus-local IDs use different formulas or case rules. | High |
| Manifests | `docs/03_shared-conventions/manifests-and-integrity-rules.md`, **Manifest schema**, **Hashing rules**, **Empty artifact rule**, **Promotion rule**: one corresponding manifest makes each artifact verifiable and atomically consumable; implication: an artifact manifest should preserve this one-product integrity boundary. | Event, Sessions, Summary, Chunk, Digest bus manifest sections | Shared contract calls the discriminator `manifest_version`; bus contracts commonly require `schema_version`. Event Bus shows both `event_manifest.v2` and `event_manifest.v1`. "Do not create multiple manifest types" overlaps with the proposed run-bundle manifest unless its different scope is approved explicitly. | High |
| Run records | `docs/03_shared-conventions/run-record-contract.md`, **Run record schema**: exactly one immutable audit record per execution, including inputs, outputs, stages, status, errors, warnings and environment; implication: a run bundle must reference or envelope, not silently replace, this record. | `docs/03_shared-conventions/error-taxonomy-and-stop-rules.md`, **Canonical error classes**; registry run-record locations | The run-record comment documents an unfrozen mapping from `success/empty_success/partial_success/error` to UI `OK/WARN/FAIL`. No machine-readable schema/version is present. | High |
| Failure evidence | `docs/03_shared-conventions/run-record-contract.md`, **Error object schema / Evidence pointers**: errors include controlled type, stage, durable evidence, remediation and severity; implication: run bundles must retain structured error and durable evidence references even on early failure. | `docs/03_shared-conventions/error-taxonomy-and-stop-rules.md`, class-specific requirements and **Stop rules** | Error taxonomy fixes six values but producer-specific bus pages recommend additional codes; the shared precedence/extension rule is not explicit. | High |
| Schema versioning | `docs/01_registry-governance/adr-index-and-policy.md`, **When an ADR is mandatory**: required-field/interface changes require ADRs and affected version bumps; implication: release metadata must distinguish schema compatibility from release compatibility. | Shared manifest **Change control**; stable-ID **Change control**; bus **Compatibility** sections | Bus pages say optional additions need no bump and consumers support latest+previous; shared manifest says any required-field change bumps. There is no common version grammar or definition of major/minor compatibility. | High |
| Profiles | `docs/03_shared-conventions/contract-profiles-and-promotion-ladder.md`, **Profile 0/1/2**: Profile 1 requires schema version, manifest, run record, stable IDs, seam and tests; implication: Gate 1 should make those claims machine-verifiable. | `docs/01_registry-governance/adr-0005-contract-profiles-and-promotion.md`, **Decision**, **Validation plan** | ADR-0005 status is `proposed`, while the profile page uses normative "must" language. ADR open question leaves profile encoding unresolved. | High |
| Validation | `docs/07_contract-tests/contract-compliance-tests.md`, **Test catalog**: T001–T007 define artifact-based schema, provenance, integrity, run-record, empty-output and seam checks; implication: a release validator can implement these without importing producers. | `package.json`, `scripts`; bus smoke-test sections; registry smoke-test column | Test implementations, schemas, fixtures, and concrete producer commands are absent; registry entries contain descriptive smoke placeholders. | High |
| Compatibility | Bus contract **Compatibility rules** sections (notably Event, Sessions and Summary): optional semantic-preserving additions need no bump and consumers support latest plus previous; implication: this is evidence for a bounded rolling window. | ADR policy; manifest/stable-ID change control; storage adapter policy | No ecosystem-wide alias, deprecation, release-candidate, historical-manifest, extension, or mixed-version policy exists. | Medium-high |

### Existing schemas, fixtures, indexes, and commands

- `git ls-files` found **no tracked schema, fixture, example, or test-vector directories/files**. Current "schemas" are prose field lists in bus and shared-contract pages; implication: the proposed `contracts/` tree would be a new consumable surface, not a relocation of existing JSON Schema.
- `docs/01_registry-governance/ecosystem-map-and-registry.md`, **The registry**, is the project/seam index; `docs/01_registry-governance/adr-index-and-policy.md`, **ADR index**, is the decision index. Both are Markdown, so consumers presently must parse prose or copy facts.
- `package.json`, `scripts`, offers `npm run build` and `npm run typecheck` but no contract validator. `docs/06_runbooks/project-runbook-index.md`, **Required runbook fields**, says concrete smoke commands belong in project runbooks, while its closing note admits placeholders remain. The registry's **The registry** likewise describes smoke behavior rather than executable commands.

## 2. Artifact manifest

### Proposed meaning

`knowledge_artifact_manifest.v1` should describe **one finalized logical product and its physical payload (file or declared directory snapshot)**, not one execution. Many artifact manifests may refer to the same run. Its job is payload discovery, schema identification, integrity, provenance, and consumer admission. This preserves `manifests-and-integrity-rules.md`, **Why manifests exist**, **Manifest placement and naming**, and **Promotion rule**. A run-level aggregation is instead `run_bundle_manifest.v1`.

| Concern | Classification | Evidence, current behavior, and contract implication |
|---|---|---|
| One product vs one run | **Recommended for Gate 1**: one product; credible alternative is one artifact set/partition. | Shared manifest **Manifest placement and naming** says every data endpoint has a corresponding manifest; run record **Location and naming** says exactly one record per run. Keeping these scopes distinct avoids duplicate authorities. |
| Artifact identity | **Recommended for Gate 1**: required opaque `artifact_id`, immutable for the manifested logical payload. | Current shared required fields omit it; stable-ID rules are incomplete. Gate 1 must choose whether it is supplied or derived before freezing. |
| Family and kind | **Already decided**: required registered `artifact_family` and `artifact_kind`. | Shared manifest **Required fields** names both. Registries for allowed values are currently prose/deferred. |
| Schema identity | **Already decided in concept**: emitted object schema version; **Gate 1 recommendation**: pair stable schema ID with version rather than ambiguous `schema_version_emitted` alone. | Shared manifest **Required fields** and bus manifests require versions, but naming differs. |
| Producer identity/version | **Already decided** as required name and version; **Gate 1** should use stable `producer_id` plus version and optional display name. | Shared manifest **Required fields**; Event Bus **Minimum required fields** uses a producer object with repo/version/commit. |
| Media type | **Recommended for Gate 1**, required for payloads. | Current pages distinguish JSON, JSONL, Parquet and directories through prose; machines otherwise guess parsing/canonicalization. |
| Byte size | **Credible alternative / optional now**. | Shared manifest **Optional but recommended fields** makes `byte_size` optional. Requiring it improves transport checks but changes present policy. |
| Checksum | **Already decided**: cryptographic payload checksum plus algorithm and canonicalization, sha256 recommended. | Shared manifest **Hashing rules** requires data hash and declared algorithm/canonicalization; exact-byte hashing is preferred. |
| Logical reference | **Recommended for Gate 1**: required logical name/URI independent of deployment. | Run-record inputs/outputs require `name`; shared manifest lacks it. This separates identity from location. |
| Physical/repository-relative reference | **Already decided**: relative `data_path` and `manifest_path`; **Gate 1** should prohibit absolute local paths in portable releases. | Shared manifest **Required fields**. Stable-ID **Canonical normalization rules** warns against environment-specific absolute paths. |
| Creation timestamp | **Already decided**: UTC ISO 8601 `created_at`; it is metadata, not identity unless an approved family explicitly says so. | Shared manifest **Required fields**; snapshot identity explicitly excludes build timestamps. |
| Provenance | **Already decided**: input-manifest paths/hashes/versions and `run_id`; **Gate 1** should model references consistently. | Shared manifest **Input manifest referencing**. |
| Validation status | **Already decided**: `integrity.complete` and `integrity.validation_status`; **Gate 1** should freeze enum and validator/version evidence. | Shared manifest **Required fields** and **Validation expectations**. |
| Counts/time range | **Already decided for current data manifests**; **credible alternative** is conditional by artifact kind. | Shared manifest **Required fields** requires them even for no-timestamp artifacts; non-record payloads may need explicit not-applicable semantics. |
| Environment, warning/error summaries | **Optional now**. | Shared manifest **Optional but recommended fields**. Detailed failures belong to the run record. |
| Extensions, registries, directory Merkle/canonical JSON details | **Deferred** pending ADR and vectors. | Shared manifest **Canonicalization**, **Algorithm**, and **Change control** require explicit decisions/versioning. |

The phrase "do not create multiple manifest types for the same artifact family" in **Manifest placement and naming** is not silently overridden: Gate 1 must confirm that a run-bundle manifest is a run index, not a second artifact manifest.

## 3. Run-bundle manifest

### Proposed meaning and comparison

`run_bundle_manifest.v1` should describe **the bounded set of evidence and products belonging to one invocation**, including zero-product and failed invocations. It is a discoverability/integrity index over a run, while the run record remains the semantic audit trail. The artifact manifest answers "what is this product and are its bytes safe?"; the run bundle answers "what belongs to this run and is the evidence set complete?"; the run record answers "what happened and why?"

| Concern | Gate 1 recommendation | Current evidence and implication |
|---|---|---|
| Run identity | Required `run_id`; preserve producer-native casing. | Run record **Required top level fields** requires globally unique-within-project `run_id`; stable derivation is not defined. |
| Producer/module | Required stable `module_id`, `producer_id`, and producer version. | Run record currently uses `project` and `entrypoint`; registry uses project role. Gate 1 must define linkage rather than rename history. |
| Lifecycle/status | Required bundle state (`incomplete`, `complete`) and run outcome mirroring the referenced run record (`success`, `empty_success`, `partial_success`, `error`). | Run record **Status semantics** is authoritative for outcome; bundle completeness is a separate integrity property. |
| Request/invocation | Required reference or safe normalized invocation; secrets excluded. | Run record **entrypoint** and **Environment section** record command/config fingerprint and prohibit secrets. |
| Inputs | Required structured artifact/manifest refs, including missing/substituted resolution. | Run record **Inputs section** already fixes these semantics. Avoid duplicating mutable detail: bundle should reference IDs/hashes and the record. |
| Output artifacts | Required array, allowed empty. | Run record **Outputs section** and shared manifest **Empty artifact rule** distinguish empty from missing. |
| Artifact-manifest refs | Required for every promoted output; each ref includes ID/path/hash. | Profile 1 requires a manifest; output records currently carry `manifest_path`. |
| Failure evidence | Required run-record reference even on failure; optional durable evidence refs with hashes. | Run record is required on early failure and its **Evidence pointers** require durable artifacts. |
| Warnings | Optional summary/count plus run-record reference. | Run-record warning objects are authoritative; copying full warnings risks divergence. |
| Checksums | Required for the run record, referenced artifact manifests, and durable evidence included in the bundle. | Shared manifest **Hashing rules** anchors payload bytes; a bundle needs equivalent tamper detection but canonicalization is Gate 1 work. |
| Timestamps | Required `created_at`; optional/final `completed_at`, null while incomplete. | Run record permits null completion after crash. |
| Intentional empty run | Complete bundle, outcome `empty_success`, zero outputs where contract allows, reason codes, and a valid run record; required empty artifact endpoints still receive zero-count manifests. | Run record **Status semantics**, manifest **Empty artifact rule**, and error taxonomy **Allowed empty outputs**. |
| Failed/incomplete run | Must be publishable as evidence without pretending outputs are consumable: state `incomplete` or outcome `error`, referenced record/evidence, and only actually promoted outputs. | Error taxonomy **Mandatory halt conditions**; run-record output `promotion_status`. Final publication mechanics are deferred. |

**Relationship choice needing approval:** recommended is a small bundle containing a content-addressed `run_record_ref`, never an embedded second copy. Credible alternative: make the run record itself the bundle root by adding integrity-index fields in a new run-record version. The alternative reduces artifacts but couples discovery, audit semantics, and byte inventory.

## 4. Smallest viable `module.v1` descriptor

The descriptor identifies a contract participant and makes its seam claim testable. It must not become a catalog of internal implementation details.

| Field / group | Status | Proposed minimum semantics and evidence |
|---|---|---|
| `schema_id`, `schema_version` | **Required now** | Self-identify `module.v1`; version markers are governance non-negotiables in ADR-0005 **Decision**. |
| `module_id` | **Required now** | Stable, opaque identity. Registry **The registry** currently only has display project names, so its derivation/value needs Gate 1 approval. |
| `name` | **Required now** | Human-readable label, not identity; current registry's Project column supplies this role. |
| `description` | **Optional now** | Human metadata only. |
| `repository` (`repository_id`, canonical URL) | **Required now** | Establish ownership/source without relying on a checkout path; registry **Integration constraints** forbids internal coupling. Commit belongs to releases/runs, not module identity. |
| `contract_profile` | **Required now** | One of declared Profile 0/1/2 plus claim status; profile page **Promotion rule** gates cross-repo reuse. Encoding is an ADR-0005 open question, so final enum awaits approval. |
| `producer_capabilities` | **Optional now** | Controlled capability IDs. The registry bus role is evidence, but minimum interoperability can be expressed by accepted/emitted families instead. |
| `emits.artifact_families` | **Required now** | Declared outputs corresponding to registry Primary outputs. |
| `accepts.artifact_families` | **Required now** | Declared inputs/seams corresponding to registry Primary inputs. Empty array is explicit for source producers. |
| `emits.schema_versions` | **Required now** | Registry explicitly tracks emitted versions. Use schema IDs + supported versions. |
| `accepts.schema_versions` | **Required now** | Needed to enforce consumer version validation in Profile 1 and mixed-version policy. |
| `validation.command` | **Required now** | One deterministic command; registry admission and compliance tests require a smoke/validation command. |
| `contract_release` (`release_id`, manifest ref/hash) | **Required now** | Makes the claim resolve to exact machine-readable authority rather than Markdown or guessed commit. |
| Maintainers, license, language/toolchain, entrypoint list | **Optional now** | Helpful human/runtime details but unnecessary for contract matching. |
| Deployment config, secrets, internal package layout, runtime library/API | **Deferred** | Explicitly outside run-record and compliance-test scope; would broaden the contract. |

## 5. Machine-readable contract release

### Recommended repository structure

The candidate is appropriate as a **new versioned distribution surface**, with registry/release manifests as JSON and schemas as standalone JSON Schema. It lets consumers fetch files, validate offline, and pin hashes without parsing Docusaurus Markdown or importing repository JavaScript.

```text
contracts/
├── registry.json
├── schemas/
│   ├── module.v1.schema.json
│   ├── knowledge_artifact_manifest.v1.schema.json
│   └── knowledge_profile_claim.v1.schema.json
├── test_vectors/
│   └── stable_references.v1.json
├── examples/
│   ├── valid/
│   └── invalid/
└── releases/
    └── kb_interop_release.v1-rc1.json
```

`registry.json` should be a stable bootstrap index of known schema IDs and releases, not an unversioned duplication of every release. `kb_interop_release.v1-rc1.json` should be the signed-off inventory; every referenced file must live at a repository-relative path and carry sha256.

| Release property | Recommendation | Evidence / implication |
|---|---|---|
| Release ID | **Required** immutable opaque/versioned ID. | Current ADR IDs and schema strings are separate concepts; consumers need one pin. |
| Release status | **Required**: at minimum `release_candidate`, `final`, `deprecated`. | ADR lifecycle provides precedent but release lifecycle is currently absent; approval semantics must not be inferred from Git branches. |
| Release timestamp | **Required** UTC metadata, excluded from content identity. | Shared contracts consistently require UTC creation timestamps. |
| Source commit | **Required** full Git object ID. | This prevents guessing authoritative commit; module run/environment already records commits when available. |
| File hashes | **Required** sha256 for every schema, vector, and normative example; hash canonical file bytes. | Shared manifest **Hashing rules** makes hashes the integrity anchor and prefers exact written bytes. |
| Schema IDs | **Required**, with path, `$id`, version, and compatibility classification. | Current schema strings are inconsistent and prose-only; a registry must resolve them. |
| Compatibility metadata | **Required** per schema and release (`compatible_with`, breaking status, support window). | Latest+previous appears in bus pages but is not machine-readable. |
| Test-vector references | **Required** with hashes. | Stable-ID page **Test vectors** requires cross-implementation anchors but supplies placeholders. |
| Migration guidance | **Required for breaking/deprecating releases**, optional otherwise; use a repository-relative document/ref plus hash. | ADR policy and manifest/stable-ID change control require migration notes. Markdown may be guidance, but machines need not parse it to validate. |
| Validation command | **Required** literal `npm run contract:validate` plus validator version/requirements. | ADR policy **Validation must be runnable**; present package lacks such a command. |

**Credible alternative:** publish a generated tarball/package containing the same files and a root manifest. It improves transport but must not replace the checked-in, hash-addressed files or require importing code. **Fixed for implementation:** JSON Schema Draft 2020-12, UTF-8 JSON, SHA-256 over exact finalized bytes, repository-relative paths, deterministic fixtures, source commit inventory, and offline validation. **Deferred:** signing mechanism, external hosting/package coordinates, release ID derivation, and retention policy.

## 6. Stable references for v1

Gate 1 rejected a universal hash-derived ID algorithm for v1. Shared references are explicit, opaque to generic consumers, case-preserving, stable once published, typed by field context, and checked against a bounded grammar where applicable. Generic consumers must not lowercase, recompute, infer from filenames, or derive source/record/artifact IDs from display names.

Module and producer IDs are registry-assigned lowercase values matching `[a-z0-9][a-z0-9._-]{0,127}`. Source, record, and artifact IDs are producer-assigned and case-preserved. Run IDs are outside KB Contracts authority; when present, they are opaque producer-native references. Slugs remain presentation/routing values and are never source identity.

`stable_references.v1.json` must freeze preservation and validation vectors for valid/invalid module and producer IDs, case-preserved source/record/artifact IDs, producer-native run references, distinct source ID versus published slug, alias agreement/conflict behavior, and unchanged historical IDs. It must not freeze universal computed hashes. A producer may use a hash-derived fallback only under its own versioned contract specifying inputs, ordering, serialization, normalization, algorithm, prefix, and output length.

## 7. Bounded compatibility policy

Recommended policy (all public changes still require the ADR process in `adr-index-and-policy.md`, **When an ADR is mandatory**):

| Change | Policy |
|---|---|
| Additive optional field | Compatible within the same schema version only when semantics/default absence are unchanged, consumers must ignore unknown fields, and valid/absent examples pass. This matches Event/Sessions/Summary compatibility sections. |
| Additive required field | Breaking for old producers and historical documents; create a new schema version. Do not retrofit old manifests. |
| Removed or renamed field | Breaking; new schema version. A rename is modeled temporarily as old alias + new canonical field, never an undocumented swap. |
| Compatibility alias | May bridge versions only with deterministic precedence: canonical field wins when values agree; conflicting alias/canonical values fail validation. Preserve original historical values. |
| Deprecated alias | Must carry introduction, deprecation, replacement, and removal release; accept for at least the stated latest+previous window. Emitters should stop writing it before consumers stop reading it. |
| Schema-version bump | Required for required-field, semantic, normalization, hash, enum-removal, or identity changes. Version grammar and whether optional additions increment a minor component remain Gate 1 decisions. |
| Release candidates | Immutable and explicitly `release_candidate`; may be incompatible with earlier candidates, cannot be claimed as final, and require all offline validation to pass before promotion. |
| Final releases | Immutable, Matías-approved, full commit and hashes; corrections create a new release, never mutate the old one. |
| Mixed-version consumers | At minimum read latest final and immediately previous final schema versions, matching bus precedent. Writers emit one declared version per artifact; adapters perform explicit conversion. No guessing/coercion. |
| Historical manifests | Validate against their declared historical schema/release; never require newly added fields or recompute stable IDs. Retain schemas/vectors for the support/retention window. |
| Producer-native extensions | Allowed only in a namespaced `extensions` object, ignored by generic consumers, prohibited from changing canonical semantics, required fields, IDs, or integrity. Promotion claims cannot depend on an unknown extension. |

**Credible alternative:** strict version-per-any-shape-change (including every optional addition) is simpler and more reproducible but produces more versions than existing bus policy. **Deferred:** semantic-version syntax, duration beyond latest+previous, alias sunset duration, signature policy, and support for pre-release production data.

## 8. Golden-path validation

### Current command inventory and audit results

| Command | Result / fact established |
|---|---|
| `npm run typecheck` | Existing non-mutating TypeScript check; failed because existing site imports/types could not be resolved (`@docusaurus/useBaseUrl`, `@docusaurus/Link`, `@theme/Layout`, CSS module types, and `JSX`). This audit changed no site code. |
| `npm run build` | Existing Docusaurus production build; passed during this audit. It validates the documentation site, not contracts. |
| Producer smoke commands | No exact runnable command exists in this repository. Registry **The registry** contains behavioral placeholders, and `project-runbook-index.md` says placeholders await final runbooks. |
| Contract compliance tests | `contract-compliance-tests.md`, **Test catalog**, specifies T001–T007 but contains no implementation command. |

### Recommended future command (not implemented here)

`npm run contract:validate` should be the one obvious, deterministic, offline entrypoint. It should:

1. validate `contracts/registry.json` and every `kb_interop_release.v1-rc1.json` against their own schemas;
2. verify the release's source-commit format, unique IDs, safe repository-relative paths, complete file inventory, and sha256 for every referenced file;
3. meta-validate all three JSON Schemas and ensure each `$id`/version agrees with registry and release entries;
4. validate every `examples/valid/**` instance and assert every `examples/invalid/**` instance fails for its declared reason;
5. run every frozen `stable_references.v1.json` preservation/grammar vector, including case-preserved public references, opaque run references, source-ID/slug distinction, alias conflicts, and unchanged historical IDs;
6. validate cross-references among module descriptors, knowledge artifact manifests, schemas, profiles, families, stable references, and release claims;
7. cover Profile 1's module + public schema + per-product manifest + portable provenance + seam + fixture + compatibility minimum and the applicable knowledge-interoperability assertions on included fixtures;
8. use only checked-in code/data and the lockfile, with no clock, network, filesystem-order, locale, or absolute-path dependency.

Pass means identical results on repeated clean runs and no untracked/generated changes. It validates shapes and deterministic contract behavior, not producer internals or model quality.

## 9. Human Gate 1 decision table

| Decision | Approved option | Credible alternative | Evidence | Consequence | Blocks producer implementation? |
|---|---|---|---|---|---|
| Meaning of `knowledge_artifact_manifest.v1` | One finalized knowledge product with schema, producer, portable payload, exact-byte integrity, and knowledge provenance. | Move a generic `artifact_manifest.v1` to a genuinely general authority. | ADR-0006 **Decision**; shared manifest artifact-level rules. | Keeps operational lifecycle out of the knowledge product envelope. | **No; approved** |
| Meaning of `run_bundle_manifest.v1` | Not a KB Contracts standard; producer bundles remain producer-owned and references are opaque. | Establish it later under an operational-evidence authority. | ADR-0006 **Decision** and **Consequences**. | No universal run-bundle schema enters this release. | **Yes, for universal run-contract work** |
| Profile 1 manifest requirements | Module descriptor, public schemas, one knowledge manifest per product, stable references, portable provenance, seam, fixtures, offline validation, and compatibility behavior. | Add operational-evidence maturity through an independent future profile. | Profile ladder **Profile 1**; ADR-0006. | Interoperability does not prescribe execution architecture. | **No; approved** |
| Minimum `module.v1` fields | `schema_id`, `schema_version`, `module_id`, `name`, `repository`, `knowledge_profile`, `accepts`, `emits`, `validation`, `contract_release`. | Producer-only descriptor without accepted versions. | Registry **The registry**; approved Gate 1 structure. | Enables machine matching and exact release claims. | **No; approved** |
| Compatibility stance | Optional semantic-preserving additions compatible; required/removal/rename/semantic/checksum/identity/cardinality changes version; explicit aliases; current+previous finals. | Version every structural addition. | ADR policy and bus compatibility precedent. | Preserves historical artifacts and bounds mixed-version support. | **No; approved** |
| Stable-ID vectors to freeze | Preservation/grammar vectors only; module/producer IDs lowercase registry-assigned, other shared references producer-assigned and case-preserved. | Register producer-owned hash algorithms in a later release. | ADR-0006; stable-ID audit evidence. | Avoids premature universal serialization while preventing reference drift. | **No; approved** |
| Explicitly deferred issues | Universal run/record IDs and schemas, lifecycle/status/error/environment/retry/staging/promotion/rollback, signatures, distribution, retention, runtime library, and MCP schemas. | Create a separately authorized operational contract later. | ADR-0006 **Decision** and **Consequences**. | Keeps v1 pruned to knowledge interoperability. | **Yes only for deferred domains** |

**Final authority: APPROVED WITH BOUNDED CORRECTIONS (MATÍAS IGLESIAS).** The pruned knowledge-contract infrastructure may proceed. Universal run-contract implementation remains blocked and outside this release.

## Contradictions and unresolved overlaps

1. **Manifest discriminator:** shared manifest **Required fields** mandates `manifest_version`; Event/Sessions/Summary bus minimum manifests use `schema_version`. A compatibility alias/precedence is not specified.
2. **Event manifest versions:** `docs/02_bus-contracts/event-bus-contract.md`, **Canonical event schema**, gives manifest example `event_manifest.v2`; **Manifest schema** later gives `event_manifest.v1`. Neither declares precedence.
3. **Manifest cardinality/type (resolved by ADR-0006):** shared manifest **Manifest placement and naming** prohibited multiple manifest types for one family while the audit considered a run bundle. The release now defines only the per-product knowledge artifact manifest; producer bundles remain outside KB authority.
4. **Profiles' authority:** `contract-profiles-and-promotion-ladder.md` uses mandatory language, but ADR-0005 **Status** is `proposed`, and its **Open questions** leaves profile encoding undecided.
5. **Stable-ID freeze gap:** stable-ID **Test vectors** contains placeholder hashes; **Hash algorithm** and **Output format** state recommendations rather than fixed bytes/prefix length. Claimed cross-language compliance is therefore not currently executable.
6. **Run/UI status overlap:** the comment in run-record contract documents the missing mapping between run statuses and `OK/WARN/FAIL`; aggregators may disagree.
7. **Error-code overlap:** shared error taxonomy **Canonical error classes** says all errors use six values, while bus pages publish additional recommended codes without a documented subtype/precedence mapping.
8. **Compatibility/versioning overlap:** bus pages allow semantic-preserving optional additions without a bump and require latest+previous support; shared change-control pages demand bumps for specified interface changes, but no common version grammar or release compatibility policy resolves the boundary.
9. **Registry versus executable evidence:** ecosystem registry names roles, versions and descriptive smoke behaviors, but no machine-readable registry, exact smoke commands, schemas, fixtures, or implemented compliance tests exist.

## Commands executed and results

| Command | Result |
|---|---|
| `pwd` | Passed; `/workspace/kb-contracts`. |
| `find .. -name AGENTS.md -print` | Passed; no files found. |
| `git rev-parse --show-toplevel` | Passed; `/workspace/kb-contracts`. |
| `git branch --show-current` | Passed; `work` before isolation. |
| `git rev-parse HEAD` | Passed; expected baseline `1065f9bcd91a0f1ded092f9e4ad4b2afa5d4fa0c`. |
| `git status --short --branch --untracked-files=all` | Passed; clean `## work` before work. |
| `git remote -v` | Passed; empty, no configured remote. |
| `git symbolic-ref --quiet --short refs/remotes/origin/HEAD \|\| true` | Passed; empty, no remote default. |
| `git config --get remote.origin.url \|\| true` | Passed; empty. |
| `git ls-files \| wc -l` | Passed; 85 tracked files at baseline. |
| `git branch --list retrofit/shared-contract-release-v1` | Passed; branch absent. |
| `git switch -c retrofit/shared-contract-release-v1` | Passed; branch created from verified HEAD. |
| `find . -maxdepth 4 -type f -not -path './.git/*' \| sort` | Passed; inspected repository inventory (including installed dependencies). |
| `rg -n --glob '!package-lock.json' 'manifest\|run.?record\|stable.?id\|profile\|compliance\|registry\|schema\|fixture\|compatib\|integrity\|checksum\|producer\|artifact\|validation' .` | Passed; broad evidence discovery; output was large/truncated, followed by targeted reads. |
| `cat`/`sed -n` on the exact files listed below | Passed; substantive contract sections inspected. |
| `git ls-files \| rg '(^\|/)(schemas?\|fixtures?\|examples?\|tests?)(/\|$)\|\\.schema\\.json$'` | Passed with no matches; no tracked implementations/fixtures. |
| `rg -n --glob '*.md' ... README.md docs \| head -300` | Passed; found documentation/build/smoke references and placeholder commands. |
| `npm run typecheck` | Failed on pre-existing site module/type resolution errors: `@docusaurus/useBaseUrl`, `@docusaurus/Link`, `@theme/Layout`, `index.module.css`, and `JSX`. |
| `npm run build` | Passed; Docusaurus generated static files. |
| `git status --short` | Passed before final staging; only this report was untracked. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed immediately before commit. |

## Exact files inspected

- `README.md` — repository authority, operating rule, local development.
- `package.json` — existing build/typecheck scripts and absence of contract validation.
- `docs/01_registry-governance/adr-index-and-policy.md` — decision index, lifecycle, change control, validation bar.
- `docs/01_registry-governance/adr-0005-contract-profiles-and-promotion.md` — proposed profile decision, requirements, open encoding question.
- `docs/01_registry-governance/ecosystem-map-and-registry.md` — project/role/seam registry and descriptive smoke tests.
- `docs/02_bus-contracts/event-bus-contract.md` — event/manifest identity, integrity, version contradiction and compatibility.
- `docs/02_bus-contracts/sessions-bus-contract.md` — session/cluster manifests, empty runs and compatibility.
- `docs/02_bus-contracts/summary-bus-contract.md` — summary families, provenance, manifests and compatibility.
- `docs/02_bus-contracts/chunk-bus-contract.md` — chunk IDs/manifests, hashing, idempotency and smoke expectations.
- `docs/02_bus-contracts/digest-bus-contract.md` — bundle-like bag/index structure, run records, integrity and promotion.
- `docs/02_bus-contracts/integration-seams-and-allowed-io.md` — producer/consumer roles and allowed IO.
- `docs/03_shared-conventions/contract-profiles-and-promotion-ladder.md` — normative Profile 0/1/2 requirements.
- `docs/03_shared-conventions/manifests-and-integrity-rules.md` — shared manifests, hashes, empty artifacts and atomic promotion.
- `docs/03_shared-conventions/run-record-contract.md` — execution record, stages, references, errors/warnings and status.
- `docs/03_shared-conventions/stable-ids-and-naming-rules.md` — normalization, family inputs and placeholder vectors.
- `docs/03_shared-conventions/error-taxonomy-and-stop-rules.md` — failure evidence, six classes and halt/empty behavior.
- `docs/03_shared-conventions/observability-indexes-contract.md` — UI status/index overlap and deterministic rebuild references.
- `docs/04_publishing/snapshot-publishing-contract.md` — snapshot identity and timestamp/path exclusions.
- `docs/05_storage/storage-boundaries-and-adapter-policy.md` — compatibility/adapter and rebuildability references.
- `docs/06_runbooks/project-runbook-index.md` — expected concrete commands and acknowledged placeholders.
- `docs/07_contract-tests/contract-compliance-tests.md` — profile-aware T001–T007 definitions and pass criteria.

## Implementation readiness and blockers

The pruned knowledge-contract infrastructure **may begin** under ADR-0006 and the migration plan. Implement only `module.v1`, `knowledge_artifact_manifest.v1`, `knowledge_profile_claim.v1`, stable-reference preservation vectors, fixtures, the release inventory, and the offline validator. Universal run records, run bundles, lifecycle/error/environment/promotion contracts, universal derived-ID algorithms, runtime libraries, and MCP schemas remain blocked or deferred. Release approval remains with Matías.
