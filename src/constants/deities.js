/**
 * Day-to-Deity Mapping and Cultural Specifications
 * Aligned with traditional Hindu days of the week.
 */

export const DAY_DEITY_MAPPING = {
  monday: {
    id: 'monday',
    dayIndex: 1, // JS Date.getDay() -> 1
    name: 'Monday',
    hindiDay: 'सोमवार',
    greetingHindi: 'शुभ सोमवार',
    greetingEnglish: 'Shubh Somvaar',
    deity: 'Lord Shiva',
    deityHindi: 'भगवान शिव एवं शिव परिवार',
    theme: 'Peace, Meditation, Inner Strength, Auspicious New Beginnings',
    colors: {
      primary: '#4F46E5',
      secondary: '#E0E7FF',
      accent: '#6366F1'
    },
    defaultImage: 'monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png',
    curatedImages: [
      'monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png'
    ],
    sampleBlessings: [
      'May the divine grace of Mahadev bring profound peace and serenity to your soul.\nWishing you a calm, purposeful, and blessed Monday! 🌸🕉️',
      'May Lord Shiva remove all obstacles and fill your week with clarity and devotion.\nHave an auspicious and joyous Shubh Somvaar! 🪔🙏'
    ],
    promptGuide: 'Lord Shiva and Shiva Parivar (Parvati, Ganesha, Kartikeya) in Himalayas near holy Ganges, meditative, serene watercolor Indian vintage calendar art.'
  },
  tuesday: {
    id: 'tuesday',
    dayIndex: 2,
    name: 'Tuesday',
    hindiDay: 'मंगलवार',
    greetingHindi: 'शुभ मंगलवार',
    greetingEnglish: 'Shubh Mangalvaar',
    deity: 'Lord Hanuman',
    deityHindi: 'संकट मोचन श्री हनुमान जी',
    theme: 'Strength, Protection, Devotion, Fearlessness, Energy',
    colors: {
      primary: '#EA580C',
      secondary: '#FFEDD5',
      accent: '#F97316'
    },
    defaultImage: 'tuesday_hanuman_shubh_mangalvaar_2026-09-26_17-16-56_IST.jpg',
    curatedImages: [
      'tuesday_hanuman_shubh_mangalvaar_2026-09-26_17-16-56_IST.jpg'
    ],
    sampleBlessings: [
      'May Sankat Mochan Hanuman ji bless you with boundless courage and protect you from all harm.\nWishing you a vibrant, triumphant, and energetic Tuesday! 🚩🙏',
      'May the grace of Bajrangbali fill your heart with devotion, determination, and supreme strength.\nHave an auspicious and blissful Shubh Mangalvaar! 🪔✨'
    ],
    promptGuide: 'Lord Hanuman in folded hands devotion with golden mace, radiant aura, marigold flowers, vintage Indian calendar art.'
  },
  wednesday: {
    id: 'wednesday',
    dayIndex: 3,
    name: 'Wednesday',
    hindiDay: 'बुधवार',
    greetingHindi: 'शुभ बुधवार',
    greetingEnglish: 'Shubh Budhvaar',
    deity: 'Lord Ganesha',
    deityHindi: 'विघ्नहर्ता श्री गणेश',
    theme: 'Wisdom, Intellect, Removal of Obstacles, Auspicious Success',
    colors: {
      primary: '#D97706',
      secondary: '#FEF3C7',
      accent: '#F59E0B'
    },
    defaultImage: 'wednesday_ganesha_shubh_budhvaar_2026-09-26_17-17-22_IST.jpg',
    curatedImages: [
      'wednesday_ganesha_shubh_budhvaar_2026-09-26_17-17-22_IST.jpg'
    ],
    sampleBlessings: [
      'May Vighnaharta Lord Ganesha remove every obstacle and illuminate your mind with divine intellect.\nWishing you a prosperous, creative, and joyful Wednesday! 🐘🌸',
      'May Lord Ganpati bless your endeavors with auspicious success, sweetness, and enduring harmony.\nHave a wonderful and blessed Shubh Budhvaar! 🪔🙏'
    ],
    promptGuide: 'Lord Ganesha seated on lotus with modak, blessing hand, luminous diyas, vintage calendar watercolor art.'
  },
  thursday: {
    id: 'thursday',
    dayIndex: 4,
    name: 'Thursday',
    hindiDay: 'गुरुवार',
    greetingHindi: 'शुभ गुरुवार',
    greetingEnglish: 'Shubh Guruvaar',
    deity: 'Lord Vishnu / Shri Krishna',
    deityHindi: 'भगवान श्री हरि विष्णु एवं श्री कृष्ण',
    theme: 'Wisdom, Dharma, Compassion, Spiritual Abundance, Guidance',
    colors: {
      primary: '#CA8A04',
      secondary: '#FEF9C3',
      accent: '#EAB308'
    },
    defaultImage: 'thursday_vishnu_shubh_guruvaar_2026-08-27_03-59-19_IST.png',
    curatedImages: [
      'thursday_vishnu_shubh_guruvaar_2026-08-27_03-59-19_IST.png'
    ],
    sampleBlessings: [
      'May the gentle music of Shri Krishna’s flute inspire peace, virtue, and compassion in your life.\nWishing you a spiritually uplifting and tranquil Thursday! 🦚🌸',
      'May Lord Vishnu sustain your endeavors with dharma, wisdom, and eternal grace.\nHave a deeply serene and blessed Shubh Guruvaar! 🪔✨'
    ],
    promptGuide: 'Lord Krishna playing flute on lotus near tranquil stream, peacock feather, vintage Indian calendar art.'
  },
  friday: {
    id: 'friday',
    dayIndex: 5,
    name: 'Friday',
    hindiDay: 'शुक्रवार',
    greetingHindi: 'शुभ शुक्रवार',
    greetingEnglish: 'Shubh Shukravaar',
    deity: 'Goddess Lakshmi',
    deityHindi: 'माता महालक्ष्मी',
    theme: 'Prosperity, Well-being, Abundance, Radiance, Inner Wealth',
    colors: {
      primary: '#E11D48',
      secondary: '#FFE4E6',
      accent: '#F43F5E'
    },
    defaultImage: 'friday_lakshmi_shubh_shukravaar_2026-09-26_17-17-52_IST.jpg',
    curatedImages: [
      'friday_lakshmi_shubh_shukravaar_2026-09-26_17-17-52_IST.jpg'
    ],
    sampleBlessings: [
      'May Devi Mahalakshmi shower your home with everlasting prosperity, radiant health, and contentment.\nWishing you a joyful, abundant, and blessed Friday! 🪷💰',
      'May the divine mother bless you with both material abundance and the supreme wealth of virtue.\nHave a luminous and peaceful Shubh Shukravaar! 🪔🙏'
    ],
    promptGuide: 'Goddess Lakshmi on blooming lotus on serene waters, gold coins showering, elephants in background, vintage Indian calendar art.'
  },
  saturday: {
    id: 'saturday',
    dayIndex: 6,
    name: 'Saturday',
    hindiDay: 'शनिवार',
    greetingHindi: 'शुभ शनिवार',
    greetingEnglish: 'Shubh Shanivaar',
    deity: 'Lord Shani Dev',
    deityHindi: 'भगवान श्री शनि देव',
    theme: 'Justice, Right Conduct, Patience, Discipline, Karma',
    colors: {
      primary: '#4338CA',
      secondary: '#E0E7FF',
      accent: '#4F46E5'
    },
    defaultImage: 'saturday_shani_shubh_shanivaar_2026-09-26_17-18-24_IST.jpg',
    curatedImages: [
      'saturday_shani_shubh_shanivaar_2026-09-26_17-18-24_IST.jpg'
    ],
    sampleBlessings: [
      'May Lord Shani Dev reward your righteous deeds, steady your patience, and guide your moral journey.\nWishing you a disciplined, balanced, and peaceful Saturday! ⚖️🙏',
      'May divine karma bring clarity, perseverance, and true justice to all your endeavors.\nHave an auspicious, calm, and blessed Shubh Shanivaar! 🪔✨'
    ],
    promptGuide: 'Lord Shani Dev seated on raven in celestial starry twilight sky with bow and trident, majestic vintage Indian calendar art.'
  },
  sunday: {
    id: 'sunday',
    dayIndex: 0, // JS Date.getDay() -> 0
    name: 'Sunday',
    hindiDay: 'रविवार',
    greetingHindi: 'शुभ रविवार',
    greetingEnglish: 'Shubh Ravivaar',
    deity: 'Lord Surya',
    deityHindi: 'भगवान सूर्य नारायण',
    theme: 'Life-Force, Vitality, Enlightenment, New Dawn, Health',
    colors: {
      primary: '#B45309',
      secondary: '#FEF3C7',
      accent: '#D97706'
    },
    defaultImage: 'sunday_surya_shubh_ravivaar_2026-09-13_09-03-34_IST.png',
    curatedImages: [
      'sunday_surya_shubh_ravivaar_2026-09-13_09-03-34_IST.png'
    ],
    sampleBlessings: [
      'May the golden rays of Surya Bhagwan dispel all shadows and infuse your day with vitality and light.\nWishing you an invigorating, healthy, and luminous Sunday! ☀️🌸',
      'As the sun rises across the world, may your spirit awaken to infinite blessings and renewed purpose.\nHave a magnificent and blessed Shubh Ravivaar! 🪔🙏'
    ],
    promptGuide: 'Surya Dev in golden chariot drawn by 7 horses across morning sky, lotus in hand, antique parchment style.'
  }
};

export const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function getDayConfig(dayKey) {
  if (!dayKey) return DAY_DEITY_MAPPING.monday;
  const normalized = dayKey.toLowerCase();
  return DAY_DEITY_MAPPING[normalized] || DAY_DEITY_MAPPING.monday;
}

export function getCurrentDayConfig() {
  const dayIndex = new Date().getDay();
  const dayKey = Object.keys(DAY_DEITY_MAPPING).find(
    (key) => DAY_DEITY_MAPPING[key].dayIndex === dayIndex
  );
  return DAY_DEITY_MAPPING[dayKey] || DAY_DEITY_MAPPING.monday;
}
