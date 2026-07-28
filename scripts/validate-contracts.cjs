#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const Ajv2020 = require('ajv/dist/2020').default;

const root = path.resolve(__dirname, '..');
const expectedSchemas = new Map([
  ['kb.module@1.0', 'contracts/schemas/module.v1.schema.json'],
  ['kb.knowledge_artifact_manifest@1.0', 'contracts/schemas/knowledge_artifact_manifest.v1.schema.json'],
  ['kb.knowledge_profile_claim@1.0', 'contracts/schemas/knowledge_profile_claim.v1.schema.json'],
]);
const forbiddenSchemaTerms = ['run_record', 'run_bundle', 'operational_error', 'promotion_lifecycle'];
const releaseId = 'kb-interop.v1-rc1';
const releasePath = 'contracts/releases/kb_interop_release.v1-rc1.json';

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function bytes(relativePath) { return fs.readFileSync(path.join(root, relativePath)); }
function readJson(relativePath) { return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes(relativePath))); }
function sha256(relativePath) { return crypto.createHash('sha256').update(bytes(relativePath)).digest('hex'); }
function exists(relativePath) { return fs.existsSync(path.join(root, relativePath)); }
function isSafeRepositoryRef(value) {
  return typeof value === 'string' && value.length > 0 && !value.includes('\\') &&
    !/^(?:\/|[A-Za-z]:[\\/]|https?:\/\/)/.test(value) && !value.split('/').includes('..');
}
function walkFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  return fs.readdirSync(absoluteDir, {withFileTypes: true}).flatMap((entry) => {
    const ref = path.posix.join(relativeDir, entry.name);
    return entry.isDirectory() ? walkFiles(ref) : [ref];
  }).sort();
}
function listJson(relativeDir) { return walkFiles(relativeDir).filter((ref) => ref.endsWith('.json')); }
function gitStatus() { return execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {cwd: root, encoding: 'utf8'}); }

function validateRegistry(registry) {
  const expectedKeys = ['profiles', 'releases', 'schema_id', 'schema_version', 'schemas'];
  if (JSON.stringify(Object.keys(registry).sort()) !== JSON.stringify(expectedKeys)) fail('REGISTRY_SHAPE', 'registry has an unexpected top-level shape');
  if (registry.schema_id !== 'kb.contract_registry' || registry.schema_version !== '1.0') fail('REGISTRY_IDENTITY', 'registry identity is invalid');
  for (const key of ['schemas', 'profiles', 'releases']) if (!Array.isArray(registry[key])) fail('REGISTRY_SHAPE', `registry ${key} must be an array`);
  const schemaKeys = new Set();
  for (const entry of registry.schemas) {
    const key = `${entry.schema_id}@${entry.schema_version}`;
    if (schemaKeys.has(key)) fail('DUPLICATE_SCHEMA', `duplicate schema: ${key}`);
    schemaKeys.add(key);
    if (!isSafeRepositoryRef(entry.schema_ref)) fail('UNSAFE_REFERENCE', `unsafe schema_ref: ${entry.schema_ref}`);
    if (forbiddenSchemaTerms.some((term) => `${key} ${entry.schema_ref}`.includes(term))) fail('OPERATIONAL_SCHEMA', `operational schema is outside this release: ${key}`);
    if (expectedSchemas.get(key) !== entry.schema_ref) fail('UNDECLARED_SCHEMA', `unexpected schema entry: ${key}`);
    if (!exists(entry.schema_ref)) fail('MISSING_REFERENCE', `missing schema: ${entry.schema_ref}`);
  }
  if (schemaKeys.size !== expectedSchemas.size) fail('UNDECLARED_SCHEMA', 'registry must contain exactly the three approved schemas');
  const profileKeys = new Set();
  for (const profile of registry.profiles) {
    const key = `${profile.profile_id}@${profile.level}`;
    if (profileKeys.has(key)) fail('DUPLICATE_PROFILE', `duplicate profile: ${key}`);
    profileKeys.add(key);
    if (!isSafeRepositoryRef(profile.claim_schema_ref) || !exists(profile.claim_schema_ref)) fail('MISSING_REFERENCE', `invalid profile schema ref: ${profile.claim_schema_ref}`);
  }
  const releaseKeys = new Set();
  for (const release of registry.releases) {
    if (releaseKeys.has(release.release_id)) fail('DUPLICATE_RELEASE', `duplicate release: ${release.release_id}`);
    releaseKeys.add(release.release_id);
    if (!isSafeRepositoryRef(release.manifest_ref)) fail('UNSAFE_REFERENCE', `unsafe release ref: ${release.manifest_ref}`);
  }
  if (registry.releases.length !== 1 || registry.releases[0].release_id !== releaseId || registry.releases[0].manifest_ref !== releasePath) fail('UNDECLARED_RELEASE', 'registry must declare exactly kb-interop.v1-rc1');
}

