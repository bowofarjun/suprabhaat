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

    for (const filename of files) {
      const ext = path.extname(filename).toLowerCase();
      if (!validExtensions.includes(ext)) continue;

      let detectedDay = null;
      const lower = filename.toLowerCase();
      for (const day of DAYS_ORDER) {
        if (lower.includes(day)) {
          detectedDay = day;
          break;
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

      // Robust timestamp extraction:
      // 1. Look for IST timestamp pattern: YYYY-MM-DD_HH-mm-ss_IST
      // 2. Look for 13-digit millisecond epoch
      // 3. Fallback to fileStat.mtime
      let fileDate = fileStat ? fileStat.mtime : new Date();

      const istMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})_IST/);
      if (istMatch) {
        const [, year, month, dayStr, hour, minute, second] = istMatch;
        const isoWithOffset = `${year}-${month}-${dayStr}T${hour}:${minute}:${second}+05:30`;
        const parsedDate = new Date(isoWithOffset);
        if (!isNaN(parsedDate.getTime())) {
          fileDate = parsedDate;
        }
      } else {
        const epochMatch = filename.match(/(\d{13})/);
        if (epochMatch) {
          const parsedEpoch = new Date(parseInt(epochMatch[1], 10));
          if (!isNaN(parsedEpoch.getTime())) {
            fileDate = parsedEpoch;
          }
        }
      }

      const formattedDate = formatDisplayDateTime(fileDate);

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
        createdAt: fileDate.toISOString(),
        formattedDate,
        sampleBlessing: dayConfig.sampleBlessings[0]
      });
    }

    // Sort items: Primary by weekly day order, Secondary by creation date descending (newest first)
    items.sort((a, b) => {
      const indexA = DAYS_ORDER.indexOf(a.day);
      const indexB = DAYS_ORDER.indexOf(b.day);
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
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
   * Retrieves the latest/freshest image for a given day.
   *
   * @param {string} dayKey
   * @returns {Object|null}
   */
  static getLatestImageForDay(dayKey) {
    const images = this.listImages(dayKey);
    if (!images || images.length === 0) {
      return null;
    }
    // Return freshest image (listImages sorts descending by createdAt for the filtered day)
    return images[0];
  }

  /**
   * Retrieves a specific image by ID or filename.
   */
  static getImageByIdOrFilename(identifier) {
    const allImages = this.listImages('all');
    return allImages.find((img) => img.id === identifier || img.filename === identifier);
  }
}
