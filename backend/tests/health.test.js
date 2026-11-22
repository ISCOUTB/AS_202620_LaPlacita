import { test } from 'node:test';
import assert from 'node:assert/strict';

import { estadoSalud } from '../src/health.js';

test('GET /health responde 200 con estado ok', () => {
  assert.equal(estadoSalud().status, 'ok');
});

test('GET /health incluye la huella del código servido (local fuera de Docker)', () => {
  const { huella } = estadoSalud();
  assert.equal(typeof huella, 'string');
  assert.ok(huella.length > 0);
});
