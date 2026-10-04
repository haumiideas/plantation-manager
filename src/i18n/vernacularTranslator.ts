import { Language } from './translations';

/**
 * Comprehensive plantation, agriculture, accounting, and estate operations
 * dictionary for English to Tamil and Malayalam vernacular translation.
 */
const ESTATE_DICTIONARY: Record<string, { ta: string; ml: string }> = {
  // Crops & Produce
  cardamom: { ta: 'ஏலக்காய்', ml: 'ഏലം' },
  'black pepper': { ta: 'கருமிளகு', ml: 'കുരുമുളക്' },
  pepper: { ta: 'மிளகு', ml: 'കുരുമുളക്' },
  coffee: { ta: 'காபி', ml: 'കാപ്പി' },
  arabica: { ta: 'அரேபிகா', ml: 'അറബിക്ക' },
  robusta: { ta: 'ரோபஸ்டா', ml: 'റോബസ്റ്റ' },
  clove: { ta: 'கிராம்பு', ml: 'ഗ്രാമ്പൂ' },
  cinnamon: { ta: 'இலவங்கப்பட்டை', ml: 'കറുവപ്പട്ട' },
  nutmeg: { ta: 'ஜாதிக்காய்', ml: 'ജാതിക്ക' },
  arecanut: { ta: 'பாக்கு', ml: 'അടയ്ക്ക' },

  // Grades
  '8mm+ bold green': { ta: '8மிமீ+ போல்ட் கிரீன்', ml: '8mm+ ബോൾഡ് ഗ്രീൻ' },
  '7-8mm extra bold': { ta: '7-8மிமீ எக்ஸ்ட்ரா போல்ட்', ml: '7-8mm എക്സ്ട്രാ ബോൾഡ്' },
  'bulk / bleached commercial': { ta: 'பல்க் / வணிக தரம்', ml: 'ബൾക്ക് / വാണിജ്യ ഗ്രേഡ്' },
  'pan / separator ripe': { ta: 'பான் / பழுத்த காய்', ml: 'പാൻ / പഴുത്ത കായ്' },
  'bold garbled tgseb': { ta: 'போல்ட் கார்பில்ட் TGSEB', ml: 'ബോൾഡ് ഗാർബിൾഡ് TGSEB' },
  'garbled malabar black pepper': { ta: 'மலபார் கார்பில்ட் கருமிளகு', ml: 'ഗാർബിൾഡ് മലബാർ കുരുമുളക്' },
  'ungarbled farm pepper': { ta: 'பண்ணை தரம் பிரிக்காத மிளகு', ml: 'തോട്ടം അൺഗാർബിൾഡ് കുരുമുളക്' },
  'pinheads / light berries': { ta: 'பின்ஹெட்ஸ் / லேசான மிளகு', ml: 'പിൻഹെഡ്സ് / ചെറിയ മണികൾ' },
  'plantation a (arabica washed)': { ta: 'பிளான்டேஷன் A (அரேபிகா வாஷ்டு)', ml: 'പ്ലാന്റേഷൻ A (അറബിക്ക വാഷ്ഡ്)' },
  'plantation pb (peaberry)': { ta: 'பிளான்டேஷன் PB (பீபெர்ரி)', ml: 'പ്ലാന്റേഷൻ PB (പീബെറി)' },
  'robusta cherry ab': { ta: 'ரோபஸ்டா செர்ரி AB', ml: 'റോബസ്റ്റ ചെറി AB' },
  'robusta parchment': { ta: 'ரோபஸ்டா பார்ச்மென்ட்', ml: 'റോബസ്റ്റ പാർച്ച്മെന്റ്' },

  // Farm Operations / Tasks
  weeding: { ta: 'களை எடுத்தல்', ml: 'കള പറിക്കൽ' },
  spraying: { ta: 'மருந்து தெளித்தல்', ml: 'മരുന്ന് തളിക്കൽ' },
  fertilizer: { ta: 'உரம் இடுதல்', ml: 'വളം ചേർക്കൽ' },
  harvest: { ta: 'அறுவடை / பறித்தல்', ml: 'വിളവെടുപ്പ്' },
  harvesting: { ta: 'அறுவடை / பறித்தல்', ml: 'വിളവെടുപ്പ്' },
  curing: { ta: 'பக்குவப்படுத்துதல் (க்யூரிங்)', ml: 'ക്യൂറിംഗ് / ഉണക്കൽ' },
  pruning: { ta: 'கவாத்து செய்தல் / கிளை நீக்குதல்', ml: 'കമ്പുകോതൽ' },
  irrigation: { ta: 'நீர்ப்பாசனம்', ml: 'നനയ്ക്കൽ' },
  fertigation: { ta: 'நீர்வழி உரமிடல் (ஃபெர்டிகேஷன்)', ml: 'ഫെർട്ടിഗേഷൻ' },
  mulching: { ta: 'மண் மூடாக்கு அமைத்தல்', ml: 'പുതയിടൽ' },
  thrashing: { ta: 'செடி தூரெடுத்தல் (திராஷிங்)', ml: 'കാട വെട്ടൽ' },
  trenches: { ta: 'மழைக்குழி / வரப்பு அமைத்தல்', ml: 'തടമെടുക്കൽ' },
  maintenance: { ta: 'பராமரிப்பு பணி', ml: 'അറ്റകുറ്റപ്പണി' },
  inspection: { ta: 'கள ஆய்வு', ml: 'തോട്ടം പരിശോധന' },
  shade: { ta: 'நிழல் ஒழுங்குபடுத்துதல்', ml: 'തണൽ ക്രമീകരണം' },

  // Fertigation & Spraying Methods
  'soil drenching': { ta: 'மண் நனைத்தல் (ரூட் டிரெஞ்சிங்)', ml: 'വേരിലേക്ക് ഒഴിക്കൽ (സോയിൽ ഡ്രെഞ്ചിംഗ്)' },
  drenching: { ta: 'நனைத்தல் (டிரெஞ்சிங்)', ml: 'ഡ്രെഞ്ചിംഗ്' },
  'canopy spraying': { ta: 'இலைத் தெளிப்பு (கனோபி ஸ்பிரேயிங்)', ml: 'തളിരില തളിക്കൽ (കാനോപി സ്പ്രേയിംഗ്)' },
  'semi-spraying': { ta: 'அரை தெளிப்பு முறை', ml: 'സെമി സ്പ്രേയിംഗ്' },
  'drip / venturi': { ta: 'சொட்டுநீர் / வெஞ்சுரி வழி', ml: 'ഡ്രിപ്പ് / വെഞ്ചുറി' },
  drip: { ta: 'சொட்டுநீர் பாசனம்', ml: 'തുള്ളിനന' },
  gravity: { ta: 'புவியீர்ப்பு முறை (கிராவிட்டி)', ml: 'ഗ്രാവിറ്റി രീതി' },
  'petrol motor': { ta: 'பெட்ரோல் மோட்டார்', ml: 'പെട്രോൾ മോട്ടോർ' },
  'diesel motor': { ta: 'டீசல் மோட்டார்', ml: 'ഡീസൽ മോട്ടോർ' },
  'current motor': { ta: 'மின்சார மோட்டார்', ml: 'കറന്റ് മോട്ടോർ (ഇലക്ട്രിക്)' },
  'electric motor': { ta: 'மின்சார மோட்டார்', ml: 'ഇലക്ട്രിക് മോട്ടോർ' },

  // Agricultural Inputs & Chemicals
  'cow dung slurry': { ta: 'சாணக்கரைசல்', ml: 'ചാണക സ്ലറി' },
  'cow dung': { ta: 'பசுஞ்சாணம்', ml: 'ചാണകം' },
  'humic acid': { ta: 'ஹியூமிக் அமிலம்', ml: 'ഹ്യൂമിക് ആസിഡ്' },
  'bordeaux mixture': { ta: 'போர்டோ கலவை (1%)', ml: 'ബോർഡോ മിശ്രിതം' },
  urea: { ta: 'யூரியா', ml: 'യൂറിയ' },
  potash: { ta: 'பொட்டாஷ்', ml: 'പൊട്ടാഷ്' },
  mop: { ta: 'மியூரியேட் ஆஃப் பொட்டாஷ் (MOP)', ml: 'MOP പൊട്ടാഷ്' },
  dap: { ta: 'டி.ஏ.பி (DAP)', ml: 'ഡി.എ.പി' },
  '19:19:19': { ta: '19:19:19 என்.பி.கே', ml: '19:19:19 NPK' },
  neem: { ta: 'வேப்ப எண்ணெய் / வேப்பம் புண்ணாக்கு', ml: 'വേപ്പെണ്ണ / വേപ്പിൻ പിണ്ണാക്ക്' },
  fungicide: { ta: 'பூஞ்சாணக்கொல்லி', ml: 'ഫംഗിസൈഡ് (കുമിൾനാശിനി)' },
  pesticide: { ta: 'பூச்சிக்கொல்லி', ml: 'കീടനാശിനി' },
  insecticide: { ta: 'பூச்சிக்கொல்லி', ml: 'കീടനാശിനി' },

  // Estate Terms & Locations
  block: { ta: 'பிளாக் / பகுதி', ml: 'ബ്ലോക്ക്' },
  division: { ta: 'பிரிவு / டிவிஷன்', ml: 'ഡിവിഷൻ' },
  ridge: { ta: 'மேட்டுப்பகுதி', ml: 'മേട്ടുപ്രദേശം' },
  valley: { ta: 'பள்ளத்தாக்கு பகுதி', ml: 'താഴ്വര' },
  nursery: { ta: 'நாற்றங்கால் (நர்சரி)', ml: 'നഴ്സറി' },
  shed: { ta: 'பண்ணை கொட்டகை', ml: 'സ്റ്റോർ ഷെഡ്' },
  store: { ta: 'பண்டகசாலை', ml: 'സ്റ്റോർ റൂം' },
  kiln: { ta: 'ஏலக்காய் உலர்த்தி (கில்ன்)', ml: 'ഏലക്കായ ഉണക്കപ്പുര (കിൻ)' },

  // Labor, Finance & Status
  workers: { ta: 'தொழிலாளர்கள்', ml: 'തൊഴിലാളികൾ' },
  worker: { ta: 'தொழிலாளி', ml: 'തൊഴിലാളി' },
  present: { ta: 'வருகை தந்தார்', ml: 'ഹാജർ' },
  absent: { ta: 'வரவில்லை', ml: 'അവധി' },
  halfday: { ta: 'அரை நாள்', ml: 'അര ദിവസം' },
  hours: { ta: 'மணிநேரம்', ml: 'മണിക്കൂർ' },
  drums: { ta: 'பீப்பாய்கள்', ml: 'വീപ്പകൾ' },
  drum: { ta: 'பீப்பாய்', ml: 'വീപ്പ' },
  litres: { ta: 'லிட்டர்கள்', ml: 'ലിറ്റർ' },
  bags: { ta: 'மூட்டைகள்', ml: 'ചാക്കുകൾ' },
  nos: { ta: 'எண்ணிக்கை', ml: 'എണ്ണം' },
  kg: { ta: 'கிலோ', ml: 'കി.ഗ്രാം' },
  diesel: { ta: 'டீசல்', ml: 'ഡീസൽ' },
  petrol: { ta: 'பெட்ரோல்', ml: 'പെട്രോൾ' },
  'engine oil': { ta: 'என்ஜின் ஆயில்', ml: 'എഞ്ചിൻ ഓയിൽ' },
  cash: { ta: 'ரொக்கம்', ml: 'പണം (ക്യാഷ്)' },
  upi: { ta: 'யூபிஐ / கூகிள்பே', ml: 'യു.പി.ഐ (GPay)' },
  'bank transfer': { ta: 'வங்கி பரிமாற்றம்', ml: 'ബാങ്ക് ട്രാൻസ്ഫർ' },
  credit: { ta: 'கடன் பாக்கி', ml: 'കടം (ക്രെഡിറ്റ്)' },
  paid: { ta: 'செலுத்தப்பட்டது', ml: 'നൽകി' },
  received: { ta: 'பெறப்பட்டது', ml: 'ലഭിച്ചു' },
  cleared: { ta: 'தீரப்பட்டது', ml: 'പൂർത്തിയായി' },
  completed: { ta: 'நிறைவடைந்தது', ml: 'പൂർത്തിയായി' },
  done: { ta: 'செய்யப்பட்டது', ml: 'ചെയ്തു' },

  // Revenue & Visit Categories
  'produce sale': { ta: 'விளைபொருள் விற்பனை', ml: 'കാർഷിക ഉൽപ്പന്ന വിൽപ്പന' },
  'farm tour': { ta: 'பண்ணை சுற்றுலா', ml: 'തോട്ടം സന്ദർശനം' },
  'farm tour fee': { ta: 'சுற்றுலா கட்டணம்', ml: 'സന്ദർശക ഫീസ്' },
  'educational visit': { ta: 'கல்விசார் களப்பயணம்', ml: 'വിദ്യാഭ്യാസ സന്ദർശനം' },
  'educational program': { ta: 'கல்விசார் திட்டம்', ml: 'വിദ്യാഭ്യാസ പ്രോഗ്രാം' },
  'scrap sale': { ta: 'பழைய கழிவு விற்பனை', ml: 'പാഴ്വസ്തു വിൽപ്പന' },
  'scrap & waste sale': { ta: 'கழிவுப் பொருட்கள் விற்பனை', ml: 'പാഴ്വസ്തു വിൽപ്പന' },
  'curing rental': { ta: 'உலர்த்தி வாடகை', ml: 'ഡ്രൈയർ വാടക' },
  'curing service fee': { ta: 'பக்குவப்படுத்துதல் கட்டணம்', ml: 'ഡ്രൈയർ സർവീസ് ഫീസ്' },
  'consulting honorarium': { ta: 'ஆலோசனை சன்மானம்', ml: 'കൺസൾട്ടിംഗ് ഫീസ്' },
  'advisory fee': { ta: 'ஆலோசனை கட்டணம்', ml: 'ഉപദേശക ഫീസ്' },
  miscellaneous: { ta: 'இதர வருமானம்', ml: 'മറ്റ് വരുമാനങ്ങൾ' },
  complimentary: { ta: 'நன்மதிப்பு / இலவசம்', ml: 'സൗജന്യം' },
  'free visit': { ta: 'இலவச வருகை', ml: 'സൗജന്യ സന്ദർശനം' },
  'free / complimentary': { ta: 'இலவசம் / நன்மதிப்பு வருகை', ml: 'സൗജന്യ സന്ദർശനം' },

  // Farms & Roster Status
  namari: { ta: 'நமரி பண்ணை', ml: 'നമാരി തോട്ടം' },
  'namari farm': { ta: 'நமரி பண்ணை', ml: 'നമാരി തോട്ടം' },
  adukidathan: { ta: 'அடுகிடாத்தன் பண்ணை', ml: 'അടുകിടാത്തൻ തോട്ടം' },
  'adukidathan farm': { ta: 'அடுகிடாத்தன் பண்ணை', ml: 'അടുകിടാത്തൻ തോട്ടം' },
  consolidated: { ta: 'ஒருங்கிணைந்த பார்வை', ml: 'സംയോജിതം' },
  operational: { ta: 'இயக்கத்தில் உள்ளது', ml: 'പ്രവർത്തനക്ഷമം' },
  breakdown: { ta: 'பழுதானது', ml: 'തകരാറിലായി' },
  active: { ta: 'செயலில்', ml: 'സജീവം' },
  'cardamom picking': { ta: 'ஏலக்காய் பறித்தல்', ml: 'ഏലം പറിക്കൽ' },
  'pepper picking': { ta: 'மிளகு பறித்தல்', ml: 'കുരുമുളക് പറിക്കൽ' },
  'general farm work': { ta: 'பொது பண்ணை வேலை', ml: 'ജനറൽ ഫാം വർക്ക്' },
  teams: { ta: 'குழுக்கள்', ml: 'ടീമുകൾ' },
  vouchers: { ta: 'பற்றுச்சீட்டுகள்', ml: 'വൗച്ചറുകൾ' },
  receipts: { ta: 'ரசீதுகள்', ml: 'രസീതുകൾ' },
};