function validateVectors(vectors) {
  if (vectors.schema_id !== 'kb.stable_references' || vectors.schema_version !== '1.0') fail('VECTOR_IDENTITY', 'stable-reference vector identity is invalid');
  const grammar = new RegExp(vectors.module_id_grammar);
  if (!vectors.valid_registry_ids.every((id) => grammar.test(id))) fail('VECTOR_VALID_ID', 'a valid registry ID fails its grammar');
  if (!vectors.invalid_registry_ids.every((id) => !grammar.test(id))) fail('VECTOR_INVALID_ID', 'an invalid registry ID passes its grammar');
  for (const vector of vectors.preservation_vectors) if (vector.input !== vector.expected) fail('REFERENCE_CASE_CHANGED', `${vector.kind} was not preserved`);
  for (const vector of vectors.source_slug_vectors) if (vector.must_remain_distinct && vector.source_id === vector.published_slug) fail('SOURCE_SLUG_COLLISION', 'source ID and slug must differ');
  for (const vector of vectors.alias_vectors) {
    const outcome = vector.canonical_value === vector.legacy_value ? 'valid' : 'ALIAS_CONFLICT';
    if (outcome !== vector.expected) fail('ALIAS_VECTOR', 'alias vector has the wrong expected outcome');
  }
}

function validateCrossReferences(instance, registry) {
  const schemaMap = new Map(registry.schemas.map((entry) => [`${entry.schema_id}@${entry.schema_version}`, entry.schema_ref]));
  const releaseMap = new Map(registry.releases.map((entry) => [entry.release_id, entry.manifest_ref]));
  if (instance.schema_id === 'kb.module') {
    const declaredRef = releaseMap.get(instance.contract_release.release_id);
    if (!declaredRef || declaredRef !== instance.contract_release.manifest_ref) fail('UNDECLARED_RELEASE', `undeclared release: ${instance.contract_release.release_id}`);
  }
  if (instance.schema_id === 'kb.knowledge_profile_claim') {
    for (const entry of instance.public_schemas) {
      if (schemaMap.get(`${entry.schema_id}@${entry.schema_version}`) !== entry.schema_ref) fail('UNDECLARED_SCHEMA', `undeclared public schema: ${entry.schema_id}@${entry.schema_version}`);
    }
    for (const ref of [instance.fixtures.valid_ref, instance.fixtures.invalid_ref, instance.compatibility.policy_ref]) {
      if (!isSafeRepositoryRef(ref) || !exists(ref)) fail('MISSING_REFERENCE', `missing profile reference: ${ref}`);
    }
  }
}

