import { Language } from '../i18n/translations';

// Localized worker name dictionary
const WORKER_NAME_TRANSLATIONS: Record<string, { ta: string; ml: string }> = {
  'Muthusamy K.': { ta: 'முத்துசாமி K.', ml: 'മുത്തുസ്വാമി K.' },
  'Selvi M.': { ta: 'செல்வி M.', ml: 'സെൽവി M.' },
  'Somnath Das': { ta: 'சோம்நாத் தாஸ்', ml: 'സോമനാഥ് ദാസ്' },
  'Karthik Raja': { ta: 'கார்த்திக் ராஜா', ml: 'കാർത്തിക് രാജ' },
  'Mariammal P.': { ta: 'மாரியம்மாள் P.', ml: 'മാരിയമ്മാൾ P.' },
  'Ganesan S.': { ta: 'கணேசன் S.', ml: 'ഗണേശൻ S.' },
  'Ponnusamy T.': { ta: 'பொன்னுசாமி T.', ml: 'പൊന്നുസ്വാമി T.' },
  'Lakshmi V.': { ta: 'லட்சுமி V.', ml: 'ലക്ഷ്മി V.' },
  'Murugan C.': { ta: 'முருகன் C.', ml: 'മുരുഗൻ C.' },
  'Chinnathambi R.': { ta: 'சின்னத்தம்பி R.', ml: 'ചിന്നത്തമ്പി R.' },
};

// Localized task dictionary
const TASK_TRANSLATIONS: Record<string, { ta: string; ml: string }> = {
  'Cardamom Picking (2nd Flush)': {
    ta: 'ஏலக்காய் பறித்தல் (2வது முறை)',
    ml: 'ഏലം വിളവെടുപ്പ് (രണ്ടാം ഘട്ടം)',
  },
  'Cardamom Picking (1st Flush)': {
    ta: 'ஏலக்காய் பறித்தல் (1வது முறை)',
    ml: 'ഏലം വിളവെടുപ്പ് (ഒന്നാം ഘട്ടം)',
  },
  'Pepper Plucking & Spikes': {
    ta: 'மிளகு பறித்தல் & திரிகள்',
    ml: 'കുരുമുളക് പറിക്കലും തിരികളും',
  },
  'Pepper Threshing & Drying Yard': {
    ta: 'மிளகு பிரித்தல் & உலர் களம்',
    ml: 'കുരുമുളക് മെതിക്കലും ഉണക്കലും',
  },
  'Bordeaux Mixture Spraying': {
    ta: 'போர்டோ கலவை தெளித்தல்',
    ml: 'ബോർഡോ മിശ്രിതം തളിക്കൽ',
  },
  'Foliar Nutrient Spraying': {
    ta: 'இலைவழி ஊட்டச்சத்து தெளித்தல்',
    ml: 'ഇലകളിൽ പോഷക സ്പ്രേ',
  },
  'Weeding, Mulching & Basin Clearing': {
    ta: 'களை எடுத்தல் & பாத்தி தூய்மை',
    ml: 'കളപറിക്കലും തടമെടുക്കലും',
  },
  'Curing Furnace Firing & Loading': {
    ta: 'உலர்த்தல் அடுப்பு எரித்தல் & ஏற்றுதல்',
    ml: 'ഡ്രൈയർ അടുപ്പ് കത്തിക്കലും ലോഡിംഗും',
  },
  'Shade Tree Lopping & Standards': {
    ta: 'நிழல் மர கிளை வெட்டுதல்',
    ml: 'തണൽമര കൊമ്പു കോതൽ',
  },
  'General Estate & Heavy Trenching': {
    ta: 'பொது பண்ணை வேலை & அகழி வெட்டுதல்',
    ml: 'ജനറൽ തോട്ടം പണി & ചാൽ കീറൽ',
  },
  'Cardamom Picking': {
    ta: 'ஏலக்காய் பறித்தல்',
    ml: 'ഏലം വിളവെടുപ്പ്',
  },
  'Pepper Plucking': {
    ta: 'மிளகு பறித்தல்',
    ml: 'കുരുമുളക് പറിക്കൽ',
  },
  'Weeding & Mulching': {
    ta: 'களை எடுத்தல் & மூடாக்கு',
    ml: 'കളപറിക്കലും പുതയിടലും',
  },
  'Spraying': {
    ta: 'மருந்து தெளித்தல்',
    ml: 'സ്പ്രേയിംഗ്',
  },
};

