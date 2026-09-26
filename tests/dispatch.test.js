import test from 'node:test';
import assert from 'node:assert';
import { DispatchService } from '../src/services/dispatch.service.js';

test('DispatchService executes a dry-run dispatch for Monday successfully', async () => {
  const result = await DispatchService.executeDispatch({
    day: 'monday',
    channels: ['whatsapp', 'facebook'],
    dryRun: true,
    recipients: ['+919876543210'],
    triggerSource: 'test-suite'
  });

  assert.ok(result);
  assert.strictEqual(result.day, 'monday');
  assert.strictEqual(result.dayName, 'Monday');
  assert.strictEqual(result.deity, 'Lord Shiva');
  assert.strictEqual(result.isDryRun, true);
  assert.ok(result.blessingText.length > 10);
  assert.ok(result.channels.whatsapp);
  assert.strictEqual(result.channels.whatsapp.dryRun, true);
  assert.ok(result.channels.facebook);
  assert.strictEqual(result.channels.facebook.dryRun, true);
});

test('DispatchService records dispatch history', async () => {
  const history = DispatchService.getHistory();
  assert.ok(Array.isArray(history));
  assert.ok(history.length > 0);
  assert.strictEqual(history[0].day, 'monday');
});
