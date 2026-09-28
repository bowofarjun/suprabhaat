import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getDayConfig } from '../constants/deities.js';
import { getFormattedDateTimeStamp } from '../utils/date.js';
import { GalleryService } from './gallery.service.js';
import fs from 'fs';
import path from 'path';

let genAIClient = null;

/**
 * Initializes the Google GenAI SDK client lazily.
 */
async function getGenAIClient() {
  if (genAIClient) return genAIClient;
  if (!config.geminiApiKey) {
    logger.warn('GEMINI_API_KEY is not configured. GenAI client running in fallback mode.');
    return null;
  }

  try {
    // Attempt official @google/genai first
    const { GoogleGenAI } = await import('@google/genai');
    genAIClient = {
      type: 'google-genai',
      client: new GoogleGenAI({ apiKey: config.geminiApiKey })
    };
    logger.info('Initialized Google GenAI SDK (@google/genai) successfully.');
    return genAIClient;
  } catch (err) {
    logger.warn(`Could not load @google/genai, attempting @google/generative-ai fallback: ${err.message}`);
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      genAIClient = {
        type: 'google-generative-ai',
        client: new GoogleGenerativeAI(config.geminiApiKey)
      };
      logger.info('Initialized fallback GoogleGenerativeAI successfully.');
      return genAIClient;
    } catch (fallbackErr) {
      logger.error(`Failed to initialize any GenAI SDK: ${fallbackErr.message}`);
      return null;
    }
  }
}

/**
 * Generates a 2-line devotional morning blessing in English with 1-2 emojis.
 *
 * @param {string} dayKey - e.g. 'monday', 'tuesday', etc.
 * @returns {Promise<string>}
 */
