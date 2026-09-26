import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const isDryRunCli = process.argv.includes('--dry-run');

// Helper to resolve Gemini API key from env or coding-envs file
function resolveGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const keyPath = 'E:/MyFolder/Projects/coding-envs/gemini-api-key.txt';
  try {
    if (fs.existsSync(keyPath)) {
      const key = fs.readFileSync(keyPath, 'utf8').trim();
      if (key) return key;
    }
  } catch (_) {}
  return '';
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  isDryRun: isDryRunCli || process.env.DRY_RUN === 'true',
  
  // Gemini AI Configuration
  geminiApiKey: resolveGeminiApiKey(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',

  // WhatsApp Configuration
  whatsappAuthPath: process.env.WWEBJS_AUTH_PATH || path.join(projectRoot, '.wwebjs_auth'),
  recipientNumbers: (process.env.RECIPIENT_NUMBERS || '')
    .split(',')
    .map((num) => num.trim())
    .filter(Boolean),

  // Facebook Graph API Configuration
  fbPageId: process.env.FB_PAGE_ID || '',
  fbPageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || '',
  fbGraphApiVersion: process.env.FB_GRAPH_API_VERSION || 'v20.0',

  // Cron Scheduling Configuration (Default: 07:00 AM IST daily)
  cronSchedule: process.env.CRON_SCHEDULE || '0 7 * * *',
  cronTimezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',

  // Storage and Directories
  projectRoot,
  imagesDir: path.join(projectRoot, 'public', 'images'),
  publicDir: path.join(projectRoot, 'public')
};

/**
 * Normalizes phone numbers to standard WhatsApp JIDs
 * e.g. "+91 98765 43210" -> "919876543210@c.us"
 */
export function formatWhatsAppJid(number) {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;
  return digits.includes('@') ? digits : `${digits}@c.us`;
}