/**
 * Common user-entered phrase templates mapped to vernacular
 */
const COMMON_PHRASES: Record<string, { ta: string; ml: string }> = {
  'weeding completed': { ta: 'களை எடுக்கும் பணி முடிந்தது', ml: 'കള പറിക്കൽ പൂർത്തിയായി' },
  'weeding done': { ta: 'களை எடுக்கப்பட்டது', ml: 'കള പറിച്ചു' },
  'canopy spraying completed': { ta: 'இலைத் தெளிப்பு பணி முடிந்தது', ml: 'തളിരില തളിക്കൽ പൂർത്തിയായി' },
  'fertilizer applied': { ta: 'உரமிடுதல் செய்யப்பட்டது', ml: 'വളം ചേർത്തു' },
  'drenching completed': { ta: 'ரூட் டிரெஞ்சிங் பணி முடிந்தது', ml: 'ഡ്രെഞ്ചിംഗ് പൂർത്തിയായി' },
  'harvest completed': { ta: 'அறுவடை நிறைவடைந்தது', ml: 'വിളവെടുപ്പ് പൂർത്തിയായി' },
  'rain day': { ta: 'மழை நாள் - வேலை நிறுத்தம்', ml: 'മഴ കാരണം ജോലി മുടങ്ങി' },
  'estate holiday': { ta: 'தோட்ட விடுமுறை', ml: 'തോട്ടം അവധി' },
  'tractor diesel refuel': { ta: 'டிராக்டர் டீசல் நிரப்பப்பட்டது', ml: 'ട്രാക്ടറിന് ഡീസൽ അടിച്ചു' },
  'advance payment': { ta: 'முன்பண வழங்கல்', ml: 'മുൻകൂർ തുക നൽകി' },
  'produce sale': { ta: 'விளைபொருள் விற்பனை', ml: 'കാർഷിക ഉൽപ്പന്ന വിൽപ്പന' },
};

