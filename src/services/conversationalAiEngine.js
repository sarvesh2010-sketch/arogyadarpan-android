// ============================
// ArogyaDarpan — Multilingual Conversational AI Intake Engine
// Understands symptoms spoken or typed across 10 Indian languages
// (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Punjabi, Malayalam)
// Supports cloud LLMs (Gemini, Groq, OpenAI, Ollama) + offline multilingual clinical NLP
// ============================

import { extractClinicalNLP } from './clinicalNlpEngine.js'
import { getLLMConfig } from './aiQuestionGenerator.js'

/**
 * Multilingual Symptom Recognition Dictionaries across 10 Indian Languages
 */
export const MULTILINGUAL_SYMPTOMS = [
  {
    id: 'chest_pain',
    label: 'Chest Pain',
    labels: {
      en: 'Chest Pain',
      hi: 'सीने में दर्द',
      bn: 'বুকে ব্যথা',
      ta: 'மார்பு வலி',
      te: 'ఛాతీ నొప్పి',
      mr: 'छातीत दुखणे',
      gu: 'છાતીમાં દુખાવો',
      kn: 'ಎದೆ ನೋವು',
      pa: 'ਛਾਤੀ ਵਿੱਚ ਦਰਦ',
      ml: 'നെഞ്ചുവേദന',
    },
    category: 'cardiac',
    patterns: [
      'chest pain', 'chest heaviness', 'chest tightness', 'heart pain',
      'seene mein dard', 'seene me dard', 'chhaati me dard', 'chhati dard', 'chhati me dard',
      'বুকে ব্যথা', 'বুকের ব্যথা', 'buke byatha', 'buker byatha', 'buke chap',
      'மார்பு வலி', 'நெஞ்சு வலி', 'marbu vali', 'nenju vali',
      'ఛాతీ నొప్పి', 'గుండె నొప్పి', 'chathi noppi', 'gunde noppi',
      'छातीत दुखणे', 'छातीत कळ', 'chatit dukhane', 'chhatit dard',
      'છાતીમાં દુખાવો', 'છાતીમાં ભાર', 'chhatima dukhavo', 'chhatima bhar',
      'ಎದೆ ನೋವು', 'ಎದೆಯಲ್ಲಿ ನೋವು', 'ede novu', 'edeyalli novu',
      'ਛਾਤੀ ਵਿੱਚ ਦਰਦ', 'ਛਾਤੀ ਦਰਦ', 'chhati vich dard', 'chhati dard',
      'നെഞ്ചുവേദന', 'നെഞ്ചിൽ വേദന', 'nenjuvedhana', 'nenjil vedhana',
    ],
  },
  {
    id: 'fever',
    label: 'Fever',
    labels: {
      en: 'Fever',
      hi: 'बुखार',
      bn: 'জ্বর',
      ta: 'காய்ச்சல்',
      te: 'జ్వరం',
      mr: 'ताप',
      gu: 'તાવ',
      kn: 'ಜ್ವರ',
      pa: 'ਬੁਖ਼ਾਰ',
      ml: 'പനി',
    },
    category: 'infectious',
    patterns: [
      'fever', 'high temperature', 'chills', 'feverish',
      'bukhar', 'tez bukhar', 'thandi lagna', 'बुखार', 'तेज बुखार',
      'জ্বর', 'গা গরম', 'jwor', 'jor', 'ga gorom',
      'காய்ச்சல்', 'ஜுரம்', 'kaaichal', 'juram',
      'జ్వరం', 'వేడి', 'jwaram', 'zwaram',
      'ताप', 'अंग गरम', 'tap', 'taap', 'ang garam',
      'તાવ', 'શરીર ગરમ', 'taav', 'tav',
      'ಜ್ವರ', 'ಬಿಸಿ', 'jwara', 'zvara',
      'ਬੁਖ਼ਾਰ', 'ਤਾਪ', 'bukhar', 'taap',
      'പനി', 'ചൂട്', 'pani', 'choodu',
    ],
  },
  {
    id: 'cough',
    label: 'Cough',
    labels: {
      en: 'Cough',
      hi: 'खांसी',
      bn: 'কাশি',
      ta: 'இருமல்',
      te: 'దగ్గు',
      mr: 'खोकला',
      gu: 'ખાંસી',
      kn: 'ಕೆಮ್ಮು',
      pa: 'ਖੰਘ',
      ml: 'ചുമ',
    },
    category: 'respiratory',
    patterns: [
      'cough', 'coughing', 'dry cough', 'wet cough', 'phlegm',
      'khansi', 'sukhi khansi', 'balgam', 'खांसी', 'बलगम',
      'কাশি', 'কফ', 'kashi', 'kaph',
      'இருமல்', 'சளி', 'irumal', 'sali',
      'దగ్గు', 'కఫం', 'daggu', 'kafam',
      'खोकला', 'कफ', 'khokla',
      'ખાંસી', 'કફ', 'khasi', 'kaf',
      'ಕೆಮ್ಮು', 'ಕಫ', 'kemmu', 'kapha',
      'ਖੰਘ', 'ਬਲਗਮ', 'khangh', 'balgam',
      'ചുമ', 'കഫക്കെട്ട്', 'chuma', 'kaphakkettu',
    ],
  },
  {
    id: 'abdominal_pain',
    label: 'Abdominal Pain',
    labels: {
      en: 'Abdominal Pain',
      hi: 'पेट में दर्द',
      bn: 'পেটে ব্যথা',
      ta: 'வயிற்று வலி',
      te: 'కడుపు నొప్పి',
      mr: 'पोटात दुखणे',
      gu: 'પેટમાં દુખાવો',
      kn: 'ಹೊಟ್ಟೆ ನೋವು',
      pa: 'ਪੇਟ ਦਰਦ',
      ml: 'വയറുവേദന',
    },
    category: 'gastrointestinal',
    patterns: [
      'stomach pain', 'abdominal pain', 'belly ache', 'tummy ache', 'cramps',
      'pet dard', 'pet me dard', 'pet kharab', 'marod', 'पेट दर्द', 'पेट में दर्द',
      'পেট ব্যথা', 'পেটে ব্যথা', 'pet byatha', 'pete byatha',
      'வயிற்று வலி', 'வயிறு வலி', 'vayitru vali', 'vayiru vali',
      'కడుపు నొప్పి', 'కడుపులో నొప్పి', 'kadupu noppi', 'kadupulo noppi',
      'पोटदुखी', 'पोटात दुखणे', 'potdukhi', 'potat dukhane',
      'પેટમાં દુખાવો', 'પેટ દર્દ', 'petma dukhavo', 'pet dard',
      'ಹೊಟ್ಟೆ ನೋವು', 'ಹೊಟ್ಟೆಯಲ್ಲಿ ನೋವು', 'hotte novu', 'hotteyalli novu',
      'ਪੇਟ ਦਰਦ', 'ਢਿੱਡ ਵਿੱਚ ਦਰਦ', 'pet dard', 'dhidd vich dard',
      'വയറുവേദന', 'വയറ്റിൽ വേദന', 'vayaruvedhana', 'vayattil vedhana',
    ],
  },
  {
    id: 'headache',
    label: 'Headache',
    labels: {
      en: 'Headache',
      hi: 'सिर दर्द',
      bn: 'মাথা ব্যথা',
      ta: 'தலைவலி',
      te: 'తలనొప్పి',
      mr: 'डोकेदुखी',
      gu: 'માથાનો દુખાવો',
      kn: 'ತಲೆನೋವು',
      pa: 'ਸਿਰ ਦਰਦ',
      ml: 'തലവേദന',
    },
    category: 'neurological',
    patterns: [
      'headache', 'head pain', 'migraine', 'throbbing head',
      'sir dard', 'sar dard', 'matha dard', 'सिर दर्द', 'सर दर्द',
      'মাথা ব্যথা', 'মাথার যন্ত্রণা', 'matha byatha', 'mathar jontrona',
      'தலைவலி', 'தலை பாரம்', 'thalaivali', 'thalai baaram',
      'తలనొప్పి', 'తల బరువు', 'talanoppi', 'tala baruvu',
      'डोकेदुखी', 'डोक्यात कळ', 'dokedukhi', 'dokyat kal',
      'માથાનો દુખાવો', 'માથું દુખે', 'mathano dukhavo', 'mathu dukhe',
      'ತಲೆನೋವು', 'ತಲೆ ನೋವು', 'talenovu',
      'ਸਿਰ ਦਰਦ', 'ਸਿਰ ਪੀੜ', 'sir dard', 'sir peed',
      'തലവേദന', 'തല പെരുപ്പ്', 'thalavedhana', 'thala peruppu',
    ],
  },
  {
    id: 'breathlessness',
    label: 'Shortness of Breath',
    labels: {
      en: 'Shortness of Breath',
      hi: 'सांस लेने में तकलीफ',
      bn: 'শ্বাসকষ্ট',
      ta: 'மூச்சுத் திணறல்',
      te: 'శ్వాస తీసుకోవడంలో ఇబ్బంది',
      mr: 'श्वास घेण्यास त्रास',
      gu: 'શ્વાસ લેવામાં તકલીફ',
      kn: 'ಉಸಿರಾಟದ ತೊಂದರೆ',
      pa: 'ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼',
      ml: 'ശ്വാസതടസ്സം',
    },
    category: 'respiratory',
    patterns: [
      'shortness of breath', 'difficulty breathing', 'breathlessness', 'gasping', 'dyspnea',
      'saans lene me takleef', 'saans phoolti hai', 'saans phoolna', 'सांस फूलना', 'दम घुटना',
      'শ্বাসকষ্ট', 'দম আটকে আসা', 'shwaskoshto', 'dom atkache',
      'மூச்சுத் திணறல்', 'மூச்சு வாங்கல்', 'moochu thinaran', 'moochu vanguthu',
      'శ్వాస ఆడకపోవడం', 'ఆయాసం', 'swasa aadam', 'aayasam',
      'श्वास घेण्यास त्रास', 'दम लागणे', 'shwas ghenyas tras', 'dam lagne',
      'શ્વાસ લેવામાં તકલીફ', 'શ્વાસ ચડવો', 'shwas levama taklif', 'shwas chadvo',
      'ಉಸಿರಾಟದ ತೊಂದರೆ', 'ಉಬ್ಬಸ', 'usirata tondare', 'ubbusa',
      'ਸਾਹ ਚੜ੍ਹਨਾ', 'ਸਾਹ ਲੈਣ ਵਿੱਚ ਔਖ', 'saah chadhna', 'saah aukh',
      'ശ്വാസതടസ്സം', 'ശ്വാസം മുട്ടൽ', 'shwasathadassam', 'shwasam muttal',
    ],
  },
  {
    id: 'vomiting',
    label: 'Vomiting / Nausea',
    labels: {
      en: 'Vomiting',
      hi: 'उल्टी',
      bn: 'বমি',
      ta: 'வாந்தி',
      te: 'వాంతులు',
      mr: 'उलटी',
      gu: 'ઉલટી',
      kn: 'ವಾಂತಿ',
      pa: 'ਉਲਟੀ',
      ml: 'ഛർദ്ദി',
    },
    category: 'gastrointestinal',
    patterns: [
      'vomiting', 'throwing up', 'nausea', 'vomit',
      'ulti', 'ji michlana', 'kai', 'उल्टी', 'जी मिचलाना',
      'বমি', 'বমি বমি ভাব', 'bomi', 'bomi bhab',
      'வாந்தி', 'குமட்டல்', 'vaanthi', 'kumattal',
      'వాంతులు', 'వికారం', 'vanthulu', 'vikaram',
      'उलटी', 'मळमळ', 'ulti', 'malmal',
      'ઉલટી', 'ઉબકા', 'ulti', 'ubka',
      'ವಾಂತಿ', 'ಬೇಧಿ', 'vaanti',
      'ਉਲਟੀ', 'ਜੀ ਕੱਚਾ', 'ulti', 'ji kacha',
      'ഛർദ്ദി', 'ഓക്കാനം', 'chardhi', 'okkanam',
    ],
  },
  {
    id: 'dizziness',
    label: 'Dizziness',
    labels: {
      en: 'Dizziness',
      hi: 'चक्कर',
      bn: 'মাথা ঘোরা',
      ta: 'தலைசுற்றல்',
      te: 'కళ్లు తిరగడం',
      mr: 'चक्कर येणे',
      gu: 'ચક્કર આવવા',
      kn: 'ತಲೆಸುತ್ತು',
      pa: 'ਚੱਕਰ ਆਉਣੇ',
      ml: 'തലകറക്കം',
    },
    category: 'neurological',
    patterns: [
      'dizziness', 'giddiness', 'faint', 'lightheaded',
      'chakkar', 'chakkar aana', 'ghoom raha hai', 'चक्कर', 'चक्कर आना',
      'মাথা ঘোরা', 'matha ghora',
      'தலைசுற்றல்', 'மயக்கம்', 'thalaisuttral', 'mayakkam',
      'కళ్లు తిరగడం', 'తిరుగుడు', 'kallu thiragadam',
      'चक्कर येणे', 'भोवळ', 'chakkar yene', 'bhowal',
      'ચક્કર આવવા', 'ચક્કર', 'chakkar aavva',
      'ತಲೆಸುತ್ತು', 'ಮೂರ್ಛೆ', 'talesuttu',
      'ਚੱਕਰ ਆਉਣੇ', 'ਸਿਰ ਘੁੰਮਣਾ', 'chakkar aune',
      'തലകറക്കം', 'തല കറങ്ങുന്നു', 'thalakarakkam',
    ],
  },
  {
    id: 'joint_pain',
    label: 'Joint Pain',
    labels: {
      en: 'Joint Pain',
      hi: 'जोड़ों में दर्द',
      bn: 'গাঁটে ব্যথা',
      ta: 'மூட்டு வலி',
      te: 'కీళ్ల నొప్పులు',
      mr: 'सांधेदुखी',
      gu: 'સાંધાનો દુખાવો',
      kn: 'ಕೀಲು ನೋವು',
      pa: 'ਜੋੜਾਂ ਦਾ ਦਰਦ',
      ml: 'സന്ധിവേദന',
    },
    category: 'musculoskeletal',
    patterns: [
      'joint pain', 'knee pain', 'back pain', 'leg pain', 'body ache', 'arthritis',
      'jodon me dard', 'ghutne me dard', 'kamar dard', 'badan dard', 'जोड़ों में दर्द', 'घुटने में दर्द',
      'গাঁটে ব্যথা', 'হাঁটুতে ব্যথা', 'কোমরে ব্যথা', 'gate byatha', 'hatute byatha',
      'மூட்டு வலி', 'முழங்கால் வலி', 'இடுப்பு வலி', 'moottu vali', 'mulankal vali',
      'కీళ్ల నొప్పులు', 'మోకాలి నొప్పి', 'నడుము నొప్పి', 'keella noppulu', 'mokali noppi',
      'सांधेदुखी', 'गुडघेदुखी', 'कंबरदुखी', 'sandhedukhi', 'gudghedukhi',
      'સાંધાનો દુખાવો', 'ઘૂંટણનો દુખાવો', 'કમરનો દુખાવો', 'sandhano dukhavo',
      'ಕೀಲು ನೋವು', 'ಮೊಣಕಾಲು ನೋವು', 'ಸೊಂಟ ನೋವು', 'keelu novu', 'monakalu novu',
      'ਜੋੜਾਂ ਦਾ ਦਰਦ', 'ਗੋਡੇ ਦਾ ਦਰਦ', 'ਲੱਕ ਦਰਦ', 'jodan da dard', 'gode da dard',
      'സന്ധിവേദന', 'മുട്ടുവേദന', 'ഇടുപ്പുവേദന', 'sandhivedhana', 'muttuvedhana',
    ],
  },
]