export async function generateDevotionalBlessing(dayKey) {
  const dayConfig = getDayConfig(dayKey);
  const clientObj = await getGenAIClient();

  if (!clientObj || !config.geminiApiKey) {
    // Select one of the authentic curated blessings
    const fallbackList = dayConfig.sampleBlessings;
    const randomIndex = Math.floor(Math.random() * fallbackList.length);
    logger.info(`Using curated blessing fallback for ${dayConfig.name}.`);
    return fallbackList[randomIndex];
  }

  const prompt = `You are a respectful and poetic spiritual author.
Compose a morning devotional blessing for ${dayConfig.name} dedicated to ${dayConfig.deity} (${dayConfig.deityHindi}).
Traditional greeting: "${dayConfig.greetingHindi}" (${dayConfig.greetingEnglish}).
Core devotional focus: ${dayConfig.theme}.

STRICT FORMAT REQUIREMENTS:
1. Exactly 2 lines of uplifting, peaceful, and auspicious English text.
2. Include 1 to 2 tasteful, serene emojis (such as 🌸, 🕉️, 🪔, ☀️, 🙏).
3. Do NOT include quotation marks, markdown headings, bullet points, or extra lines.
4. Line 1 invokes the deity's blessings/peace for the morning.
5. Line 2 expresses a warm wish for the specific day (e.g. "Wishing you a peaceful and auspicious Shubh Somvaar!").`;

  try {
    let blessingText = '';

    if (clientObj.type === 'google-genai') {
      const response = await clientObj.client.models.generateContent({
        model: config.geminiModel || 'gemini-2.5-flash',
        contents: prompt
      });
      blessingText = response?.text?.trim() || '';
    } else {
      const model = clientObj.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      blessingText = result?.response?.text()?.trim() || '';
    }

    if (!blessingText) {
      throw new Error('Empty response received from GenAI model');
    }

    // Clean up any extraneous quotes or whitespace
    blessingText = blessingText.replace(/^["']|["']$/g, '').trim();
    logger.info(`Successfully generated devotional blessing for ${dayConfig.name} via Gemini.`);
    return blessingText;
  } catch (error) {
    logger.error(`Gemini blessing generation error: ${error.message}. Reverting to curated blessing.`);
    const fallbackList = dayConfig.sampleBlessings;
    return fallbackList[Math.floor(Math.random() * fallbackList.length)];
  }
}

/**
 * Builds a canonical, high-detail prompt for deity sacred art generation with:
 * 1. Dynamic weekly variation (rotating through sceneVariations)
 * 2. Strict Puranic & Vedic canonical iconography
 * 3. Warm temple aesthetics and vintage calendar art style
 * 4. Strict negative constraint against any text, typography, or watermarks
 *
 * @param {Object} dayConfig - The day configuration object from deities.js
 * @param {Date} [date=new Date()] - Date to compute the weekly variation
 * @param {number|null} [variationIndex=null] - Specific variation index (0-3) if explicitly chosen
 * @returns {string} The fully assembled sacred prompt
 */
export function buildDeityArtPrompt(dayConfig, date = new Date(), variationIndex = null) {
  const variations = dayConfig.sceneVariations && dayConfig.sceneVariations.length > 0
    ? dayConfig.sceneVariations
    : [dayConfig.promptGuide || `Lord ${dayConfig.deity} in divine temple setting`];

  let chosenIndex;
  if (variationIndex !== null && variationIndex !== undefined && !isNaN(variationIndex)) {
    chosenIndex = Math.abs(parseInt(variationIndex, 10)) % variations.length;
  } else {
    // Week-of-month rotation: week 1 -> 0, week 2 -> 1, week 3 -> 2, week 4 -> 3
    const dayOfMonth = date.getDate();
    chosenIndex = Math.floor((dayOfMonth - 1) / 7) % variations.length;
  }

  const selectedScene = variations[chosenIndex];
  const iconography = dayConfig.canonicalIconography || '';

  return `A breathtaking, high-detail devotional vintage Indian calendar art watercolor and tempera painting. ${selectedScene} ${iconography} Ornate decorative gold paisley floral border, warm peaceful temple aesthetics, radiant divine lighting, rich harmonious devotional colors, 8k masterpiece. Pure sacred artwork, completely free of any text, letters, words, typography, devanagari, subtitles, captions, numbers, labels, signs, borders with text, signatures, or watermarks.`.trim();
}

/**
 * Validates the raw image buffer received from the GenAI model.
 * Enforces minimum byte size and valid header magic numbers (PNG/JPEG/WEBP).
 *
 * @param {Buffer} buffer
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateImageBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { valid: false, reason: 'Invalid or missing buffer' };
  }
  if (buffer.length < 40000) {
    return { valid: false, reason: `Image buffer too small (${buffer.length} bytes), likely corrupted or truncated` };
  }
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isWebp = buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!isPng && !isJpg && !isWebp) {
    return { valid: false, reason: 'Invalid image format magic numbers' };
  }
  return { valid: true };
}

/**
 * Generates or retrieves a high-resolution deity portrait.
 * Primary: Attempts Imagen via Google GenAI with weekly variations & validation.
 * Resilient fallback: Uses the pre-generated curated artwork.
 *
 * @param {string} dayKey
 * @param {Object} [options={}]
 * @param {Date} [options.date]
 * @param {number|null} [options.variationIndex]
 * @returns {Promise<{ filename: string, filepath: string, url: string, isGenerated: boolean, source: string, createdAt: string }>}
 */
export async function getOrGenerateDeityImage(dayKey, options = {}) {
  const dayConfig = getDayConfig(dayKey);
  const clientObj = await getGenAIClient();
  const date = options.date || new Date();
  const variationIndex = options.variationIndex !== undefined ? options.variationIndex : null;

  // If GenAI client is available, attempt dynamic generation
  if (clientObj && config.geminiApiKey && clientObj.type === 'google-genai') {
    try {
      const prompt = buildDeityArtPrompt(dayConfig, date, variationIndex);
      const chosenVar = variationIndex !== null ? variationIndex : Math.floor((date.getDate() - 1) / 7) % (dayConfig.sceneVariations?.length || 1);
      logger.info(`Generating dynamic deity artwork for ${dayConfig.name} (scene variation ${chosenVar + 1} of ${dayConfig.sceneVariations?.length || 1})...`);

      // Modern Gemini image model endpoint
      const imageModels = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image'];
      for (const model of imageModels) {
        try {
          const response = await clientObj.client.models.generateContent({
            model,
            contents: prompt
          });

          const parts = response?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              const imageBytesBase64 = part.inlineData.data;
              const buffer = Buffer.from(imageBytesBase64, 'base64');

              const validation = validateImageBuffer(buffer);
              if (!validation.valid) {
                logger.warn(`Generated image failed validation (${validation.reason}). Rejecting.`);
                continue;
              }

              const timestampStr = getFormattedDateTimeStamp();
              const ext = part.inlineData.mimeType?.includes('png') ? 'png' : 'jpg';
              const filename = `gen_${dayConfig.id}_${timestampStr}.${ext}`;
              const filepath = path.join(config.imagesDir, filename);

              fs.writeFileSync(filepath, buffer);
              logger.info(`Generated and validated new deity portrait via Gemini (${model}): ${filename} (${buffer.length} bytes)`);

              return {
                filename,
                filepath,
                url: `/images/${filename}`,
                isGenerated: true,
                source: 'ai-generated',
                createdAt: new Date().toISOString()
              };
            }
          }
        } catch (err) {
          // If model is unsupported on current tier, log and proceed to next model/fallback
          logger.warn(`AI image generation via ${model} unavailable: ${err.message}`);
        }
      }
    } catch (e) {
      logger.warn(`AI image generation error: ${e.message}`);
    }
  }

  // Resilient Fallback to freshest curated or generated image in library
  const latest = GalleryService.getLatestImageForDay(dayConfig.id);
  if (latest) {
    logger.info(`AI image generation requires Vertex AI or pay-as-you-go quota (Free Tier quota: 0). Using sacred artwork: ${latest.filename} (${latest.isGenerated ? 'Generated' : 'Curated Gallery'}).`);
    return {
      filename: latest.filename,
      filepath: path.join(config.imagesDir, latest.filename),
      url: latest.url,
      isGenerated: latest.isGenerated,
      source: latest.isGenerated ? 'ai-generated' : 'curated-gallery',
      createdAt: latest.createdAt
    };
  }

  const filename = dayConfig.defaultImage;
  const filepath = path.join(config.imagesDir, filename);
  logger.info(`Using default curated deity artwork: ${filename}.`);
  return {
    filename,
    filepath,
    url: `/images/${filename}`,
    isGenerated: false,
    source: 'curated-gallery',
    createdAt: new Date().toISOString()
  };
}
