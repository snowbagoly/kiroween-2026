import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExternalLinks, findDuplicateNames, PAGES, buildPage } from '../build.mjs';

test('setup: test runner works', () => {
  assert.ok(true);
});

test('build: flags links to other sites, allows XML namespaces', () => {
  assert.deepEqual(findExternalLinks('<a href="https://example.com/x">'), ['https://example.com/x']);
  assert.deepEqual(findExternalLinks('<svg xmlns="http://www.w3.org/2000/svg">'), []);
});

test('build: flags a top-level name declared in two modules', () => {
  assert.deepEqual(findDuplicateNames('const a = 1;\nfunction b() {}\nconst a = 2;'), ['a']);
  assert.deepEqual(findDuplicateNames('const a = 1;\n  const a = 2;'), []); // inner scopes are fine
});

test('build: every page bundles with no clashing names', () => {
  for (const [h, e, o] of PAGES) assert.doesNotThrow(() => buildPage(h, e, o), e);
});