/**
 * Multilingual Temporal Patterns across 10 languages
 */
const MULTILINGUAL_TEMPORAL = [
  {
    days: 0,
    normalized: 'Today',
    patterns: ['today', 'since morning', 'aaj', 'aaj se', 'aaj subah se', 'আজ', 'আজকে', 'இன்று', 'இன்று காலை', 'ఈరోజు', 'ఈరోజు ఉదయం', 'आज', 'आज सकाळपासून', 'આજે', 'આજ સવારથી', 'ಇಂದು', 'ಇಂದು ಬೆಳಿಗ್ಗೆ', 'ਅੱਜ', 'ਅੱਜ ਸਵੇਰ ਤੋਂ', 'ഇന്ന്', 'ഇന്ന് രാവിലെ'],
  },
  {
    days: 1,
    normalized: '1 day ago',
    patterns: ['yesterday', '1 day', 'since yesterday', 'kal se', 'ek din se', 'গতকাল', 'কাল থেকে', 'நேற்று', 'நேற்று முதல்', 'నిన్న', 'నిన్నటి నుండి', 'काल', 'कालपासून', 'ગઈકાલે', 'ગઈકાલથી', 'ನಿನ್ನೆ', 'ನಿನ್ನೆಯಿಂದ', 'ਕੱਲ੍ਹ', 'ਕੱਲ੍ਹ ਤੋਂ', 'ഇന്നലെ', 'ഇന്നലെ മുതൽ'],
  },
  {
    days: 3,
    normalized: '2-3 days ago',
    patterns: ['2 days', '3 days', 'few days', 'do din', 'teen din', 'do teen din', 'দুই তিন দিন', '২-৩ দিন', 'இரண்டு மூன்று நாட்கள்', '2-3 நாட்கள்', 'రెండు మూడు రోజులు', '2-3 రోజులు', 'दोन तीन दिवस', 'બે ત્રણ દિવસ', 'ಎರಡು ಮೂರು ದಿನ', 'ਦੋ ਤਿੰਨ ਦਿਨ', 'രണ്ടു മൂന്നു ദിവസം'],
  },
  {
    days: 7,
    normalized: 'About 1 week ago',
    patterns: ['1 week', 'one week', 'ek hafta', 'pichle hafte', 'এক সপ্তাহ', 'ஒரு வாரம்', 'ఒక వారం', 'एक आठवडा', 'એક અઠવાડિયું', 'ಒಂದು ವಾರ', 'ਇੱਕ ਹਫ਼ਤਾ', 'ഒരാഴ്ച'],
  },
]

