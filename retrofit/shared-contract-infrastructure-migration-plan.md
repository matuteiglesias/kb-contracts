# Knowledge contracts infrastructure migration plan

**Decision basis:** ADR-0006 and Human Gate 1 approval dated 2026-07-28
**Target release:** `kb-interop.v1-rc1`
**Status:** work packages 1, 2, 4, and 5 implemented; release candidate assembled for authority review

## Implementation progress

As of the current implementation change:

- **Work package 1 complete:** `contracts/registry.json` bootstraps exactly the three approved schema identities and the Knowledge Interoperability Profile 1 claim schema. The offline validator performs the deliberately minimal closed-shape, uniqueness, safe-path, file-existence, and authority-boundary checks.
- **Work package 2 complete:** all three Draft 2020-12 schemas and their initial valid/invalid fixtures are checked in with closed required cores and optional namespaced `extensions` containers.
- **Golden-path foundation complete:** `npm run contract:validate` meta-validates and compiles the schemas, checks the registry, accepts every valid fixture, and requires every invalid fixture to fail for its declared keyword without network access.
- **Work package 4 complete:** required-field negatives cover every exercised required location; additional fixtures cover absolute payload paths, malformed IDs, altered case, alias conflicts, checksum grammar, undeclared schema/release references, optional namespaced extensions, current/previous consumption, and unchanged historical validation.
- **Work package 5 complete:** the validator now covers the registry, three schemas, all examples, stable-reference vectors, cross-references, safe paths, release inventory, exact-byte SHA-256 hashes, the pinned source commit, determinism, offline execution, and worktree preservation.
- **Release candidate assembled:** `kb_interop_release.v1-rc1.json` is pinned to the real normative-input commit and excludes itself from its checksum inventory to avoid self-reference. Matías retains release approval. Stable-reference vectors and `v1-rc1.md` are now present; producer adoption and any final-release promotion remain pending.

## Objective

Add a machine-readable knowledge interoperability release next to the Docusaurus manual. Consumers must be able to validate a module and its promoted knowledge products without parsing Markdown, importing JavaScript from this repository, accessing the network, or guessing the authoritative commit.

The implementation must remain inside the authority boundary: knowledge artifacts, shared references, compatibility, profiles, fixtures, and release integrity. It must not standardize execution lifecycle or producer operations.

## Pruned target tree

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
├── releases/
│   └── kb_interop_release.v1-rc1.json
└── migrations/
    └── v1-rc1.md
