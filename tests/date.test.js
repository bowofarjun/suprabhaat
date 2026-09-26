import test from 'node:test';
import assert from 'node:assert';
import { getFormattedDateTimeStamp, formatDisplayDateTime } from '../src/utils/date.js';
import { GalleryService } from '../src/services/gallery.service.js';

test('getFormattedDateTimeStamp generates valid IST filesystem timestamp', () => {
  const ts = getFormattedDateTimeStamp(new Date('2026-09-26T07:00:00.000Z'));
  assert.ok(typeof ts === 'string');
  assert.ok(ts.endsWith('_IST'));
  // Format check YYYY-MM-DD_HH-mm-ss_IST
  assert.match(ts, /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_IST$/);
});

test('formatDisplayDateTime generates friendly human readable IST string', () => {
  const formatted = formatDisplayDateTime(new Date('2026-09-26T01:30:00.000Z'));
  assert.ok(typeof formatted === 'string');
  assert.ok(formatted.includes('IST'));
  assert.ok(formatted.includes('2026'));
});

test('GalleryService includes date-time stamps on all images in catalog', () => {
  const mondayImages = GalleryService.listImages('monday');
  assert.ok(mondayImages.length > 0);

  mondayImages.forEach((img) => {
    assert.ok(img.createdAt, 'Image must have createdAt timestamp');
    assert.ok(img.formattedDate, 'Image must have human-readable formattedDate');
    assert.ok(img.formattedDate.includes('IST'));
  });
});