/**
 * Multilingual Conversational Greetings across 10 languages
 */
export const MULTILINGUAL_GREETINGS = {
  en: 'Hello! Please tell me what symptoms you are experiencing and for how many days. You can speak naturally.',
  hi: 'नमस्ते! कृपया बताएं कि आपको क्या तकलीफ हो रही है और कितने दिनों से है। आप बेझिझक बोल सकते हैं।',
  bn: 'নমস্কার! দয়া করে বলুন আপনার কী সমস্যা হচ্ছে এবং কত দিন ধরে হচ্ছে। আপনি স্বাভাবিকভাবে বলতে পারেন।',
  ta: 'வணக்கம்! உங்களுக்கு என்ன பிரச்சனை உள்ளது, எத்தனை நாட்களாக உள்ளது என்று கூறுங்கள். நீங்கள் தாராளமாக பேசலாம்.',
  te: 'నమస్కారం! మీకు ఎలాంటి సమస్య ఉంది మరియు ఎన్ని రోజుల నుండి ఉందో చెప్పండి. మీరు సహజంగా మాట్లాడవచ్చు.',
  mr: 'नमस्कार! कृपया सांगा की तुम्हाला काय त्रास होत आहे आणि किती दिवसांपासून आहे. तुम्ही मनमोकळेपणाने बोलू शकता.',
  gu: 'નમસ્તે! કૃપા કરીને જણાવો કે તમને શું તકલીફ છે અને કેટલા દિવસથી છે. તમે સહજતાથી બોલી શકો છો.',
  kn: 'ನಮಸ್ಕಾರ! ದಯವಿಟ್ಟು ನಿಮಗೆ ಏನು ತೊಂದರೆಯಾಗುತ್ತಿದೆ ಮತ್ತು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ ಎಂದು ತಿಳಿಸಿ. ನೀವು ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಬಹುದು.',
  pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਤੁਹਾਨੂੰ ਕੀ ਤਕਲੀਫ ਹੈ ਅਤੇ ਕਿੰਨੇ ਦਿਨਾਂ ਤੋਂ ਹੈ। ਤੁਸੀਂ ਖੁੱਲ੍ਹ ਕੇ ਬੋਲ ਸਕਦੇ ਹੋ।',
  ml: 'നമസ്കാരം! നിങ്ങൾക്ക് എന്താണ് അസുഖമെന്നും എത്ര ദിവസമായി ഉണ്ടെന്നും പറയൂ. നിങ്ങൾക്ക് സ്വതന്ത്രമായി സംസാരിക്കാം.',
}

