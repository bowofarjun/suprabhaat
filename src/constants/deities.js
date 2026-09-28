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
    defaultImage: 'monday_shiva_shubh_somvaar_2026-09-28_10-52-00_IST.png',
    curatedImages: [
      'monday_shiva_shubh_somvaar_2026-09-28_10-52-00_IST.png',
      'monday_shiva_shubh_somvaar_2026-09-28_08-45-00_IST.jpg',
      'monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png'
    ],
    sampleBlessings: [
      'May the divine grace of Mahadev bring profound peace and serenity to your soul.\nWishing you a calm, purposeful, and blessed Monday! 🌸🕉️',
      'May Lord Shiva remove all obstacles and fill your week with clarity and devotion.\nHave an auspicious and joyous Shubh Somvaar! 🪔🙏'
    ],
    canonicalIconography: 'Lord Shiva with meditative serene divine expression, crescent moon in his matted locks (Jata), trishula, damru, holy serpent Vasuki coiled gracefully, sacred bhasma tripundra on forehead, third eye, rudraksha malas, holy kalash, gentle brass oil lamps, Nandi the sacred white bull resting nearby. Shiva Parivar with Maa Parvati in radiant traditional saree holding a lotus, baby Ganesha with sweet modak, young Kartikeya with peacock.',
    sceneVariations: [
      'Lord Shiva and Shiva Parivar (Maa Parvati, baby Ganesha, Kartikeya) in the snow-capped Himalayas near the celestial holy Ganges river, sacred Nandi bull resting serenely beside them, blooming lotus flowers and gentle oil lamps glowing in the dawn mist.',
      'Lord Shiva seated in deep peaceful meditation in Padmasana on Mount Kailash at sunrise, holy crescent moon shining, holy Ganges descending from his locks, sacred pine trees and alpine blossoms in soft morning golden light.',
      'Shiva Parivar in divine celestial darbar at Kailash, Lord Shiva offering Abhaya mudra blessing, Maa Parvati smiling with divine grace, baby Ganesha holding modak, Kartikeya with peacock, showering fragrant parijata blossoms.',
      'Lord Shiva by the sacred waters of holy Manasarovar lake at dawn, reflection of Mount Kailash on serene waters, floating golden diyas, sacred Nandi nearby, peaceful spiritual tranquility.'
    ],
    promptGuide: 'Lord Shiva and Shiva Parivar in snow-capped Himalayas near holy Ganges, meditative, serene watercolor Indian vintage calendar art.'
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
    canonicalIconography: 'Lord Hanuman with radiant golden-saffron aura, sacred vermilion sindoor, golden mace (Gada), sacred rudraksha and pearl malas, flowing red uttariya silk cloth, divine protective eyes, marigold garlands, sacred Ramayana iconography.',
    sceneVariations: [
      'Lord Hanuman in folded hands devotion (Anjali Mudra) with golden mace resting beside him, radiant golden-saffron aura, marigold flower garlands, peaceful humble expression, temple courtyard in morning golden sunlight.',
      'Veer Hanuman carrying the sacred glowing Sanjeevani herb mountain across starry dawn skies, radiant aura of courage and protection, flowing saffron cloth, majestic devotional power.',
      'Lord Hanuman seated in deep meditation chanting the sacred name of Shri Rama, sacred vermilion sindoor, glowing brass temple lamps, fragrant incense smoke, divine serenity.',
      'Lord Hanuman standing with right hand raised in divine Abhaya blessing mudra, holding golden gada, sacred rudraksha mala, radiant morning sunrise halo behind his crown, auspicious victory vibes.'
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
    canonicalIconography: 'Lord Ganesha with ornate jeweled crown, single curved tusk (Ekadanta), broad elephant ears, sacred Modak in trunk, four hands holding pasha (noose), ankusha (goad), broken tusk, and offering Abhaya mudra blessing. Mooshak (mouse) vahana offering modak, yellow pitambara silk, fragrant hibiscus and durva grass garlands.',
    sceneVariations: [
      'Lord Ganesha seated on ornate blooming pink lotus with golden modak in trunk, blessing hand in Abhaya mudra, little Mooshak offering modak, luminous brass diyas, marigold and hibiscus garlands.',
      'Lord Ganesha under sacred Kalpavriksha wish-fulfilling tree, ornate golden crown with jewels, holding pasha and ankusha, sweet motichoor laddoos in golden bowl, warm morning temple illumination.',
      'Vighnaharta Ganesha in vibrant yellow pitambara silk, seated on ornate royal chowki throne, showering golden coin blessings, surrounded by holy kalash and fresh coconut with mango leaves.',
      'Bala Ganesha playfully enjoying modak near tranquil temple pond with blooming blue and pink water lilies, gentle morning sunlight, festive auspicious atmosphere.'
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
    canonicalIconography: 'Lord Vishnu and Shri Krishna with divine blue complexion, yellow pitambara silk garments, Vanamala garland of forest flowers, Kaustubha gem on chest, peacock feather (Mayur Pankh) in crown, golden flute (Murali), Shankha, Sudarshana Chakra, Gada, and Padma. Surabhi cow and Garuda vahana.',
    sceneVariations: [
      'Lord Shri Krishna standing in graceful tribhanga posture playing golden flute (Murali) under blooming Kadamba tree on tranquil banks of holy river Yamuna, peacock feather in crown, holy Surabhi cow resting beside him.',
      'Lord Vishnu reclining on serpent Ananta Shesha in the ocean of milk (Ksheera Sagara), Maa Lakshmi reverently massaging his lotus feet, holding Shankha, Chakra, Gada, and Padma, golden divine glow.',
      'Lord Krishna as Parthasarathi in golden chariot with white divine horses at Kurukshetra dawn, glowing serene wisdom, radiant halo of cosmic guidance, golden sunrise.',
      'Lord Vishnu standing in four-armed majesty (Chaturbhuja) with pitambara yellow silk, Kaustubha gem, Vanamala garland, Garuda in reverence, showering celestial blessings.'
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
    canonicalIconography: 'Goddess Lakshmi with radiant golden complexion, four hands holding pink lotus blossoms, Varada mudra showering gold coins (dhan), and Abhaya mudra of protection. Draped in rich crimson red and gold zari silk saree, ornate gold jewelry, white sacred elephants (Gaja) offering ceremonial abhishekam, blooming pink lotus seat on serene waters.',
    sceneVariations: [
      'Goddess Lakshmi gracefully seated on large blooming pink lotus in serene temple waters, four hands showering golden coins of prosperity, holding pink lotus buds, two white royal elephants offering abhishekam with golden vessels.',
      'Maa Mahalakshmi in glowing red and gold bridal Kanjeevaram silk saree, holding sacred kalash overflowing with golden grain, glowing earthen diyas illuminating her radiant maternal smile, festive Diwali-like morning glow.',
      'Ashta Lakshmi divine manifestation, radiant golden aura, blooming lotus pond, golden temple pillars, showering fresh lotus petals and boundless auspicious abundance.',
      'Goddess Lakshmi with Lord Vishnu in Vaikuntha divine palace, seated together on golden lotus throne, surrounded by rishis and celestial beings offering fragrant incense and lamps.'
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
    canonicalIconography: 'Lord Shani Dev with majestic dark complexion, wearing deep indigo and blue silk robes, crowned with celestial diadem, holding divine bow and arrow (Dhanush-Baan) and Trishula/sword. Mounted on celestial Raven (Kak vahana), surrounded by blue aparajita flowers and glowing mustard oil lamps (Til deepak).',
    sceneVariations: [
      'Lord Shani Dev seated majestically upon his celestial sacred Raven (Kak vahana) in twilight sky with starry cosmic rings, holding divine bow and arrow, disciplined serene expression, righteous karmic protector.',
      'Lord Shani Dev standing with divine trident and sword in hand, deep indigo-blue and purple silk robes, benevolent calm gaze rewarding righteous karma, surrounded by blue lotus flowers and mustard oil lamps.',
      'Lord Shani Dev in ancient black stone temple sanctum, illuminated by glowing brass diya lamps and blue aparajita flowers, conferring patience, justice, and spiritual fortitude.',
      'Lord Shani Dev in cosmic meditative poise amidst celestial planets and constellations, blue sapphire radiant aura, steady hand raised in protection against adversity.'
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
    defaultImage: 'sunday_surya_shubh_ravivaar_2026-09-27_06-18-27_IST.jpg',
    curatedImages: [
      'sunday_surya_shubh_ravivaar_2026-09-27_06-18-27_IST.jpg',
      'sunday_surya_shubh_ravivaar_2026-09-13_09-03-34_IST.png'
    ],
    sampleBlessings: [
      'May the golden rays of Surya Bhagwan dispel all shadows and infuse your day with vitality and light.\nWishing you an invigorating, healthy, and luminous Sunday! ☀️🌸',
      'As the sun rises across the world, may your spirit awaken to infinite blessings and renewed purpose.\nHave a magnificent and blessed Shubh Ravivaar! 🪔🙏'
    ],
    canonicalIconography: 'Lord Surya Narayana standing in blazing golden chariot (Ratha) drawn by seven radiant white horses representing the seven colors of sunlight, Aruna holding reins, holding two blooming red lotuses, radiant Kavacha armor and Kundala earrings, dazzling solar halo (Prabhamandala).',
    sceneVariations: [
      'Lord Surya Bhagwan riding in golden celestial chariot drawn by seven radiant white horses across golden morning clouds, holding blooming red lotuses in both hands, dazzling solar aura, Aruna holding the reins.',
      'Surya Dev in brilliant golden armor and celestial sun-crown standing in morning sunrise sky, dispelling darkness with divine rays of vitality, health, and enlightenment, showering warm solar light on sacred river.',
      'Surya Bhagwan in classical Konark sun temple chariot style, ornate wheel motifs, seven galloping horses, sacred Gayatri mantra spiritual essence, blooming red and golden lotuses.',
      'Lord Surya in peaceful Brahma Muhurta dawn rising over holy Varanasi ghats on river Ganges, golden sun rays dancing on river waters, devotees offering Arghya water from copper vessel.'
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