// Localized farm name dictionary
const FARM_TRANSLATIONS: Record<string, { ta: string; ml: string }> = {
  'Namari': { ta: 'நமரி பண்ணை', ml: 'നമരി തോട്ടം' },
  'namari': { ta: 'நமரி பண்ணை', ml: 'നമരി തോട്ടം' },
  'Namari Farm': { ta: 'நமரி பண்ணை', ml: 'നമരി തോട്ടം' },
  'Adukidathan': { ta: 'அடுகிடாத்தான் பண்ணை', ml: 'അടുക്കിടത്താൻ തോട്ടം' },
  'adukidathan': { ta: 'அடுகிடாத்தான் பண்ணை', ml: 'അടുക്കിടത്താൻ തോട്ടം' },
  'Adukidathan Farm': { ta: 'அடுகிடாத்தான் பண்ணை', ml: 'அടുക്കിടത്താൻ തോട്ടം' },
  'Consolidated': { ta: 'ஒருங்கிணைந்த பண்ணைகள்', ml: 'സംയോജിത തോട്ടങ്ങൾ' },
  'consolidated': { ta: 'ஒருங்கிணைந்த பண்ணைகள்', ml: 'സംയോജിത തോട്ടങ്ങൾ' },
};

// Localized field blocks
const BLOCK_TRANSLATIONS: Record<string, { ta: string; ml: string }> = {
  'Ridge Block A': { ta: 'மேட்டுப் பகுதி பிளாக் A', ml: 'റിഡ്ജ് ബ്ലോക്ക് A' },
  'Valley Block 2': { ta: 'பள்ளத்தாக்கு பிளாக் 2', ml: 'വാലി ബ്ലോക്ക് 2' },
  'Nursery Shed': { ta: 'நாற்றங்கால் கொட்டகை', ml: 'നഴ്സറി ഷെഡ്' },
  'Block 1': { ta: 'பிளாக் 1', ml: 'ബ്ലോക്ക് 1' },
  'Block 2': { ta: 'பிளாக் 2', ml: 'ബ്ലോക്ക് 2' },
};

/**
 * Returns the localized worker name for the active language.
 * Falls back to the original name if language is English or if no translation exists.
 */
export function getLocalizedWorkerName(name: string, language: Language): string {
  if (language === 'en' || !name) return name;
  const match = WORKER_NAME_TRANSLATIONS[name];
  if (match && match[language]) {
    return match[language];
  }
  return name;
}

/**
 * Returns the localized task description for the active language.
 */
export function getLocalizedTaskName(task: string, language: Language): string {
  if (language === 'en' || !task) return task;
  const match = TASK_TRANSLATIONS[task];
  if (match && match[language]) {
    return match[language];
  }
  return task;
}

/**
 * Returns the localized farm name for the active language.
 */
export function getLocalizedFarmName(farm: string, language: Language): string {
  if (language === 'en' || !farm) return farm;
  const match = FARM_TRANSLATIONS[farm];
  if (match && match[language]) {
    return match[language];
  }
  return farm;
}

/**
 * Returns the localized block name for the active language.
 */
export function getLocalizedBlockName(block: string, language: Language): string {
  if (language === 'en' || !block) return block;
  const match = BLOCK_TRANSLATIONS[block];
  if (match && match[language]) {
    return match[language];
  }
  return block;
}

// Localized labor groups
const GROUP_TRANSLATIONS: Record<string, { ta: string; ml: string }> = {
  'Men Pluckers': { ta: 'ஆண்கள் பறிப்போர்', ml: 'പുരുഷ തൊഴിലാളികൾ' },
  'Women Pluckers': { ta: 'பெண்கள் பறிப்போர்', ml: 'സ്ത്രീ തൊഴിലാളികൾ' },
  'Youth Crew': { ta: 'இளைஞர் அணி', ml: 'യുവ തൊഴിലാളികൾ' },
  'Camp Labor': { ta: 'முகாம் தொழிலாளர்கள்', ml: 'ക്യാമ്പ് തൊഴിലാളികൾ' },
  'Contract Labor': { ta: 'ஒப்பந்த தொழிலாளர்கள்', ml: 'കരാർ തൊഴിലാളികൾ' },
};

/**
 * Returns the localized labor group name for the active language.
 */
export function getLocalizedGroupName(group: string, language: Language): string {
  if (language === 'en' || !group) return group;
  const match = GROUP_TRANSLATIONS[group];
  if (match && match[language]) {
    return match[language];
  }
  return group;
}

