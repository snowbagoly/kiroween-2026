import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExternalLinks } from '../build.mjs';

test('setup: test runner works', () => {
  assert.ok(true);
});

test('build: flags links to other sites, allows XML namespaces', () => {
  assert.deepEqual(findExternalLinks('<a href="https://example.com/x">'), ['https://example.com/x']);
  assert.deepEqual(findExternalLinks('<svg xmlns="http://www.w3.org/2000/svg">'), []);
});
