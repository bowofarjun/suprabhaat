import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { applyWWebJSPatch } from '../scripts/patch-wwebjs.js';

test('applyWWebJSPatch correctly patches Utils.js to eliminate __x_id getter error', () => {
  const result = applyWWebJSPatch();
  assert.strictEqual(result, true);

  const utilsPath = path.resolve('node_modules/whatsapp-web.js/src/util/Injected/Utils.js');
  if (fs.existsSync(utilsPath)) {
    const content = fs.readFileSync(utilsPath, 'utf8');
    assert.ok(content.includes('delete message.__x_id;'));
    assert.ok(content.includes('if (!message.id)'));
  }
});
