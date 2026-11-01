import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
// Explicit current source pins for one reviewed coordinator correction. Earlier
// manifests retain their historical hashes; artwork/controls/data remain exact.
const directory = new URL('../docs/design-studies/code-components/', import.meta.url);
export const displayFix = JSON.parse(fs.readFileSync(new URL('responsive-display-fix.json', directory)));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
assert.equal(displayFix.files.length, 18);
assert.equal(new Set(displayFix.files.map(row => row.file)).size, 18);
for (const row of displayFix.files) {
  const source = fs.readFileSync(new URL(row.file, directory), 'utf8');
  assert.equal(hash(source), row.afterSHA256, 'Exact current coordinator-fixed source: ' + row.file);
  assert.equal(Buffer.byteLength(source), row.afterBytes);
  assert.equal(source.split(displayFix.next).length, 2, 'Exactly one corrected copy condition');
  let coordinatorOnly = source;
  for (const change of row.additionalChanges ?? []) {
    assert.equal(coordinatorOnly.split(change.after).length, 2, 'Exactly one approved Source wrapper correction');
    coordinatorOnly = coordinatorOnly.replace(change.after, change.before);
  }
  const previous = coordinatorOnly.replace(displayFix.next, displayFix.old);
  assert.equal(hash(previous), row.beforeSHA256, 'All other source bytes match accepted prior version: ' + row.file);
  assert.equal(Buffer.byteLength(previous), row.beforeBytes);
  assert.equal(hash(coordinatorOnly.replace(displayFix.next, '')), row.nonCoordinatorSHA256);
  assert.equal(row.afterBytes - row.beforeBytes, 3 + (row.additionalChanges ?? []).reduce((n, change) => n + Buffer.byteLength(change.after) - Buffer.byteLength(change.before), 0));
}
export function approvedStudyHash(historicalHash) {
  return displayFix.files.find(row => row.beforeSHA256 === historicalHash)?.afterSHA256 ?? historicalHash;
}
export function beforeDisplayFix(source) {
  const row = displayFix.files.find(row => row.afterSHA256 === hash(source));
  assert.ok(row, 'Only an exact pinned coordinator-fixed source may be compared to historical proof');
  let previous = source;
  for (const change of row.additionalChanges ?? []) previous = previous.replace(change.after, change.before);
  previous = previous.replace(displayFix.next, displayFix.old);
  assert.equal(hash(previous), row.beforeSHA256);
  return previous;
}
