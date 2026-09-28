import test from 'node:test';
import assert from 'node:assert';
import { DAY_DEITY_MAPPING, DAYS_ORDER, getDayConfig, getCurrentDayConfig } from '../src/constants/deities.js';

test('Day-to-Deity Mapping contains all 7 traditional days', () => {
  assert.strictEqual(DAYS_ORDER.length, 7);
  assert.deepStrictEqual(DAYS_ORDER, [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ]);
});

test('Monday maps to Lord Shiva with Shubh Somvaar', () => {
  const mon = DAY_DEITY_MAPPING.monday;
  assert.strictEqual(mon.name, 'Monday');
  assert.strictEqual(mon.hindiDay, 'सोमवार');
  assert.strictEqual(mon.greetingHindi, 'शुभ सोमवार');
  assert.strictEqual(mon.greetingEnglish, 'Shubh Somvaar');
  assert.strictEqual(mon.deity, 'Lord Shiva');
});

test('Tuesday maps to Lord Hanuman with Shubh Mangalvaar', () => {
  const tue = DAY_DEITY_MAPPING.tuesday;
  assert.strictEqual(tue.name, 'Tuesday');
  assert.strictEqual(tue.greetingHindi, 'शुभ मंगलवार');
  assert.strictEqual(tue.greetingEnglish, 'Shubh Mangalvaar');
  assert.strictEqual(tue.deity, 'Lord Hanuman');
});

test('Wednesday maps to Lord Ganesha with Shubh Budhvaar', () => {
  const wed = DAY_DEITY_MAPPING.wednesday;
  assert.strictEqual(wed.name, 'Wednesday');
  assert.strictEqual(wed.greetingHindi, 'शुभ बुधवार');
  assert.strictEqual(wed.greetingEnglish, 'Shubh Budhvaar');
  assert.strictEqual(wed.deity, 'Lord Ganesha');
});

test('Thursday maps to Lord Vishnu / Krishna with Shubh Guruvaar', () => {
  const thu = DAY_DEITY_MAPPING.thursday;
  assert.strictEqual(thu.name, 'Thursday');
  assert.strictEqual(thu.greetingHindi, 'शुभ गुरुवार');
  assert.strictEqual(thu.greetingEnglish, 'Shubh Guruvaar');
  assert.ok(thu.deity.includes('Vishnu'));
});

test('Friday maps to Goddess Lakshmi with Shubh Shukravaar', () => {
  const fri = DAY_DEITY_MAPPING.friday;
  assert.strictEqual(fri.name, 'Friday');
  assert.strictEqual(fri.greetingHindi, 'शुभ शुक्रवार');
  assert.strictEqual(fri.greetingEnglish, 'Shubh Shukravaar');
  assert.strictEqual(fri.deity, 'Goddess Lakshmi');
});

test('Saturday maps to Lord Shani with Shubh Shanivaar', () => {
  const sat = DAY_DEITY_MAPPING.saturday;
  assert.strictEqual(sat.name, 'Saturday');
  assert.strictEqual(sat.greetingHindi, 'शुभ शनिवार');
  assert.strictEqual(sat.greetingEnglish, 'Shubh Shanivaar');
  assert.strictEqual(sat.deity, 'Lord Shani Dev');
});

test('Sunday maps to Lord Surya with Shubh Ravivaar', () => {
  const sun = DAY_DEITY_MAPPING.sunday;
  assert.strictEqual(sun.name, 'Sunday');
  assert.strictEqual(sun.greetingHindi, 'शुभ रविवार');
  assert.strictEqual(sun.greetingEnglish, 'Shubh Ravivaar');
  assert.strictEqual(sun.deity, 'Lord Surya');
});

test('getDayConfig defaults to Monday when empty', () => {
  const def = getDayConfig();
  assert.strictEqual(def.id, 'monday');
  assert.strictEqual(def.deity, 'Lord Shiva');
});

test('getCurrentDayConfig returns valid configuration for today', () => {
  const current = getCurrentDayConfig();
  assert.ok(current);
  assert.ok(current.id);
  assert.ok(current.deity);
  assert.ok(current.sampleBlessings.length > 0);
});

test('All 7 days have canonical iconography and 4 scene variations', () => {
  for (const day of DAYS_ORDER) {
    const config = DAY_DEITY_MAPPING[day];
    assert.ok(config.canonicalIconography, `${day} missing canonicalIconography`);
    assert.ok(Array.isArray(config.sceneVariations), `${day} sceneVariations must be an array`);
    assert.strictEqual(config.sceneVariations.length, 4, `${day} must have exactly 4 scene variations`);
  }
});

test('buildDeityArtPrompt rotates variations across weeks and forbids text', async () => {
  const { buildDeityArtPrompt } = await import('../src/services/ai.service.js');
  const monday = DAY_DEITY_MAPPING.monday;

  const promptWeek1 = buildDeityArtPrompt(monday, new Date('2026-09-01')); // Day 1 -> index 0
  const promptWeek2 = buildDeityArtPrompt(monday, new Date('2026-09-08')); // Day 8 -> index 1
  const promptWeek3 = buildDeityArtPrompt(monday, new Date('2026-09-15')); // Day 15 -> index 2
  const promptWeek4 = buildDeityArtPrompt(monday, new Date('2026-09-22')); // Day 22 -> index 3

  assert.notStrictEqual(promptWeek1, promptWeek2, 'Week 1 and Week 2 prompts must differ');
  assert.notStrictEqual(promptWeek2, promptWeek3, 'Week 2 and Week 3 prompts must differ');
  assert.notStrictEqual(promptWeek3, promptWeek4, 'Week 3 and Week 4 prompts must differ');

  // Verify pure text-free negative constraint
  assert.ok(promptWeek1.includes('Pure sacred artwork, completely free of any text'));
  assert.ok(promptWeek1.includes(monday.canonicalIconography));
});

test('validateImageBuffer validates buffer size and magic bytes', async () => {
  const { validateImageBuffer } = await import('../src/services/ai.service.js');

  // Too small
  assert.strictEqual(validateImageBuffer(Buffer.alloc(100)).valid, false);

  // Invalid magic numbers
  assert.strictEqual(validateImageBuffer(Buffer.alloc(50000)).valid, false);

  // Valid PNG header
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const validPng = Buffer.concat([pngHeader, Buffer.alloc(45000)]);
  assert.strictEqual(validateImageBuffer(validPng).valid, true);

  // Valid JPEG header
  const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
  const validJpg = Buffer.concat([jpgHeader, Buffer.alloc(45000)]);
  assert.strictEqual(validateImageBuffer(validJpg).valid, true);
});
