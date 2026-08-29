#!/usr/bin/env node
'use strict';

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

function main() {
  const release = readJson(releasePath);
  const sourceCommit = release.source_commit;
  let replacementRef = null;

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

      replacementRef = `refs/replace/${sourceCommit}`;
      execFileSync('git', ['update-ref', replacementRef, repair.equivalent_reachable_commit], {cwd: root});
      process.stderr.write(
        `Applying governed provenance repair for ${release.release_id}: ` +
        `${sourceCommit} -> ${repair.equivalent_reachable_commit}\n`
      );

      if (!commitExists(sourceCommit)) {
        throw new Error('Git replacement did not make the declared source commit resolvable');
      }
    }

    const result = spawnSync(process.execPath, ['scripts/validate-contracts.cjs'], {
      cwd: root,
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    if (replacementRef) {
      try {
        execFileSync('git', ['update-ref', '-d', replacementRef], {cwd: root});
      } catch (error) {
        process.stderr.write(`warning: unable to remove temporary provenance replacement: ${error.message}\n`);
        process.exitCode = process.exitCode || 1;
      }
    }
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`contract validation entrypoint failed: ${error.message}\n`);
  process.exitCode = 1;
}
