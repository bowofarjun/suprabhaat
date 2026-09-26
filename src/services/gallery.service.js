import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { DAY_DEITY_MAPPING, DAYS_ORDER } from '../constants/deities.js';
import { formatDisplayDateTime } from '../utils/date.js';
import { logger } from '../utils/logger.js';

/**
 * Service to manage devotional image catalog, day filtering, and metadata.
 */
export class GalleryService {
  /**
   * Scans and returns all available images with metadata and day associations.
   */
  static listImages(filterDay = 'monday') {
    const imagesDir = config.imagesDir;
    if (!fs.existsSync(imagesDir)) {
      return [];
    }

    const files = fs.readdirSync(imagesDir);
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

    const items = [];

    // Map known file associations
    const fileToDayMap = {
      'monday_shiva_shubh_somvaar.png': 'monday',
      '1789368804447.png': 'monday',
      'tuesday_hanuman_shubh_mangalvaar.jpg': 'tuesday',
      'wednesday_ganesha_shubh_budhvaar.jpg': 'wednesday',
      'thursday_vishnu_shubh_guruvaar.png': 'thursday',
      '1787783359587.png': 'thursday',
      'friday_lakshmi_shubh_shukravaar.jpg': 'friday',
      'saturday_shani_shubh_shanivaar.jpg': 'saturday',
      'sunday_surya_shubh_ravivaar.png': 'sunday',
      '1789270414548.png': 'sunday'
    };

    for (const filename of files) {
      const ext = path.extname(filename).toLowerCase();
      if (!validExtensions.includes(ext)) continue;

      let detectedDay = fileToDayMap[filename];

      if (!detectedDay) {
        // Detect from prefix e.g. gen_monday_... or monday_...
        const lower = filename.toLowerCase();
        for (const day of DAYS_ORDER) {
          if (lower.includes(day)) {
            detectedDay = day;
            break;
          }
        }
      }

      // Default fallback day if undetermined
      const day = detectedDay || 'monday';
      const dayConfig = DAY_DEITY_MAPPING[day];

      const fullPath = path.join(imagesDir, filename);
      let fileStat = null;
      try {
        fileStat = fs.statSync(fullPath);
      } catch (_) {}

      const fileTimestamp = fileStat ? fileStat.mtime : new Date();
      const formattedDate = formatDisplayDateTime(fileTimestamp);

      items.push({
        id: Buffer.from(filename).toString('hex').slice(0, 12),
        filename,
        url: `/images/${filename}`,
        day: day,
        dayName: dayConfig.name,
        hindiDay: dayConfig.hindiDay,
        deity: dayConfig.deity,
        deityHindi: dayConfig.deityHindi,
        greetingHindi: dayConfig.greetingHindi,
        greetingEnglish: dayConfig.greetingEnglish,
        theme: dayConfig.theme,
        colors: dayConfig.colors,
        isDefault: day === 'monday',
        isGenerated: filename.startsWith('gen_'),
        createdAt: fileTimestamp.toISOString(),
        formattedDate,
        sampleBlessing: dayConfig.sampleBlessings[0]
      });
    }

    // Sort items: Put Monday first, then follow standard weekly order
    items.sort((a, b) => {
      const indexA = DAYS_ORDER.indexOf(a.day);
      const indexB = DAYS_ORDER.indexOf(b.day);
      return indexA - indexB;
    });

    // Apply filtering
    const normalizedFilter = (filterDay || 'monday').toLowerCase();
    if (normalizedFilter === 'all') {
      return items;
    }

    const filtered = items.filter((item) => item.day === normalizedFilter);
    // If no items match filter, return Monday items
    return filtered.length > 0 ? filtered : items.filter((item) => item.day === 'monday');
  }

  /**
   * Retrieves a specific image by ID or filename.
   */
  static getImageByIdOrFilename(identifier) {
    const allImages = this.listImages('all');
    return allImages.find((img) => img.id === identifier || img.filename === identifier);
  }
}
