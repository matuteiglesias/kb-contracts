#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync, execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const releasePath = path.join(root, 'contracts/releases/kb_interop_release.v1-rc1.json');
const repairsPath = path.join(root, 'contracts/releases/provenance-repairs.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function commitExists(sha) {
  const result = spawnSync('git', ['cat-file', '-e', `${sha}^{commit}`], {
    cwd: root,
    stdio: 'ignore',
  });
  return result.status === 0;
}

function gitStatus() {
  return execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
    cwd: root,
    encoding: 'utf8',
  });
}

function proveInventoryEquivalent(release, replacementCommit) {
  for (const entry of release.files) {
    const committed = execFileSync('git', ['show', `${replacementCommit}:${entry.path}`], {cwd: root});
    const digest = crypto.createHash('sha256').update(committed).digest('hex');
    if (digest !== entry.sha256) {
      throw new Error(
        `provenance replacement ${replacementCommit} disagrees with RC1 inventory at ${entry.path}`
      );
    }
  }
}

function main() {
  const originalBytes = fs.readFileSync(releasePath);
  const release = JSON.parse(originalBytes.toString('utf8'));
  const sourceCommit = release.source_commit;
  const statusBefore = gitStatus();
  let substituted = false;

  try {
    if (!commitExists(sourceCommit)) {
      const repairCatalog = readJson(repairsPath);
      const repair = repairCatalog.repairs.find((entry) =>
        entry.release_id === release.release_id &&
        entry.declared_source_commit === sourceCommit
      );

      if (!repair) {
        throw new Error(`release source commit ${sourceCommit} is unreachable and has no governed provenance repair`);
      }
      if (!commitExists(repair.equivalent_reachable_commit)) {
        throw new Error(`provenance replacement commit ${repair.equivalent_reachable_commit} is also unreachable`);
      }

      proveInventoryEquivalent(release, repair.equivalent_reachable_commit);
      process.stderr.write(
        `Applying governed provenance repair for ${release.release_id}: ` +
        `${sourceCommit} -> ${repair.equivalent_reachable_commit} ` +
        `(exact inventory equivalence proven)\n`
      );

      const repairedRelease = {...release, source_commit: repair.equivalent_reachable_commit};
      fs.writeFileSync(releasePath, `${JSON.stringify(repairedRelease, null, 2)}\n`, 'utf8');
      substituted = true;
    }

    const result = spawnSync(process.execPath, ['scripts/validate-contracts.cjs'], {
      cwd: root,
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    if (substituted) fs.writeFileSync(releasePath, originalBytes);
    if (gitStatus() !== statusBefore) {
      process.stderr.write('contract validation entrypoint failed: provenance repair did not restore the working tree\n');
      process.exitCode = 1;
    }
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`contract validation entrypoint failed: ${error.message}\n`);
  process.exitCode = 1;
}