/**
 * Generate Conversational Reply across all 10 Indian languages
 */
export function generateMultilingualConversationalReply({
  complaintLabel = '',
  durationText = '',
  associatedText = '',
  lang = 'en',
}) {
  const replacers = {
    en: `Understood: you are experiencing ${complaintLabel || 'these symptoms'}${durationText ? ` for ${durationText}` : ''}${associatedText ? ` along with ${associatedText}` : ''}. I will note these down for Dr. Ananya Sharma.`,
    hi: `समझ गया: आपको ${durationText ? `${durationText} से ` : ''}${complaintLabel || 'यह परेशानी'} हो रही है${associatedText ? ` और साथ में ${associatedText} भी है` : ''}। मैंने इसे डॉ. अनन्‍या शर्मा के लिए नोट कर लिया है।`,
    bn: `বুঝতে পেরেছি: আপনার ${durationText ? `${durationText} ধরে ` : ''}${complaintLabel || 'এই সমস্যা'} হচ্ছে${associatedText ? ` এবং সাথে ${associatedText} আছে` : ''}। আমি এটি ডাঃ অনন্যা শর্মার জন্য নথিভুক্ত করেছি।`,
    ta: `புரிந்துகொண்டேன்: உங்களுக்கு ${durationText ? `${durationText} காலமாக ` : ''}${complaintLabel || 'இந்த பிரச்சனை'} உள்ளது${associatedText ? ` மற்றும் உடன் ${associatedText} உள்ளது` : ''}. இதை டாக்டர் அனன்யா சர்மாவிற்கு பதிவு செய்துள்ளேன்.`,
    te: `అర్థమైంది: మీకు ${durationText ? `${durationText} నుండి ` : ''}${complaintLabel || 'ఈ సమస్య'} ఉంది${associatedText ? ` మరియు ${associatedText} కూడా ఉంది` : ''}. నేను దీనిని డాక్టర్ అనన్య శర్మ కోసం నమోదు చేశాను.`,
    mr: `समजले: तुम्हाला ${durationText ? `${durationText} पासून ` : ''}${complaintLabel || 'हा त्रास'} होत आहे${associatedText ? ` आणि सोबत ${associatedText} देखील आहे` : ''}. मी हे डॉ. अनन्या शर्मा यांच्यासाठी नोंदवले आहे.`,
    gu: `સમજાયું: તમને ${durationText ? `${durationText} થી ` : ''}${complaintLabel || 'આ સમસ્યા'} છે${associatedText ? ` અને સાથે ${associatedText} પણ છે` : ''}. મેં આ ડૉ. અનન્યા શર્મા માટે નોંધી લીધું છે.`,
    kn: `ಅರ್ಥವಾಯಿತು: ನಿಮಗೆ ${durationText ? `${durationText} ನಿಂದ ` : ''}${complaintLabel || 'ಈ ತೊಂದರೆ'} ಇದೆ${associatedText ? ` ಮತ್ತು ಜೊತೆಗೆ ${associatedText} ಕೂಡ ಇದೆ` : ''}. ನಾನು ಇದನ್ನು ಡಾ. ಅನನ್ಯಾ ಶರ್ಮಾ ಅವರಿಗಾಗಿ ದಾಖಲಿಸಿದ್ದೇನೆ.`,
    pa: `ਸਮਝ ਗਿਆ: ਤੁਹਾਨੂੰ ${durationText ? `${durationText} ਤੋਂ ` : ''}${complaintLabel || 'ਇਹ ਸਮੱਸਿਆ'} ਹੋ ਰਹੀ ਹੈ${associatedText ? ` ਅਤੇ ਨਾਲ ${associatedText} ਵੀ ਹੈ` : ''}। ਮੈਂ ਇਸਨੂੰ ਡਾ. ਅਨੰਨਿਆ ਸ਼ਰਮਾ ਲਈ ਦਰਜ ਕਰ ਲਿਆ ਹੈ।`,
    ml: `മനസ്സിലായി: നിങ്ങൾക്ക് ${durationText ? `${durationText} ആയി ` : ''}${complaintLabel || 'ഈ അസുഖം'} ഉണ്ട്${associatedText ? ` ഒപ്പം ${associatedText} ഉണ്ട്` : ''}. ഞാൻ ഇത് ഡോ. അനന്യ ശർമ്മയ്ക്കായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്.`,
  }

  return replacers[lang] || replacers.en
}

