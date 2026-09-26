import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { config, formatWhatsAppJid } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { applyWWebJSPatch } from '../../scripts/patch-wwebjs.js';

/**
 * Recursively cleans up stale Chromium singleton lock files.
 * In Docker containers with persistent volumes, when a container restarts,
 * Chromium detects the old container hostname/PID in SingletonLock and crashes with Code 21.
 */
export function cleanupChromiumLocks(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        cleanupChromiumLocks(fullPath);
      } else if (
        entry.name.startsWith('Singleton') || // SingletonLock, SingletonCookie, SingletonSocket
        entry.name === 'parent.lock' ||
        entry.name === 'lockfile'
      ) {
        try {
          fs.unlinkSync(fullPath);
          logger.info(`Cleaned up stale Chromium profile lock: ${fullPath}`);
        } catch (_) {
          try {
            fs.rmSync(fullPath, { force: true });
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    logger.warn(`Could not scan for Chromium locks in ${dirPath}: ${err.message}`);
  }
}

class WhatsAppService {
  constructor() {
    this.client = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, AUTHENTICATING, CONNECTED
    this.qrCodeDataUrl = null;
    this.qrCodeRaw = null;
    this.authenticatedUser = null;
    this.readyTimestamp = null;
    this.initError = null;
    this.loadingPercent = null;
    this.loadingMessage = null;
    this.watchdogInterval = null;
  }

  /**
   * Transitions client state to CONNECTED and records timestamp & user info.
   */
  setConnected(user = null) {
    this.status = 'CONNECTED';
    this.readyTimestamp = this.readyTimestamp || new Date().toISOString();
    this.qrCodeDataUrl = null;
    this.qrCodeRaw = null;
    this.loadingPercent = 100;
    this.loadingMessage = 'Ready';
    this.stopWatchdog();

    if (user) {
      this.authenticatedUser = user;
    } else if (this.client?.info?.wid?.user) {
      this.authenticatedUser = this.client.info.wid.user;
    } else if (!this.authenticatedUser) {
      this.authenticatedUser = 'Active User';
    }

    logger.info(`WhatsApp Client is READY! Connected as: ${this.authenticatedUser}`);
  }

  /**
   * Starts a proactive polling watchdog once authentication begins.
   * If the ready event is delayed by offline chat sync or injection timing,
   * this verifies client.getState() and client page state to transition to CONNECTED.
   */
  startWatchdog() {
    if (this.watchdogInterval) return;
    logger.info('Started WhatsApp connection watchdog (polling for session readiness)...');

    let checks = 0;
    this.watchdogInterval = setInterval(async () => {
      checks++;
      if (this.status === 'CONNECTED') {
        this.stopWatchdog();
        return;
      }

      if (!this.client) {
        this.stopWatchdog();
        return;
      }

      try {
        const state = await this.client.getState().catch(() => null);
        if (state) {
          logger.debug(`[Watchdog #${checks}] WhatsApp state: ${state}`);
        }

        if (state === 'CONNECTED') {
          logger.info(`[Watchdog] Client confirmed CONNECTED state on check #${checks}! Finalizing readiness...`);
          this.setConnected();
          return;
        }

        // Proactively inspect browser page if ready event has not emitted yet
        if (this.client.pupPage && !this.authenticatedUser) {
          try {
            const userWid = await this.client.pupPage.evaluate(() => {
              try {
                const u = window.require?.('WAWebUserPrefsMeUser')?.getMaybeMePnUser?.() ||
                          window.require?.('WAWebUserPrefsMeUser')?.getMaybeMeLidUser?.();
                return u?.user || u?._serialized || null;
              } catch (_) {
                return null;
              }
            });

            if (userWid) {
              logger.info(`[Watchdog] Detected active user session in page: ${userWid}`);
              this.setConnected(userWid);
              return;
            }
          } catch (_) {}
        }
      } catch (err) {
        logger.debug(`[Watchdog] Error polling client state: ${err.message}`);
      }

      if (checks === 60) {
        logger.warn('WhatsApp initial sync is taking longer than usual (>3 mins). Retaining session...');
      }
    }, 3000);
  }

  /**
   * Stops the active watchdog timer.
   */
  stopWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
      logger.debug('Stopped WhatsApp connection watchdog.');
    }
  }

  /**
   * Initializes the WhatsApp Web client with LocalAuth and resilient event listeners.
   */
  async initialize() {
    if (this.status === 'CONNECTED' || this.status === 'INITIALIZING') {
      return;
    }

    this.status = 'INITIALIZING';
    
    // Ensure whatsapp-web.js media patch is applied
    try {
      applyWWebJSPatch();
    } catch (patchErr) {
      logger.warn(`Could not run automatic WWebJS patch: ${patchErr.message}`);
    }

    // Clean up any stale Chromium profile locks from previous container runs
    try {
      cleanupChromiumLocks(config.whatsappAuthPath);
    } catch (cleanupErr) {
      logger.warn(`Could not clean Chromium locks: ${cleanupErr.message}`);
    }

    logger.info(`Initializing WhatsApp Client with auth path: ${config.whatsappAuthPath}`);

    const cachePath = path.join(config.whatsappAuthPath, 'cache');
    try {
      fs.mkdirSync(cachePath, { recursive: true });
    } catch (_) {}

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: config.whatsappAuthPath
        }),
        webVersionCache: {
          type: 'local',
          path: cachePath
        },
        puppeteer: {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer'
          ]
        }
      });

      this.client.on('qr', async (qr) => {
        this.status = 'QR_READY';
        this.qrCodeRaw = qr;
        this.loadingPercent = null;
        this.loadingMessage = null;
        logger.info('WhatsApp QR Code generated. Scan to authenticate:');
        qrcodeTerminal.generate(qr, { small: true });

        try {
          this.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        } catch (err) {
          logger.error(`Error converting QR to DataURL: ${err.message}`);
        }
      });

      this.client.on('authenticating', () => {
        this.status = 'AUTHENTICATING';
        logger.info('WhatsApp Client is authenticating...');
        this.startWatchdog();
      });

      this.client.on('authenticated', () => {
        this.status = 'AUTHENTICATING';
        this.qrCodeDataUrl = null;
        this.qrCodeRaw = null;
        logger.info('WhatsApp Client authenticated successfully. Syncing session...');
        this.startWatchdog();
      });

      this.client.on('loading_screen', (percent, message) => {
        this.status = 'AUTHENTICATING';
        this.loadingPercent = percent;
        this.loadingMessage = message || 'Syncing chats';
        logger.info(`WhatsApp sync progress: ${percent}% - ${this.loadingMessage}`);
      });

      this.client.on('change_state', (state) => {
        logger.info(`WhatsApp connection state changed: ${state}`);
        if (state === 'CONNECTED') {
          this.setConnected();
        }
      });

      this.client.on('ready', () => {
        this.setConnected(this.client.info?.wid?.user);
      });

      this.client.on('auth_failure', (msg) => {
        this.status = 'DISCONNECTED';
        this.initError = msg;
        this.stopWatchdog();
        logger.error(`WhatsApp authentication failure: ${msg}`);
      });

      this.client.on('disconnected', (reason) => {
        this.status = 'DISCONNECTED';
        this.qrCodeDataUrl = null;
        this.qrCodeRaw = null;
        this.stopWatchdog();
        logger.warn(`WhatsApp Client disconnected. Reason: ${reason}`);
      });

      // Launch client
      this.client.initialize().catch((err) => {
        this.status = 'DISCONNECTED';
        this.initError = err.message;
        this.stopWatchdog();
        logger.error(`Failed to launch WhatsApp client: ${err.message}`);
      });
    } catch (err) {
      this.status = 'DISCONNECTED';
      this.initError = err.message;
      this.stopWatchdog();
      logger.error(`Exception initializing WhatsApp client: ${err.message}`);
    }
  }

  /**
   * Returns current WhatsApp connection status for API/UI.
   */
  getStatus() {
    return {
      status: this.status,
      connected: this.status === 'CONNECTED',
      user: this.authenticatedUser,
      readyTimestamp: this.readyTimestamp,
      hasQr: !!this.qrCodeDataUrl,
      qrCodeDataUrl: this.qrCodeDataUrl,
      loadingPercent: this.loadingPercent,
      loadingMessage: this.loadingMessage,
      configuredRecipientsCount: config.recipientNumbers.length,
      configuredRecipients: config.recipientNumbers
    };
  }

  /**
   * Dispatches image and devotional blessing text to recipients.
   *
   * @param {Array<string>} recipientList - array of phone numbers
   * @param {string} imagePath - absolute path to image file
   * @param {string} captionText - devotional blessing text
   * @param {boolean} dryRun - whether to mock the send
   */
  async sendBlessing(recipientList, imagePath, captionText, dryRun = false) {
    const isDry = dryRun || config.isDryRun;
    const recipients = recipientList && recipientList.length > 0 
      ? recipientList 
      : config.recipientNumbers;

    if (recipients.length === 0) {
      logger.warn('No recipients configured for WhatsApp dispatch.');
      return {
        success: false,
        error: 'No recipient phone numbers configured or provided.',
        count: 0,
        recipients: []
      };
    }

    if (isDry) {
      logger.info(`[DRY-RUN] Simulating WhatsApp dispatch to ${recipients.length} recipients.`);
      logger.info(`[DRY-RUN] Image: ${imagePath}`);
      logger.info(`[DRY-RUN] Caption:\n${captionText}`);
      return {
        success: true,
        dryRun: true,
        count: recipients.length,
        recipients,
        timestamp: new Date().toISOString()
      };
    }

    if (this.status !== 'CONNECTED' || !this.client) {
      logger.warn(`WhatsApp client is not ready (Current status: ${this.status}). Dispatch aborted.`);
      return {
        success: false,
        error: `WhatsApp client is not connected (Status: ${this.status}). Please scan QR code.`,
        count: 0,
        recipients
      };
    }

    if (!fs.existsSync(imagePath)) {
      return {
        success: false,
        error: `Image file not found at path: ${imagePath}`,
        count: 0
      };
    }

    const media = MessageMedia.fromFilePath(imagePath);
    const results = [];

    for (const recipient of recipients) {
      const jid = formatWhatsAppJid(recipient);
      if (!jid) {
        logger.warn(`Invalid phone number: ${recipient}`);
        results.push({ recipient, success: false, error: 'Invalid number format' });
        continue;
      }

      try {
        logger.info(`Dispatching WhatsApp morning blessing to: ${jid}`);
        const response = await this.client.sendMessage(jid, media, {
          caption: captionText,
          sendMediaAsHd: true
        });
        const msgId = response?.id?._serialized || response?.id?.id || (response?.id ? String(response.id) : `sent_${Date.now()}`);
        logger.info(`Successfully dispatched WhatsApp message to ${jid} (Message ID: ${msgId})`);
        results.push({ recipient: jid, success: true, messageId: msgId });
        
        // Polite delay between sends to prevent triggering rate limits
        await new Promise((res) => setTimeout(res, 1200));
      } catch (err) {
        logger.error(`Error sending WhatsApp message to ${jid}: ${err.message}`);
        results.push({ recipient: jid, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      success: successCount > 0,
      total: recipients.length,
      successful: successCount,
      details: results,
      timestamp: new Date().toISOString()
    };
  }
}

export const whatsAppService = new WhatsAppService();
