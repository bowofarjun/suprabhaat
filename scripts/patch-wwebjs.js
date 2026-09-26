import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const utilsFilePath = path.resolve(
  __dirname,
  '../node_modules/whatsapp-web.js/src/util/Injected/Utils.js'
);

export function applyWWebJSPatch() {
  if (!fs.existsSync(utilsFilePath)) {
    console.log('[patch-wwebjs] whatsapp-web.js Utils.js not found, skipping patch.');
    return false;
  }

  let content = fs.readFileSync(utilsFilePath, 'utf8');

  if (content.includes('delete message.__x_id;')) {
    console.log('[patch-wwebjs] whatsapp-web.js is already patched.');
    return true;
  }

  // Target block in window.WWebJS.sendMessage
  const targetPattern = /const message = {[\s\S]*?\.\.\.extraOptions,?\s*};/;
  const match = content.match(targetPattern);

  if (!match) {
    console.warn('[patch-wwebjs] Could not find target message declaration in Utils.js.');
    return false;
  }

  const replacement = `${match[0]}\n\n        delete message.__x_id;\n        if (!message.id) {\n            message.id = newMsgKey;\n        }`;
  content = content.replace(targetPattern, replacement);

  fs.writeFileSync(utilsFilePath, content, 'utf8');
  console.log('[patch-wwebjs] Successfully patched whatsapp-web.js Utils.js (added delete message.__x_id).');
  return true;
}

// Run immediately if executed directly via CLI/postinstall
if (process.argv[1] && process.argv[1].includes('patch-wwebjs.js')) {
  applyWWebJSPatch();
}