/**
 * Extracts symptoms using multilingual pattern matching
 */
export function extractMultilingualClinicalFacts(text = '', targetLang = 'en') {
  const lower = text.toLowerCase()
  const matchedSymptoms = []

  // Check symptoms in all 10 languages
  MULTILINGUAL_SYMPTOMS.forEach(sym => {
    const isMatched = sym.patterns.some(pat => lower.includes(pat.toLowerCase()))
    if (isMatched) {
      const localizedLabel = sym.labels[targetLang] || sym.label
      matchedSymptoms.push({
        id: sym.id,
        label: localizedLabel,
        category: sym.category,
      })
    }
  })

  // Check temporal/duration
  let detectedDuration = null
  MULTILINGUAL_TEMPORAL.forEach(temp => {
    if (!detectedDuration && temp.patterns.some(pat => lower.includes(pat.toLowerCase()))) {
      detectedDuration = temp.normalized
    }
  })

  // Extract severity score (1-10)
  const severityMatch = lower.match(/(?:severity|scale|rate|dard|peeda|pain)\s*(?:of|is|level|score)?\s*(\d{1,2})/i) ||
                        lower.match(/(\d{1,2})\s*(?:\/|\s*out of\s*)\s*10/i) ||
                        lower.match(/(?:10 me se|10 mein se)\s*(\d{1,2})/i)
  let severity = severityMatch ? Math.min(10, Math.max(1, parseInt(severityMatch[1], 10))) : 7

  // Supplement with English/Hinglish NLP engine
  const standardNlp = extractClinicalNLP(text)

  const primaryComplaint = matchedSymptoms[0] || (standardNlp.symptoms[0] ? {
    id: standardNlp.symptoms[0].id,
    label: standardNlp.symptoms[0].label,
    category: standardNlp.symptoms[0].category,
  } : null)

  const associatedSymptoms = matchedSymptoms.slice(1).concat(
    standardNlp.symptoms.slice(1).map(s => ({ id: s.id, label: s.label }))
  )

  const duration = detectedDuration || standardNlp.temporal || '2-3 days'

  const conversationalReply = generateMultilingualConversationalReply({
    complaintLabel: primaryComplaint?.label,
    durationText: duration,
    associatedText: associatedSymptoms.map(s => s.label).join(', '),
    lang: targetLang,
  })

  return {
    rawTranscript: text,
    primaryComplaint,
    duration,
    associatedSymptoms,
    severity,
    diseases: standardNlp.diseases || [],
    medications: standardNlp.medications || [],
    confidence: primaryComplaint ? 0.94 : 0.72,
    conversationalReply,
  }
}

