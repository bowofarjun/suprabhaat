import test from 'node:test';
import assert from 'node:assert';
import { GalleryService } from '../src/services/gallery.service.js';

test('GalleryService lists Monday images by default', () => {
  const images = GalleryService.listImages('monday');
  assert.ok(Array.isArray(images));
  assert.ok(images.length > 0, 'Monday images should exist');
  
  images.forEach((img) => {
    assert.strictEqual(img.day, 'monday');
    assert.ok(img.deity.includes('Shiva'));
    assert.strictEqual(img.greetingEnglish, 'Shubh Somvaar');
    assert.ok(img.url.startsWith('/images/'));
  });
});

test('GalleryService lists all images when day=all', () => {
  const allImages = GalleryService.listImages('all');
  assert.ok(allImages.length >= 7, 'Should contain images across days of the week');
  
  const foundDays = new Set(allImages.map((i) => i.day));
  assert.ok(foundDays.has('monday'));
  assert.ok(foundDays.has('tuesday'));
  assert.ok(foundDays.has('wednesday'));
  assert.ok(foundDays.has('thursday'));
  assert.ok(foundDays.has('friday'));
  assert.ok(foundDays.has('saturday'));
  assert.ok(foundDays.has('sunday'));
});

test('GalleryService finds image by identifier', () => {
  const allImages = GalleryService.listImages('all');
  const first = allImages[0];
  const found = GalleryService.getImageByIdOrFilename(first.id);
  assert.ok(found);
  assert.strictEqual(found.id, first.id);
  assert.strictEqual(found.filename, first.filename);
});

test('GalleryService returns freshest image with getLatestImageForDay', () => {
  const latestMonday = GalleryService.getLatestImageForDay('monday');
  assert.ok(latestMonday, 'Latest Monday image must exist');
  assert.strictEqual(latestMonday.day, 'monday');
  assert.ok(latestMonday.filename.includes('monday'));
  assert.ok(latestMonday.createdAt);
  assert.ok(latestMonday.formattedDate.includes('IST'));
});

