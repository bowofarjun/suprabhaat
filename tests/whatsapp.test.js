import test from 'node:test';
import assert from 'node:assert';
import { whatsAppService } from '../src/services/whatsapp.service.js';
import path from 'path';
import { config } from '../src/config/index.js';

test('WhatsAppService safely handles disconnected client', async () => {
  whatsAppService.status = 'DISCONNECTED';
  whatsAppService.client = null;

  const result = await whatsAppService.sendBlessing(
    ['+919876543210'],
    path.join(config.imagesDir, 'monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png'),
    'Test'
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('not connected'));
});

test('WhatsAppService safely handles undefined return from sendMessage without throwing Cannot read properties of undefined', async () => {
  const dummyImagePath = path.join(config.imagesDir, 'monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png');
  
  // Mock connected client that returns undefined (simulating WhatsApp Web getter timing)
  whatsAppService.status = 'CONNECTED';
  whatsAppService.client = {
    sendMessage: async () => undefined
  };

  const result = await whatsAppService.sendBlessing(
    ['+919876543210'],
    dummyImagePath,
    'Test Caption'
  );

  assert.strictEqual(result.success, true, 'Should mark success even if WhatsApp Web returns undefined message model');
  assert.strictEqual(result.successful, 1);
  assert.ok(result.details[0].messageId.startsWith('sent_'), 'Should assign fallback sent_ ID');
});

test('WhatsAppService correctly extracts messageId when returned by client', async () => {
  const dummyImagePath = path.join(config.imagesDir, 'monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png');

  whatsAppService.status = 'CONNECTED';
  whatsAppService.client = {
    sendMessage: async () => ({
      id: {
        id: '3EB01234567890ABCDEF',
        _serialized: 'true_919876543210@c.us_3EB01234567890ABCDEF'
      }
    })
  };

  const result = await whatsAppService.sendBlessing(
    ['+919876543210'],
    dummyImagePath,
    'Test Caption'
  );

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.details[0].messageId, 'true_919876543210@c.us_3EB01234567890ABCDEF');
});

test('cleanupChromiumLocks recursively removes stale Chromium lock files', async () => {
  const { cleanupChromiumLocks } = await import('../src/services/whatsapp.service.js');
  const fs = await import('fs');
  const tempDir = path.join(config.projectRoot, 'storage', 'test-locks');
  const sessionDir = path.join(tempDir, 'session');

  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'SingletonLock'), 'fake-host-1234');
  fs.writeFileSync(path.join(sessionDir, 'SingletonCookie'), 'fake-cookie');
  fs.writeFileSync(path.join(sessionDir, 'SingletonSocket'), 'fake-socket');
  fs.writeFileSync(path.join(sessionDir, 'valid_data.json'), '{"valid": true}');

  assert.ok(fs.existsSync(path.join(sessionDir, 'SingletonLock')));

  cleanupChromiumLocks(tempDir);

  assert.strictEqual(fs.existsSync(path.join(sessionDir, 'SingletonLock')), false);
  assert.strictEqual(fs.existsSync(path.join(sessionDir, 'SingletonCookie')), false);
  assert.strictEqual(fs.existsSync(path.join(sessionDir, 'SingletonSocket')), false);
  assert.ok(fs.existsSync(path.join(sessionDir, 'valid_data.json')), 'Non-lock files should be preserved');

  // Clean up test dir
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('WhatsAppService setConnected transitions state to CONNECTED and resets QR and sync stats', () => {
  whatsAppService.status = 'AUTHENTICATING';
  whatsAppService.qrCodeDataUrl = 'data:image/png;base64,fake';
  whatsAppService.qrCodeRaw = 'fake-qr';
  whatsAppService.loadingPercent = 45;
  whatsAppService.loadingMessage = 'Downloading chats';

  whatsAppService.setConnected('917905223180');

  assert.strictEqual(whatsAppService.status, 'CONNECTED');
  assert.strictEqual(whatsAppService.authenticatedUser, '917905223180');
  assert.strictEqual(whatsAppService.qrCodeDataUrl, null);
  assert.strictEqual(whatsAppService.qrCodeRaw, null);
  assert.strictEqual(whatsAppService.loadingPercent, 100);
  assert.ok(whatsAppService.readyTimestamp);

  const status = whatsAppService.getStatus();
  assert.strictEqual(status.connected, true);
  assert.strictEqual(status.loadingPercent, 100);
  assert.strictEqual(status.user, '917905223180');
});