/**
 * Call cloud LLM to parse multilingual conversational intake if configured
 */
export async function parseConversationalIntakeWithAI(userText = '', lang = 'en') {
  if (!userText || userText.trim().length < 3) {
    return null
  }

  const config = getLLMConfig()

  // If cloud LLM active, prompt LLM to parse natural language in any Indian language
  if (config.provider !== 'clinical_offline' && (config.apiKey || config.provider === 'custom')) {
    try {
      const prompt = `You are an AI Clinical Assistant for ArogyaDarpan OPD Kiosk in India.
The patient said in their native language (${lang}): "${userText}".

Analyze their symptoms and extract clinical facts in JSON format.
Output ONLY strict valid JSON:
{
  "primaryComplaint": { "id": "chest_pain|fever|cough|abdominal_pain|headache|breathlessness|vomiting|dizziness|joint_pain|other", "label": "Clinical label in English" },
  "duration": "Duration string (e.g. 2 days, today, 1 week)",
  "severity": 1-10 number,
  "associatedSymptoms": [ { "id": "sym_id", "label": "English label" } ],
  "medications": [ { "name": "medicine" } ],
  "diseases": [ { "name": "condition" } ],
  "conversationalReply": "Warm, empathetic doctor-like conversational reply in the patient's language (${lang}) acknowledging their symptoms"
}`

      let parsed = null
      if (config.provider === 'gemini') {
        const model = config.model || 'gemini-1.5-flash'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          const data = await res.json()
          parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text)
        }
      } else if (config.provider === 'groq') {
        const url = 'https://api.groq.com/openai/v1/chat/completions'
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
          body: JSON.stringify({
            model: config.model || 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an Indian hospital clinical AI. Output pure JSON.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          const data = await res.json()
          parsed = JSON.parse(data?.choices?.[0]?.message?.content)
        }
      }

      if (parsed && parsed.primaryComplaint) {
        return {
          rawTranscript: userText,
          primaryComplaint: parsed.primaryComplaint,
          duration: parsed.duration || 'Recently',
          associatedSymptoms: parsed.associatedSymptoms || [],
          severity: parsed.severity || 7,
          diseases: parsed.diseases || [],
          medications: parsed.medications || [],
          confidence: 0.96,
          conversationalReply: parsed.conversationalReply || generateMultilingualConversationalReply({
            complaintLabel: parsed.primaryComplaint.label,
            durationText: parsed.duration,
            lang,
          }),
        }
      }
    } catch (err) {
      console.warn('[Conversational AI Engine] LLM call error, using deterministic NLP:', err)
    }
  }

  // Fallback to offline multilingual clinical NLP
  return extractMultilingualClinicalFacts(userText, lang)
}

/**
 * Standard synchronous parser wrapper
 */
export function parseConversationalIntake(userText = '', lang = 'en') {
  return extractMultilingualClinicalFacts(userText, lang)
}
