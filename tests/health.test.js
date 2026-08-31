const { test } = require('node:test');
const assert = require('node:assert');

test('GET /health responde 200 con estado ok', async () => {
  const { GET } = await import('../app/health/route.js');

  const response = await GET();
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { status: 'ok' });
});
