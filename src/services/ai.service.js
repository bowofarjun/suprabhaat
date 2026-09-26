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
 * Generates or retrieves a high-resolution deity portrait.
 * Primary: Attempts Imagen via Google GenAI.
 * Resilient fallback: Uses the pre-generated curated artwork.
 *
 * @param {string} dayKey
 * @returns {Promise<{ filename: string, filepath: string, url: string, isGenerated: boolean }>}
 */
export async function getOrGenerateDeityImage(dayKey) {
  const dayConfig = getDayConfig(dayKey);
  const clientObj = await getGenAIClient();

  // If GenAI client supports image generation
  if (clientObj && config.geminiApiKey && clientObj.type === 'google-genai') {
    try {
      const prompt = `Vintage traditional Indian calendar art watercolor painting of ${dayConfig.deity}, ${dayConfig.promptGuide}. At the bottom, elegant traditional lettering says "${dayConfig.greetingHindi}" and "${dayConfig.greetingEnglish}". Ornate decorative paisley border, warm peaceful temple aesthetics, 8k masterpiece.`;
      
      if (clientObj.client.models && typeof clientObj.client.models.generateImages === 'function') {
        const response = await clientObj.client.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '3:4',
            outputMimeType: 'image/jpeg'
          }
        });

        if (response?.generatedImages?.[0]?.image?.imageBytes) {
          const imageBytesBase64 = response.generatedImages[0].image.imageBytes;
          const timestampStr = getFormattedDateTimeStamp();
          const filename = `gen_${dayConfig.id}_${timestampStr}.jpg`;
          const filepath = path.join(config.imagesDir, filename);

          fs.writeFileSync(filepath, Buffer.from(imageBytesBase64, 'base64'));
          logger.info(`Generated new deity portrait via Imagen with timestamp: ${filename}`);

          return {
            filename,
            filepath,
            url: `/images/${filename}`,
            isGenerated: true,
            createdAt: new Date().toISOString()
          };
        }
      }
    } catch (imgErr) {
      logger.warn(`Imagen generation failed (${imgErr.message}). Falling back to curated image.`);
    }
  }

  // Resilient Fallback to freshest curated or generated image in library
  const latest = GalleryService.getLatestImageForDay(dayConfig.id);
  if (latest) {
    return {
      filename: latest.filename,
      filepath: path.join(config.imagesDir, latest.filename),
      url: latest.url,
      isGenerated: latest.isGenerated,
      createdAt: latest.createdAt
    };
  }

  const filename = dayConfig.defaultImage;
  const filepath = path.join(config.imagesDir, filename);
  return {
    filename,
    filepath,
    url: `/images/${filename}`,
    isGenerated: false,
    createdAt: new Date().toISOString()
  };
}
