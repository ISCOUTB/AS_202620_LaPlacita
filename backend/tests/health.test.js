import { test } from 'node:test';
import assert from 'node:assert/strict';

import { estadoSalud } from '../src/health.js';

test('GET /health responde 200 con estado ok', () => {
  assert.deepEqual(estadoSalud(), { status: 'ok' });
});
