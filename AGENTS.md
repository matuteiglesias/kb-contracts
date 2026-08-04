# AGENTS.md — KB Contracts

## Mission

Maintain machine-readable shared knowledge-artifact interoperability contracts without turning this repository into a universal execution framework.

The repository owns shared identities, schemas, compatibility rules, fixtures, profiles, and pinned release evidence. Producer repositories remain authoritative for their own runtime records, orchestration, retries, staging, promotion, rollback, and domain-specific schemas.

## Authority boundary

Matías owns contract meaning, compatibility policy, release approval, and cross-repository adoption decisions.

Agents may:

- improve validators, fixtures, documentation, and deterministic release evidence;
- implement an explicitly approved contract revision;
- diagnose compatibility failures and prepare migration packets.

Agents must not independently:

- move producer-local operational schemas into this repository;
- define one universal run, error, lifecycle, storage, or orchestration model;
- change required fields, identifiers, compatibility semantics, or release hashes without an approved version decision;
- rewrite or replace a pinned release candidate in place;
- modify producer repositories or make this repository their runtime dependency.

## Contract change rules

For any externally visible schema or compatibility change:

1. identify the affected contract and version;
2. state backward-compatibility impact;
3. add or update valid, invalid, and compatibility fixtures;
4. update machine-readable release inventory and exact-byte hashes where applicable;
5. update the current-release and adoption documentation;
6. preserve old pinned releases as immutable evidence;
7. provide a consumer migration note;
8. run the complete offline validation surface.

Do not copy producer-owned schemas merely to make validation convenient. Reference them through an approved external-schema protocol when that capability exists.

## Canonical paths

Shared contracts and fixtures live under the repository's registered schema and interoperability paths. The pinned release under `interop/vendor/` is evidence, not a scratch workspace.

Documentation explains authority and adoption; it does not override registered schemas or release manifests.

## Commands

Use the root Make facade, which delegates to the existing npm scripts:

```bash
make check
make docs
make run
make clean
```

`make check` performs contract validation, TypeScript checking, and the documentation build. It must not install dependencies or contact producer repositories.

`make clean` removes only generated Docusaurus output. It must not delete contracts, fixtures, release bundles, manifests, or adoption evidence.

There is no generic `make test` target because contract validation is the authoritative check currently exposed.

## Change discipline

- Prefer a small explicit contract revision over broad documentation cleanup.
- Do not change identifiers for cosmetic consistency.
- Preserve stable references and exact-byte evidence.
- Treat legacy pages as migration context unless they are explicitly promoted into the registered contract.
- Unknown producer behavior is not a reason to broaden the shared schema.
- If adoption requires an operational choice, prepare a decision packet instead of embedding that choice in the contract.

## Completion report

```text
Contracts changed:
Version impact:
Fixtures changed:
Release evidence changed:
Consumers affected:
Validated:
Compatibility result:
Not executed:
Blocked decision:
Next adoption step:
```
