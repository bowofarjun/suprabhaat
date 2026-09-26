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