/**
 * Translates a given estate title, user note, or phrase into the target language.
 * If targetLang is 'en' or text is empty, returns original text.
 */
export function translateEstateText(text: string | undefined | null, targetLang: Language): string {
  if (!text || typeof text !== 'string') return '';
  if (targetLang === 'en') return text;

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct exact phrase match
  if (COMMON_PHRASES[lower]) {
    return COMMON_PHRASES[lower][targetLang];
  }

  // 2. Direct exact dictionary match
  if (ESTATE_DICTIONARY[lower]) {
    return ESTATE_DICTIONARY[lower][targetLang];
  }

  // 3. Check if starts with common prefix like "Weeding in..."
  let translated = trimmed;

  // Substitute common known terms within the string
  // Sort dictionary keys by length descending to replace longer phrases first
  const sortedKeys = Object.keys(ESTATE_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const term of sortedKeys) {
    // Regex matching whole word/phrase boundaries, case-insensitive
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (regex.test(translated)) {
      const rep = ESTATE_DICTIONARY[term][targetLang];
      translated = translated.replace(regex, rep);
    }
  }

  // Replace common connectors
  if (targetLang === 'ta') {
    translated = translated
      .replace(/\bin\b/gi, '-ல்')
      .replace(/\band\b/gi, 'மற்றும்')
      .replace(/\bwith\b/gi, 'உடன்')
      .replace(/\bfor\b/gi, 'க்காக');
  } else if (targetLang === 'ml') {
    translated = translated
      .replace(/\bin\b/gi, '-ൽ')
      .replace(/\band\b/gi, 'കൂടാതെ')
      .replace(/\bwith\b/gi, 'നൊപ്പം')
      .replace(/\bfor\b/gi, 'വേണ്ടി');
  }

  return translated;
}