```

Explicitly excluded from this release: `run_record`, `run_bundle_manifest`, `operational_error`, promotion lifecycle, runtime libraries, and MCP-specific schemas.

## Standards fixed for implementation

- JSON Schema Draft 2020-12.
- UTF-8 JSON files.
- SHA-256 over exact finalized file bytes.
- Repository-relative release paths; absolute local paths are invalid.
- Deterministic checked-in valid and invalid fixtures.
- A release manifest containing the full source commit and checksum inventory.
- An immutable release candidate: corrections receive a new release ID.
- One deterministic, offline golden path: `npm run contract:validate`.

## Work packages

### 1. Bootstrap the release registry

Create `contracts/registry.json` as a versioned bootstrap document that resolves schema IDs, profile IDs, and release IDs to repository-relative files. Do not duplicate complete release inventories in the registry.

**Exit criteria:** unique IDs; safe relative paths; no operational schema entries; registry validates against a checked-in schema or a deliberately minimal bootstrap check.

### 2. Implement the three schemas

Implement only:

- `module.v1`, with the approved `schema_id`, `schema_version`, `module_id`, `name`, `repository`, `knowledge_profile`, `accepts`, `emits`, `validation`, and `contract_release` fields;
- `knowledge_artifact_manifest.v1`, describing one finalized knowledge product with the approved minimum fields;
- `knowledge_profile_claim.v1`, expressing Knowledge Interoperability Profile 1 without run-record or run-bundle requirements.

Use closed required cores and one optional namespaced extension container. Unknown enum values are tolerated only where the schema and consumer rule explicitly say so.

**Exit criteria:** each schema has a stable `$id`, declares Draft 2020-12, has valid and invalid examples, and contains no universal operational lifecycle fields.

### 3. Freeze stable-reference vectors

Create `stable_references.v1.json` for validation and preservation rather than universal ID computation. Cover:

- valid and invalid lowercase registry-assigned module/producer IDs using `[a-z0-9][a-z0-9._-]{0,127}`;
- exact case preservation for source, record, and artifact IDs;
- opaque producer-native run references;
- distinct `source_id` and `published_slug` values;
- canonical/legacy alias agreement and conflict failure;
- unchanged historical IDs.

Do not include universal computed hash vectors. A producer-owned hash fallback is conformant only when that producer's versioned contract specifies inputs, ordering, serialization, normalization, algorithm, prefix, and output length.

### 4. Add fixtures and compatibility cases

At minimum, add valid examples for a module, Profile 1 claim, and one artifact manifest, plus invalid examples for every required field, absolute `payload_ref`, malformed module ID, altered case, alias conflict, bad checksum grammar, and undeclared schema/release references.

Add compatibility fixtures proving optional-field addition, a namespaced extension, current/previous final consumption, and historical validation under the declared historical schema.

### 5. Implement the offline validator

Add a pinned development dependency only if the existing dependency graph cannot validate Draft 2020-12. The command must:

1. meta-validate schemas;
2. validate registry, release, vectors, and all examples;
3. require valid fixtures to pass and invalid fixtures to fail for their declared reason;
4. verify safe relative references and complete SHA-256 inventory;
5. verify cross-references among module, profile, schemas, and release;
6. reject operational schemas from this release;
7. make no network calls and produce deterministic output;
8. leave the working tree unchanged.

Expose it only as `npm run contract:validate`; internal helper commands are not public contract surfaces.

### 6. Assemble and verify `kb-interop.v1-rc1`

Generate or update the release manifest only after all normative files are finalized. Record release ID/status/timestamp, source commit, every file hash, schema IDs, compatibility metadata, vector refs, migration guidance, and validation command.

Because recording the commit inside a file that is itself committed can create a self-reference problem, the implementation must choose and document one bounded mechanism before release: exclude the release manifest from its own checksum inventory, or generate the release artifact from an already committed source tree. Do not use a placeholder commit in a published candidate.

## Documentation cleanup sequence

**Status: complete for `kb-interop.v1-rc1`.** The focused home and start pages now lead with the current release; profile, manifest, compatibility, and validation pages link to machine-readable artifacts; operational and prose-era family pages carry visible classifications; conflicting generic field lists remain under explicit legacy headings rather than being deleted.

1. Land ADR-0006 and classification banners.
2. Update the profile and manifest pages so knowledge requirements are visibly separate from legacy operational guidance.
3. Update contract compliance definitions to make run-record checks operational/optional for Knowledge Profile 1.
4. Implement the pruned tree and validator in a separate reviewable change.
5. Replace prose-only examples with links to machine-readable schemas after the release candidate validates.
6. Mark conflicting old field lists as legacy rather than silently deleting historical guidance.

## Compatibility and migration rules

- Optional fields and optional namespaced extensions may be added within a schema version when identity and interpretation do not change.
- Required additions, removals, renames, semantic/checksum/identity/normalization changes, enum removals, cardinality changes, and document-meaning changes require a new schema version.
- Aliases declare canonical/legacy fields, precedence, conflict failure, and introduction/deprecation/removal releases.
- Historical artifacts remain valid under their declared historical schemas and are not rewritten.
- Consumers should support the current and immediately previous final versions unless they declare a longer window.

## Pull-request slicing

1. **Authority and documentation:** ADR, classification, corrected decision packet, and this plan.
2. **Schema skeleton and fixtures:** three schemas, registry, vectors, examples; no release claim yet.
3. **Validator:** offline command and deterministic checks.
4. **Release candidate:** finalized checksum inventory, migration note, and `kb-interop.v1-rc1` after authority review.

Each slice must pass `npm run build`, `git diff --check`, and all available contract validation. A failing pre-existing site typecheck must be reported separately and must not be hidden by the validator.

## Implementation readiness

The pruned contracts infrastructure may proceed after this documentation change is reviewed. Universal operational contracts remain blocked until a separate authority is deliberately established. The release candidate itself remains subject to Matías's release approval.
