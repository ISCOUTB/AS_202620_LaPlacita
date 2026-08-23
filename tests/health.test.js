const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const server = require('../src/index');

test('GET /health responde 200 con estado ok', async () => {
  const address = await new Promise((resolve) => {
    server.listen(0, () => resolve(server.address()));
  });

  const response = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${address.port}/health`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });

  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(response.body), { status: 'ok' });

  server.close();
});