function validateInvalidCase(testCase, validators, registry, ajv, fixturePath) {
  if (testCase.check === 'reference_preservation') {
    if (testCase.published_value !== testCase.observed_value) return 'REFERENCE_CASE_CHANGED';
    fail('INVALID_CASE_PASSED', `${fixturePath} did not alter the reference`);
  }
  if (testCase.check === 'alias_consistency') {
    if (testCase.canonical_value !== testCase.legacy_value) return 'ALIAS_CONFLICT';
    fail('INVALID_CASE_PASSED', `${fixturePath} aliases agree`);
  }
  const validate = validators.get(testCase.schema_id);
  if (!validate) fail('UNDECLARED_SCHEMA', `${fixturePath} has an unregistered schema_id`);
  if (!validate(testCase.instance)) {
    if (testCase.expected_keyword && !validate.errors.some((error) => error.keyword === testCase.expected_keyword &&
      (testCase.expected_instance_path === undefined || error.instancePath === testCase.expected_instance_path) &&
      (testCase.expected_missing_property === undefined || error.params.missingProperty === testCase.expected_missing_property))) {
      fail('WRONG_INVALID_REASON', `${fixturePath} did not fail as declared: ${ajv.errorsText(validate.errors)}`);
    }
    return testCase.expected_keyword;
  }
  if (testCase.check === 'cross_references') {
    try { validateCrossReferences(testCase.instance, registry); } catch (error) { return error.code; }
  }
  fail('INVALID_CASE_PASSED', `${fixturePath} should be invalid`);
}

function validateCompatibility(validators, ajv) {
  for (const fixturePath of listJson('contracts/examples/compatibility')) {
    const testCase = readJson(fixturePath);
    const validate = validators.get(testCase.schema_id);
    if (!validate) fail('UNDECLARED_SCHEMA', `${fixturePath} has an unregistered schema_id`);
    if (testCase.base) {
      if (!validate(testCase.base) || !validate(testCase.candidate)) fail('COMPATIBILITY_SCHEMA', `${fixturePath} optional addition is invalid: ${ajv.errorsText(validate.errors)}`);
      for (const field of testCase.identity_fields) if (testCase.base[field] !== testCase.candidate[field]) fail('COMPATIBILITY_IDENTITY', `${fixturePath} changed ${field}`);
      const extensionKeys = Object.keys(testCase.candidate.extensions || {});
      if (!extensionKeys.length || extensionKeys.some((key) => !/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_-]*)+$/.test(key))) fail('EXTENSION_NAMESPACE', `${fixturePath} lacks a namespaced extension`);
    } else {
      if (JSON.stringify(testCase.supported_final_versions) !== JSON.stringify([testCase.current_version, testCase.previous_version])) fail('COMPATIBILITY_WINDOW', `${fixturePath} does not support current+previous`);
      if (!validate(testCase.current_instance)) fail('CURRENT_VERSION', `${fixturePath} current instance is invalid`);
      const historicalAjv = new Ajv2020({strict: true});
      if (!historicalAjv.validate(testCase.historical_schema, testCase.historical_instance)) fail('HISTORICAL_SCHEMA', `${fixturePath} historical instance is invalid`);
      if (JSON.stringify(testCase.historical_instance) !== JSON.stringify(testCase.unchanged_historical_instance)) fail('HISTORICAL_REWRITE', `${fixturePath} rewrote historical data`);
    }
  }
}

function normativeFiles() {
  return ['contracts/registry.json', ...walkFiles('contracts/schemas'), ...walkFiles('contracts/test_vectors'), ...walkFiles('contracts/examples'), ...walkFiles('contracts/migrations')].sort();
}