test('purgeAuthSession cleanly deletes stale session directory while preserving root auth folder', async () => {
  const { purgeAuthSession } = await import('../src/services/whatsapp.service.js');
  const fs = await import('fs');
  const tempAuthDir = path.join(config.projectRoot, 'storage', 'test-auth-purge');
  const sessionSubDir = path.join(tempAuthDir, 'session');

  fs.mkdirSync(sessionSubDir, { recursive: true });
  fs.writeFileSync(path.join(sessionSubDir, 'Default_Cookies'), 'fake-cookie');
  fs.writeFileSync(path.join(tempAuthDir, 'other_meta.json'), '{"meta": true}');

  assert.ok(fs.existsSync(sessionSubDir));

  purgeAuthSession(tempAuthDir);

  assert.strictEqual(fs.existsSync(sessionSubDir), false, 'session directory should be deleted');
  assert.ok(fs.existsSync(tempAuthDir), 'parent auth directory should remain intact');
  assert.ok(fs.existsSync(path.join(tempAuthDir, 'other_meta.json')), 'non-session files should be preserved');

  // Clean up
  fs.rmSync(tempAuthDir, { recursive: true, force: true });
});

test('WhatsAppService resetState cleanly clears user, timestamps, qr, and loading metrics', () => {
  whatsAppService.status = 'CONNECTED';
  whatsAppService.authenticatedUser = '917905223180';
  whatsAppService.readyTimestamp = new Date().toISOString();
  whatsAppService.qrCodeDataUrl = 'data:image/png;base64,sample';
  whatsAppService.qrCodeRaw = 'sample-qr';
  whatsAppService.loadingPercent = 80;
  whatsAppService.loadingMessage = 'Syncing chats';
  whatsAppService.initError = null;

  whatsAppService.resetState('DISCONNECTED', 'Session logged out');

  assert.strictEqual(whatsAppService.status, 'DISCONNECTED');
  assert.strictEqual(whatsAppService.authenticatedUser, null);
  assert.strictEqual(whatsAppService.readyTimestamp, null);
  assert.strictEqual(whatsAppService.qrCodeDataUrl, null);
  assert.strictEqual(whatsAppService.qrCodeRaw, null);
  assert.strictEqual(whatsAppService.loadingPercent, null);
  assert.strictEqual(whatsAppService.loadingMessage, null);
  assert.strictEqual(whatsAppService.initError, 'Session logged out');

  const status = whatsAppService.getStatus();
  assert.strictEqual(status.connected, false);
  assert.strictEqual(status.user, null);
  assert.strictEqual(status.initError, 'Session logged out');
});

test('WhatsAppService getStatus self-heals status to CONNECTED when authenticatedUser and readyTimestamp exist with active client', () => {
  whatsAppService.client = { getState: async () => 'CONNECTED' };
  whatsAppService.status = 'AUTHENTICATING';
  whatsAppService.authenticatedUser = '919457922233';
  whatsAppService.readyTimestamp = new Date().toISOString();
  whatsAppService.loadingPercent = 99;

  const status = whatsAppService.getStatus();
  assert.strictEqual(status.connected, true);
  assert.strictEqual(status.status, 'CONNECTED');
  assert.strictEqual(status.user, '919457922233');

  whatsAppService.resetState();
});

test('WhatsAppService sendBlessing self-heals from AUTHENTICATING to CONNECTED when user is authenticated', async () => {
  const dummyImagePath = path.join(config.imagesDir, 'monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png');
  whatsAppService.client = {
    sendMessage: async () => ({ id: { id: 'test_msg_id', _serialized: 'true_test' } }),
    getState: async () => 'CONNECTED'
  };
  whatsAppService.status = 'AUTHENTICATING';
  whatsAppService.authenticatedUser = '919457922233';
  whatsAppService.readyTimestamp = new Date().toISOString();

  const result = await whatsAppService.sendBlessing(
    ['+919457922233'],
    dummyImagePath,
    'Divine Sunday Morning Blessing'
  );

  assert.strictEqual(result.success, true);
  assert.strictEqual(whatsAppService.status, 'CONNECTED');

  whatsAppService.resetState();
});




