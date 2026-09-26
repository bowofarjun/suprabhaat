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
