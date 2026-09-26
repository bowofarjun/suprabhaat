import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';

test('SuPrabhaat Express server boots, serves health probes, API, and Monday default images', async (t) => {
  let server;
  let port;

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      resolve();
    });
  });

  // Helper to fetch JSON from test server
  const fetchJson = (endpoint) => {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}${endpoint}`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }).on('error', reject);
    });
  };

  // Helper to POST JSON to test server
  const postJson = (endpoint, payload = {}) => {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  };

  try {
    // 1. Verify /health/liveness
    const liveRes = await fetchJson('/health/liveness');
    assert.strictEqual(liveRes.status, 200);
    assert.strictEqual(liveRes.body.status, 'ok');

    // 2. Verify /health/readiness
    const readyRes = await fetchJson('/health/readiness');
    assert.strictEqual(readyRes.status, 200);
    assert.strictEqual(readyRes.body.status, 'ready');

    // 3. Verify /api/days
    const daysRes = await fetchJson('/api/days');
    assert.strictEqual(daysRes.status, 200);
    assert.strictEqual(daysRes.body.defaultDay, 'monday');
    assert.strictEqual(daysRes.body.days.length, 7);

    // 4. Verify /api/images with Monday as default
    const defaultImages = await fetchJson('/api/images');
    assert.strictEqual(defaultImages.status, 200);
    assert.strictEqual(defaultImages.body.filterDay, 'monday');
    assert.ok(defaultImages.body.images.length > 0);
    assert.strictEqual(defaultImages.body.images[0].day, 'monday');

    // 5. Verify /api/images?day=all
    const allImages = await fetchJson('/api/images?day=all');
    assert.strictEqual(allImages.status, 200);
    assert.strictEqual(allImages.body.filterDay, 'all');
    assert.ok(allImages.body.images.length >= 7);

    // 6. Verify /api/status
    const statusRes = await fetchJson('/api/status');
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.body.defaultDay, 'monday');

    // 7. Verify /api/whatsapp/restart endpoint
    const restartRes = await postJson('/api/whatsapp/restart', { purgeSession: false });
    assert.strictEqual(restartRes.status, 200);
    assert.strictEqual(restartRes.body.success, true);
    assert.ok(restartRes.body.message.includes('Restarting'));

    // 8. Verify /api/whatsapp/logout endpoint
    const logoutRes = await postJson('/api/whatsapp/logout');
    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.body.success, true);
    assert.ok(logoutRes.body.message.includes('Unlinking'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
