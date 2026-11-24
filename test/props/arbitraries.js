// Shared random generators for property tests [design 15].
import fc from 'fast-check';
import { MORSE } from '../../src/core/morse.js';

export const RUNS = { numRuns: 200 };

export const letter = fc.constantFrom(...Object.keys(MORSE));
export const pressMs = fc.integer({ min: 0, max: 3000 });
export const gapMs = fc.integer({ min: 0, max: 3000 });
export const press = fc.record({ ms: pressMs, gapAfter: gapMs });
export const pressList = fc.array(press, { maxLength: 40 });

// Anything at all, to check nothing throws.
export const junk = fc.anything();

export const seed = fc.integer({ min: 0, max: 0xffffffff });
export const day = fc.constantFrom(1, 2, 3);
export const mode = fc.constantFrom('night', 'day', 'deadair');