function validateRelease(release, registry) {
  const required = ['schema_id','schema_version','release_id','status','released_at','source_commit','schemas','profiles','test_vectors','migration_ref','validation','compatibility','files'];
  if (JSON.stringify(Object.keys(release).sort()) !== JSON.stringify(required.sort())) fail('RELEASE_SHAPE', 'release has an unexpected shape');
  if (release.schema_id !== 'kb.interop_release' || release.schema_version !== '1.0' || release.release_id !== releaseId || release.status !== 'release_candidate') fail('RELEASE_IDENTITY', 'release identity/status is invalid');
  if (!/^[0-9a-f]{40}$/.test(release.source_commit)) fail('SOURCE_COMMIT', 'release source_commit must be a full Git object ID');
  execFileSync('git', ['cat-file', '-e', `${release.source_commit}^{commit}`], {cwd: root});
  if (release.validation.command !== 'npm run contract:validate' || release.validation.offline !== true || release.validation.deterministic !== true) fail('RELEASE_VALIDATION', 'release validation claim is invalid');
  if (release.migration_ref !== 'contracts/migrations/v1-rc1.md' || !exists(release.migration_ref)) fail('MISSING_REFERENCE', 'release migration ref is invalid');
  const registrySchemas = registry.schemas.map((entry) => ({schema_id:entry.schema_id,schema_version:entry.schema_version,schema_ref:entry.schema_ref}));
  if (JSON.stringify(release.schemas) !== JSON.stringify(registrySchemas)) fail('RELEASE_SCHEMAS', 'release schema inventory disagrees with registry');
  const expected = normativeFiles();
  const actual = release.files.map((entry) => entry.path);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail('INCOMPLETE_INVENTORY', 'release file inventory is incomplete or unsorted');
  for (const entry of release.files) {
    if (!isSafeRepositoryRef(entry.path) || !/^[0-9a-f]{64}$/.test(entry.sha256)) fail('INVENTORY_ENTRY', `invalid inventory entry: ${entry.path}`);
    if (sha256(entry.path) !== entry.sha256) fail('CHECKSUM_MISMATCH', `checksum mismatch: ${entry.path}`);
    const committed = execFileSync('git', ['show', `${release.source_commit}:${entry.path}`], {cwd: root});
    if (!crypto.timingSafeEqual(crypto.createHash('sha256').update(committed).digest(), Buffer.from(entry.sha256, 'hex'))) fail('SOURCE_COMMIT_MISMATCH', `${entry.path} differs from source commit`);
  }
}

function main() {
  const statusBefore = gitStatus();
  const registry = readJson('contracts/registry.json');
  validateRegistry(registry);
  const ajv = new Ajv2020({allErrors: true, strict: true});
  const validators = new Map();
  for (const entry of registry.schemas) {
    const schema = readJson(entry.schema_ref);
    if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail('SCHEMA_DRAFT', `${entry.schema_ref} is not Draft 2020-12`);
    ajv.validateSchema(schema, true);
    validators.set(entry.schema_id, ajv.compile(schema));
  }
  const validFixtures = listJson('contracts/examples/valid');
  for (const fixturePath of validFixtures) {
    const instance = readJson(fixturePath); const validate = validators.get(instance.schema_id);
    if (!validate || !validate(instance)) fail('VALID_FIXTURE', `${fixturePath} should be valid: ${ajv.errorsText(validate && validate.errors)}`);
    validateCrossReferences(instance, registry);
  }
  const invalidFixtures = listJson('contracts/examples/invalid');
  for (const fixturePath of invalidFixtures) {
    const testCase = readJson(fixturePath); const reason = validateInvalidCase(testCase, validators, registry, ajv, fixturePath);
    if (reason !== (testCase.expected_code || testCase.expected_keyword)) fail('WRONG_INVALID_REASON', `${fixturePath}: expected ${testCase.expected_code || testCase.expected_keyword}, got ${reason}`);
  }
  validateCompatibility(validators, ajv);
  validateVectors(readJson('contracts/test_vectors/stable_references.v1.json'));
  if (!exists(releasePath)) fail('MISSING_RELEASE', `missing release manifest: ${releasePath}`);
  validateRelease(readJson(releasePath), registry);
  if (gitStatus() !== statusBefore) fail('DIRTY_WORKTREE', 'validator changed the working tree');
  process.stdout.write(`Validated ${validators.size} schemas, ${validFixtures.length} valid fixtures, ${invalidFixtures.length} invalid fixtures, ${listJson('contracts/examples/compatibility').length} compatibility cases, stable-reference vectors, and ${releaseId} offline.\n`);
}

try { main(); } catch (error) { process.stderr.write(`contract validation failed [${error.code || 'ERROR'}]: ${error.message}\n`); process.exitCode = 1; }
