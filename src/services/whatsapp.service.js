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

/**
 * Purges the saved session folder inside dataPath.
 * Called when a session is invalidated (auth_failure), user logs out from phone, or manual logout.
 */
export function purgeAuthSession(authPath) {
  if (!fs.existsSync(authPath)) return;
  try {
    const sessionDir = path.join(authPath, 'session');
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        logger.info(`Purged revoked/stale WhatsApp session directory: ${sessionDir}`);
      } catch (err) {
        logger.warn(`Could not purge session dir ${sessionDir}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.warn(`Error scanning authPath for session purge in ${authPath}: ${err.message}`);
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
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimer = null;
  }

  /**
   * Resets connection state fields and cleans up active timers.
   */
  resetState(newStatus = 'DISCONNECTED', error = null) {
    this.status = newStatus;
    this.authenticatedUser = null;
    this.readyTimestamp = null;
    this.qrCodeDataUrl = null;
    this.qrCodeRaw = null;
    this.loadingPercent = null;
    this.loadingMessage = null;
    this.initError = error;
    this.stopWatchdog();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Transitions client state to CONNECTED and records timestamp & user info.
   */
  setConnected(user = null) {
    this.status = 'CONNECTED';
    this.reconnectAttempts = 0;
    this.readyTimestamp = this.readyTimestamp || new Date().toISOString();
    this.qrCodeDataUrl = null;
    this.qrCodeRaw = null;
    this.loadingPercent = 100;
    this.loadingMessage = 'Ready';
    this.initError = null;

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
   * - During authentication/sync: checks every 3s to accelerate readiness.
   * - Once connected: performs a lightweight 15s health check to ensure continuous readiness.
   */
  startWatchdog() {
    if (this.watchdogInterval) return;
    logger.info('Started WhatsApp connection monitor (readiness & session health)...');

    let checks = 0;
    this.watchdogInterval = setInterval(async () => {
      checks++;

      if (!this.client) {
        this.stopWatchdog();
        return;
      }

      // When connected, perform periodic health check every 5 intervals (~15s)
      if (this.status === 'CONNECTED') {
        if (checks % 5 !== 0) return;
        try {
          const state = await this.client.getState().catch(() => null);
          if (state && state !== 'CONNECTED') {
            logger.warn(`WhatsApp state shifted from CONNECTED to ${state}`);
          }
        } catch (_) {}
        return;
      }

      try {
        const state = await this.client.getState().catch(() => null);
        if (state) {
          logger.debug(`[Watchdog #${checks}] WhatsApp state: ${state}`);
        }

        if (state === 'CONNECTED') {
          logger.info(`[Watchdog] Client confirmed CONNECTED state on check #${checks}! Finalizing readiness...`);
          this.setConnected(this.client.info?.wid?.user || this.authenticatedUser);
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
   * Safely shuts down current client instance and cleans lock files.
   */
  async destroyClient() {
    this.stopWatchdog();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (err) {
        logger.debug(`Client destroy notice: ${err.message}`);
      }
      this.client = null;
    }
    cleanupChromiumLocks(config.whatsappAuthPath);
  }

  /**
   * Restarts the WhatsApp client. If purgeSession is true, purges stale credentials.
   */
  async restart(purgeSession = false) {
    logger.info(`Restarting WhatsApp Client (purgeSession: ${purgeSession})...`);
    this.resetState('INITIALIZING');

    await this.destroyClient();

    if (purgeSession) {
      purgeAuthSession(config.whatsappAuthPath);
    }

    // Brief cooling pause to release locks
    await new Promise((res) => setTimeout(res, 1500));

    return this.initialize();
  }

  /**
   * Unlinks WhatsApp account, clears credentials, and restarts into QR generation mode.
   */
  async logout() {
    logger.info('User requested WhatsApp logout / account unlink.');
    try {
      if (this.client && this.status === 'CONNECTED') {
        await this.client.logout().catch(() => {});
      }
    } catch (_) {}
    return this.restart(true);
  }

  /**
   * Initializes the WhatsApp Web client with LocalAuth and resilient event listeners.
   */
  async initialize() {
    if (this.status === 'CONNECTED' || this.status === 'INITIALIZING') {
      return;
    }

    this.status = 'INITIALIZING';
    this.initError = null;
    
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

    const sessionExists = fs.existsSync(path.join(config.whatsappAuthPath, 'session'));
    if (!sessionExists) {
      logger.info('First-time WhatsApp startup detected (no saved session). A fresh QR code will be generated.');
    } else {
      logger.info('Saved WhatsApp session detected in storage. Attempting to restore session...');
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
        this.initError = null;
        logger.info('WhatsApp QR Code generated. Scan with mobile phone to authenticate:');
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
        this.loadingPercent = percent;
        this.loadingMessage = message || 'Syncing chats';
        logger.info(`WhatsApp sync progress: ${percent}% - ${this.loadingMessage}`);

        // CRITICAL FIX: If already connected or user is authenticated, NEVER downgrade to AUTHENTICATING
        if (this.status === 'CONNECTED' || this.authenticatedUser) {
          if (this.status !== 'CONNECTED') {
            this.setConnected(this.authenticatedUser);
          }
          return;
        }

        this.status = 'AUTHENTICATING';

        // When loading reaches 100%, or 90%+ with user info available, finalize connection
        if (percent >= 100 || (percent >= 90 && this.client.info?.wid?.user)) {
          this.setConnected(this.client.info?.wid?.user || this.authenticatedUser);
        }
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

      this.client.on('auth_failure', async (msg) => {
        logger.error(`WhatsApp authentication failure: ${msg}. Stored session has expired or was revoked.`);
        this.resetState('DISCONNECTED', `Authentication failed: ${msg}`);

        // Purge dead session files and automatically recover after 3s backoff
        logger.info('Auto-recovering: purging stale session and scheduling fresh QR generation in 3s...');
        this.reconnectTimer = setTimeout(() => {
          this.restart(true).catch((err) => {
            logger.error(`Error during WhatsApp auto-recovery: ${err.message}`);
          });
        }, 3000);
      });

      this.client.on('disconnected', async (reason) => {
        logger.warn(`WhatsApp Client disconnected. Reason: ${reason}`);
        this.stopWatchdog();

        if (reason === 'LOGOUT') {
          logger.info('Device unlinked from mobile phone. Purging session and generating fresh QR code in 2s...');
          this.resetState('DISCONNECTED', 'Session logged out from device');
          this.reconnectTimer = setTimeout(() => {
            this.restart(true).catch((err) => {
              logger.error(`Error restarting after logout: ${err.message}`);
            });
          }, 2000);
        } else {
          // Transient network disconnection
          this.resetState('DISCONNECTED', `Disconnected: ${reason}`);

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts), 20000);
            logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay / 1000)}s...`);
            this.reconnectTimer = setTimeout(() => {
              this.restart(false).catch((err) => {
                logger.error(`Reconnection attempt failed: ${err.message}`);
              });
            }, delay);
          } else {
            logger.warn(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Awaiting manual trigger or next check.`);
          }
        }
      });

      // Launch client
      this.client.initialize().catch((err) => {
        this.resetState('DISCONNECTED', err.message);
        logger.error(`Failed to launch WhatsApp client: ${err.message}`);
      });
    } catch (err) {
      this.resetState('DISCONNECTED', err.message);
      logger.error(`Exception initializing WhatsApp client: ${err.message}`);
    }
  }

  /**
   * Returns current WhatsApp connection status for API/UI.
   */
  getStatus() {
    const sessionExists = fs.existsSync(path.join(config.whatsappAuthPath, 'session'));
    const isActuallyConnected = this.status === 'CONNECTED' || (!!this.authenticatedUser && this.readyTimestamp && this.client !== null);

    // Auto-heal status if client is actually connected
    if (isActuallyConnected && this.status !== 'CONNECTED') {
      this.status = 'CONNECTED';
    }

    return {
      status: this.status,
      connected: this.status === 'CONNECTED',
      user: this.authenticatedUser,
      readyTimestamp: this.readyTimestamp,
      hasQr: !!this.qrCodeDataUrl,
      qrCodeDataUrl: this.qrCodeDataUrl,
      loadingPercent: this.loadingPercent,
      loadingMessage: this.loadingMessage,
      initError: this.initError,
      hasSavedSession: sessionExists,
      reconnectAttempts: this.reconnectAttempts,
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

    // If client is currently authenticating/syncing, check for session readiness
    if (this.status === 'AUTHENTICATING' && this.client) {
      if (this.authenticatedUser && this.readyTimestamp) {
        logger.info(`WhatsApp client has valid active session for ${this.authenticatedUser}. Finalizing CONNECTED state.`);
        this.setConnected(this.authenticatedUser);
      } else {
        logger.info('WhatsApp client is currently AUTHENTICATING/syncing chats. Waiting up to 30s for session readiness before dispatching...');
        let waitSeconds = 0;
        while (this.status === 'AUTHENTICATING' && waitSeconds < 30) {
          try {
            const state = await this.client.getState().catch(() => null);
            const user = this.client.info?.wid?.user || this.authenticatedUser;
            if (state === 'CONNECTED' || user) {
              logger.info(`WhatsApp client confirmed ready (${state || 'ACTIVE'}). Transitioning to CONNECTED.`);
              this.setConnected(user);
              break;
            }
          } catch (_) {}

          await new Promise((r) => setTimeout(r, 2000));
          waitSeconds += 2;
          if (this.status === 'CONNECTED') {
            logger.info(`WhatsApp transitioned to CONNECTED after ${waitSeconds}s! Proceeding with dispatch.`);
            break;
          }
        }
      }
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
