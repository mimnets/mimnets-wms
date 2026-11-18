// Unit tests for the settings rename in the rename stage 5 switch
// (docker/staging/deploy.sh rename_env_keys; m1-078, D-GIT-80). Needs bash.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const deploy = fileURLToPath(new URL('../docker/staging/deploy.sh', import.meta.url))
  .replace(/\\/g, '/');

function rename(input) {
  const result = spawnSync('bash', [ '-c', 'source "$1"; rename_env_keys', 'test', deploy ], {
    input,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

const ipSettings = [
  '# Written by ip-setup.sh',
  'WMS_KEPT=1',
  'ASSURER_PROXY_MODE=ip',
  'ASSURER_DOMAIN=assurer.invalid',
  'APOS_BASE_URL=https://assurer.invalid',
  'ASSURER_IMAGE_TAG=abc123',
  'ASSURER_PREVIOUS_TAG=def456',
  'ASSURER_MONGO_CACHE_GB=1',
  'SMTP_NOTE=ASSURER_ in a value stays',
  ''
].join('\n');

test('renames every ASSURER_ key and keeps the values', () => {
  const out = rename(ipSettings);
  assert.doesNotMatch(out, /^ASSURER_/m);
  assert.match(out, /^WMS_PROXY_MODE=ip$/m);
  assert.match(out, /^WMS_IMAGE_TAG=abc123$/m);
  assert.match(out, /^WMS_MONGO_CACHE_GB=1$/m);
});

test('keeps comments, other keys and values that only mention the old name', () => {
  const out = rename(ipSettings);
  assert.match(out, /^# Written by ip-setup\.sh$/m);
  assert.match(out, /^WMS_KEPT=1$/m);
  assert.match(out, /^SMTP_NOTE=ASSURER_ in a value stays$/m);
});

test('moves the domain placeholder to the new one', () => {
  const out = rename(ipSettings);
  assert.match(out, /^WMS_DOMAIN=wms\.invalid$/m);
  assert.match(out, /^APOS_BASE_URL=https:\/\/wms\.invalid$/m);
});

test('drops the previous release, which is from before the rename', () => {
  assert.doesNotMatch(rename(ipSettings), /PREVIOUS_TAG/);
});

test('a second run changes nothing', () => {
  const once = rename(ipSettings);
  assert.equal(rename(once), once);
});

test('an NPM host keeps the network it shares with NPM', () => {
  const out = rename('ASSURER_PROXY_MODE=npm\nASSURER_UPSTREAM_PROXY_IP=172.30.56.2\n');
  assert.match(out, /^WMS_NPM_NETWORK=assurer-npm$/m);
  assert.equal(rename(out), out);
});

test('an NPM network already set is kept as it is', () => {
  const out = rename('ASSURER_PROXY_MODE=npm\nASSURER_NPM_NETWORK=edge\n');
  assert.match(out, /^WMS_NPM_NETWORK=edge$/m);
  assert.equal(out.match(/NPM_NETWORK/g).length, 1);
});

test('the IP route gets no NPM network', () => {
  assert.doesNotMatch(rename(ipSettings), /NPM_NETWORK/);
});
