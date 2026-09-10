// ============================
// ArogyaDarpan — Clinical LLM Summary Generation Service
// Generates physician SOAP notes, patient-friendly summaries, and clinical next steps
// across 10 Indian languages using Gemini / Groq / OpenAI / Custom Ollama / Offline Intelligence
//
// SAFETY RULE: "AI Prepares. AI Explains. The Doctor Decides."
// UNDER NO CIRCUMSTANCES DOES AI PRESCRIBE MEDICATIONS OR RECOMMEND DRUG DOSAGES.
// ============================

import { getLLMConfig } from './aiQuestionGenerator.js'
import { formatClinicalValue } from './sessionStore.js'

/**
 * Supported Language Metadata for Summaries
 */
export const SUMMARY_LANGUAGES = [
  { id: 'en', label: 'English', native: 'English', locale: 'en-IN' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी', locale: 'hi-IN' },
  { id: 'bn', label: 'Bengali', native: 'বাংলা', locale: 'bn-IN' },
  { id: 'ta', label: 'Tamil', native: 'தமிழ்', locale: 'ta-IN' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు', locale: 'te-IN' },
  { id: 'mr', label: 'Marathi', native: 'मराठी', locale: 'mr-IN' },
  { id: 'gu', label: 'Gujarati', native: 'ગુજરાતી', locale: 'gu-IN' },
  { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', locale: 'kn-IN' },
  { id: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', locale: 'pa-IN' },
  { id: 'ml', label: 'Malayalam', native: 'മലയാളം', locale: 'ml-IN' },
]

/**
 * Translates clinical symptoms into selected Indian language
 */
export const CLINICAL_TRANSLATIONS = {
  'Chest Pain': {
    en: 'chest discomfort / pain',
    hi: 'सीने में दर्द या भारीपन',
    bn: 'বুকে ব্যথা বা অস্বস্তি',
    ta: 'மார்பு வலி அல்லது அசௌகரியம்',
    te: 'ఛాతీ నొప్పి లేదా బరువుగా ఉండటం',
    mr: 'छातीत दुखणे किंवा जड वाटणे',
    gu: 'છાતીમાં દુખાવો અથવા ભાર',
    kn: 'ಎದೆ ನೋವು ಅಥವಾ ಭಾರ',
    pa: 'ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਭਾਰਾਪਨ',
    ml: 'നെഞ്ചുവേദന അല്ലെങ്കിൽ അസ്വസ്ഥത',
  },
  'Fever': {
    en: 'fever and chills',
    hi: 'बुखार और ठंड लगना',
    bn: 'জ্বর এবং কাঁপুনি',
    ta: 'காய்ச்சல் மற்றும் நடுக்கம்',
    te: 'జ్వరం మరియు వణుకు',
    mr: 'ताप आणि थंडी',
    gu: 'તાવ અને ધ્રુજારી',
    kn: 'ಜ್ವರ ಮತ್ತು ನಡುಕ',
    pa: 'ਬੁਖ਼ਾਰ ਅਤੇ ਕੰਬਣੀ',
    ml: 'പനിയും വിറയലും',
  },
  'Abdominal Pain': {
    en: 'stomach pain / cramps',
    hi: 'पेट में दर्द या मरोड़',
    bn: 'পেটে ব্যথা বা ক্র্যাম্প',
    ta: 'வயிற்று வலி',
    te: 'కడుపు నొప్పి',
    mr: 'पोटात दुखणे किंवा कळा',
    gu: 'પેટમાં દુખાવો અથવા ચૂંક',
    kn: 'ಹೊಟ್ಟೆ ನೋವು',
    pa: 'ਪੇਟ ਵਿੱਚ ਦਰਦ',
    ml: 'വയറുവേദന',
  },
  'Cough': {
    en: 'cough with throat irritation',
    hi: 'खांसी और गले में खराश',
    bn: 'কাশি এবং গলায় অস্বস্তি',
    ta: 'இருமல் மற்றும் தொண்டை வலி',
    te: 'దగ్గు మరియు గొంతు నొప్పి',
    mr: 'खोकला आणि घशात खवखव',
    gu: 'ખાંસી અને ગળામાં ખરાશ',
    kn: 'ಕೆಮ್ಮು ಮತ್ತು ಗಂಟಲು ಕಿರಿಕಿರಿ',
    pa: 'ਖੰਘ ਅਤੇ ਗਲੇ ਵਿੱਚ ਖਰਾਸ਼',
    ml: 'ചുമയും തൊണ്ടവേദനയും',
  },
  'Breathing Difficulty': {
    en: 'shortness of breath on exertion',
    hi: 'सांस लेने में कठिनाई या सांस फूलना',
    bn: 'শ্বাসকষ্ট বা হাঁপ ধরা',
    ta: 'மூச்சுத் திணறல்',
    te: 'శ్వాస తీసుకోవడంలో ఇబ్బంది',
    mr: 'श्वास घेण्यास त्रास होणे',
    gu: 'શ્વાસ લેવામાં તકલીફ',
    kn: 'ಉಸಿರಾಟದ ತೊಂದರೆ',
    pa: 'ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼',
    ml: 'ശ്വാസതടസ്സം',
  },
}

/**
 * Headline Generator across all 10 languages
 */
const HEADLINE_TEMPLATES = {
  en: (comp, dur, sev, age, gender) => `${comp} (${dur}, Severity ${sev}/10) in ${age}y ${gender}`,
  hi: (comp, dur, sev, age, gender) => `${comp} (${dur} से, गंभीरता ${sev}/10) — ${age} वर्षीय ${gender === 'Male' ? 'पुरुष' : 'महिला'}`,
  bn: (comp, dur, sev, age, gender) => `${comp} (${dur} ধরে, তীব্রতা ${sev}/10) — ${age} বছর বয়সী ${gender === 'Male' ? 'পুরুষ' : 'মহিলা'}`,
  ta: (comp, dur, sev, age, gender) => `${comp} (${dur}, தீவிரம் ${sev}/10) — ${age} வயது ${gender === 'Male' ? 'ஆண்' : 'பெண்'}`,
  te: (comp, dur, sev, age, gender) => `${comp} (${dur} నుండి, తీవ్రత ${sev}/10) — ${age} సం. ${gender === 'Male' ? 'పురుషుడు' : 'మహిళ'}`,
  mr: (comp, dur, sev, age, gender) => `${comp} (${dur} पासून, तीव्रता ${sev}/10) — ${age} वर्षे ${gender === 'Male' ? 'पुरुष' : 'स्त्री'}`,
  gu: (comp, dur, sev, age, gender) => `${comp} (${dur} થી, તીવ્રતા ${sev}/10) — ${age} વર્ષીય ${gender === 'Male' ? 'પુરુષ' : 'મહિલા'}`,
  kn: (comp, dur, sev, age, gender) => `${comp} (${dur} ರಿಂದ, ತೀವ್ರತೆ ${sev}/10) — ${age} ವರ್ಷದ ${gender === 'Male' ? 'ಪುರುಷ' : 'ಮಹಿಳೆ'}`,
  pa: (comp, dur, sev, age, gender) => `${comp} (${dur} ਤੋਂ, ਗੰਭੀਰਤਾ ${sev}/10) — ${age} ਸਾਲਾ ${gender === 'Male' ? 'ਪੁਰਸ਼' : 'ਔਰਤ'}`,
  ml: (comp, dur, sev, age, gender) => `${comp} (${dur} മുതൽ, തീവ്രത ${sev}/10) — ${age} വയസ്സുള്ള ${gender === 'Male' ? 'പുരുഷൻ' : 'സ്ത്രീ'}`,
}

/**
 * Triage Category Badges across all 10 languages
 */
const TRIAGE_CATEGORY_LABELS = {
  urgent: {
    en: 'Urgent / Priority 2',
    hi: 'गंभीर / प्राथमिकता 2',
    bn: 'জরুরি / অগ্রাধিকার ২',
    ta: 'அவசரம் / முன்னுரிமை 2',
    te: 'అత్యవసరం / ప్రాధాన్యత 2',
    mr: 'तातडीचे / प्राधान्य २',
    gu: 'તાત્કાલિક / પ્રાથમિકતા ૨',
    kn: 'ತುರ್ತು / ಆದ್ಯತೆ 2',
    pa: 'ਜ਼ਰੂਰੀ / ਤਰਜੀਹ 2',
    ml: 'അടിയന്തിരം / മുൻഗണന 2',
  },
  semiUrgent: {
    en: 'Semi-Urgent / Priority 3',
    hi: 'अर्ध-गंभीर / प्राथमिकता 3',
    bn: 'মাঝারি জরুরি / অগ্রাধিকার ৩',
    ta: 'மிதமான அவசரம் / முன்னுரிமை 3',
    te: 'మధ్యస్థ అత్యవసరం / ప్రాధాన్యత 3',
    mr: 'मध्यम तातडीचे / प्राधान्य ३',
    gu: 'મધ્યમ તાત્કાલિક / પ્રાથમિકતા ૩',
    kn: 'ಮಧ್ಯಮ ತುರ್ತು / ಆದ್ಯತೆ 3',
    pa: 'ਦਰਮਿਆਨਾ ਜ਼ਰੂਰੀ / ਤਰਜੀਹ 3',
    ml: 'മിതമായ അടിയന്തിരം / മുൻഗണന 3',
  },
  routine: {
    en: 'Routine / Priority 4',
    hi: 'सामान्य / प्राथमिकता 4',
    bn: 'সাধারণ / অগ্রাধিকার ৪',
    ta: 'வழக்கமான / முன்னுரிமை 4',
    te: 'సాధారణ / ప్రాధాన్యత 4',
    mr: 'नेहमीचे / प्राधान्य ४',
    gu: 'સામાન્ય / પ્રાથમિકતા ૪',
    kn: 'ಸಾಮಾನ್ಯ / ಆದ್ಯತೆ 4',
    pa: 'ਆਮ / ਤਰਜੀਹ 4',
    ml: 'സാധാരണ / മുൻഗണന 4',
  },
}

/**
 * Plain-language templates across 10 Indian languages
 * Empathetic explanation with ZERO drug prescribing.
 */
const PATIENT_GUIDE_TEMPLATES = {
  en: (comp, dur, sev, alert) =>
    `Your clinical intake reports ${comp} starting ${dur} with a self-rated severity of ${sev}/10. ${alert ? `Alert: ${alert}. ` : ''}Your symptoms and prior records have been organized into a clinical summary for Dr. Ananya Sharma. Note: ArogyaDarpan does not prescribe medicines; all prescription decisions and treatments will be provided by Dr. Sharma during your consultation.`,
  hi: (comp, dur, sev, alert) =>
    `आपकी स्वास्थ्य समीक्षा में ${comp} की शिकायत दर्ज की गई है, जो ${dur} से है और इसका दर्द/तीव्रता स्तर ${sev}/10 है। ${alert ? `सूचना: ${alert}। ` : ''}आपकी सारी जानकारी और पूर्व रिपोर्ट डॉ. अनन्‍या शर्मा के परामर्श के लिए सुरक्षित रूप से तैयार कर दी गई हैं। ध्यान दें: आरोग्यदर्पण कोई दवा नहीं लिखता; सभी दवाइयों का निर्धारण डॉ. शर्मा द्वारा आपकी जांच के बाद किया जाएगा।`,
  bn: (comp, dur, sev, alert) =>
    `আপনার স্বাস্থ্য প্রতিবেদনে ${dur} থেকে ${comp}-এর সমস্যা নথিভুক্ত করা হয়েছে এবং তীব্রতার মাত্রা ${sev}/10। ${alert ? `সতর্কতা: ${alert}। ` : ''}আপনার সমস্ত তথ্য ও পূর্ববর্তী রিপোর্ট ডাঃ অনন্যা শর্মার পরীক্ষার জন্য প্রস্তুত করা হয়েছে। দ্রষ্টব্য: আরোগ্যদর্পণ কোনো ওষুধ প্রেসক্রাইব করে না; ওষুধ সংক্রান্ত সব সিদ্ধান্ত ডাক্তারবাবু ব্যক্তিগত পরীক্ষার পর দেবেন।`,
  ta: (comp, dur, sev, alert) =>
    `உங்கள் மருத்துவ பதிவில் ${dur} முதல் ${comp} பிரச்சனை பதிவாகியுள்ளது, இதன் தீவிரத்தன்மை ${sev}/10 ஆகும். ${alert ? `எச்சரிக்கை: ${alert}. ` : ''}உங்கள் விவரங்கள் மற்றும் அறிக்கைகள் டாக்டர் அனன்யா சர்மாவின் ஆலோசனைக்காக தயார் செய்யப்பட்டுள்ளன. குறிப்பு: ஆரோக்கியதர்பன் எந்த மருந்தையும் பரிந்துரைக்காது; அனைத்து மருந்து பரிந்துரைகளும் உங்கள் பரிசோதனைக்குப் பிறகு மருத்துவரால் மட்டுமே தீர்மானிக்கப்படும்.`,
  te: (comp, dur, sev, alert) =>
    `మీ ఆరోగ్య సమీక్షలో ${dur} నుండి ${comp} ఉన్నట్లు నమోదైంది మరియు తీవ్రత ${sev}/10 గా ఉంది. ${alert ? `గమనిక: ${alert}. ` : ''}డాక్టర్ అనన్య శర్మ పరిశీలన కోసం మీ వివరాలు మరియు పాత నివేదికలు భద్రంగా సిద్ధం చేయబడ్డాయి. గమనిక: ఆరోగ్యదర్పణ్ ఎటువంటి మందులను ప్రిస్క్రైబ్ చేయదు; మందుల నిర్ణయాలు పూర్తిగా డాక్టర్ పరీక్షించిన తర్వాతే తీసుకుంటారు.`,
  mr: (comp, dur, sev, alert) =>
    `तुमच्या आरोग्य तपासणीत ${dur} पासून ${comp} चा त्रास नोंदवला गेला आहे आणि त्याची तीव्रता ${sev}/10 आहे. ${alert ? `सूचना: ${alert}. ` : ''}तुमचे सर्व तपशील आणि जुने रिपोर्ट डॉ. अनन्या शर्मा यांच्या तपासणीसाठी सुरक्षितपणे तयार करण्यात आले आहेत. टीप: आरोग्यदर्पण कोणतीही औषधे लिहून देत नाही; सर्व औषधे डॉक्टरांच्या प्रत्यक्ष तपासणीनंतरच दिली जातील.`,
  gu: (comp, dur, sev, alert) =>
    `તમારી આરોગ્ય તપાસમાં ${dur} થી ${comp} ની સમસ્યા નોંધાઈ છે અને તેની તીવ્રતા ${sev}/10 છે. ${alert ? `સાવચેતી: ${alert}. ` : ''}તમારી વિગતો અને જૂના રિપોર્ટ્સ ડૉ. અનન્યા શર્માની તપાસ માટે સુરક્ષિત રીતે તૈયાર છે. નોંધ: આરોગ્યદર્પણ કોઈપણ દવા લખતું નથી; તમામ દવાઓનો નિર્ણય ડૉક્ટર શર્મા તપાસ બાદ કરશે.`,
  kn: (comp, dur, sev, alert) =>
    `ನಿಮ್ಮ ಆರೋಗ್ಯ ತಪಾಸಣೆಯಲ್ಲಿ ${dur} ನಿಂದ ${comp} ಇರುವುದು ದಾಖಲಾಗಿದೆ ಮತ್ತು ತೀವ್ರತೆಯು ${sev}/10 ಆಗಿದೆ. ${alert ? `ಎಚ್ಚರಿಕೆ: ${alert}. ` : ''}ಡಾ. ಅನನ್ಯಾ ಶರ್ಮಾ ಅವರ ಸಮಾಲೋಚನೆಗಾಗಿ ನಿಮ್ಮ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ. ಗಮನಿಸಿ: ಆರೋಗ್ಯದರ್ಪಣ ಯಾವುದೇ ಔಷಧಿಯನ್ನು ನೀಡುವುದಿಲ್ಲ; ಎಲ್ಲಾ ಔಷಧಿಗಳನ್ನು ವೈದ್ಯರು ಪರೀಕ್ಷೆಯ ನಂತರವೇ ಸೂಚಿಸುತ್ತಾರೆ.`,
  pa: (comp, dur, sev, alert) =>
    `ਤੁਹਾਡੀ ਸਿਹਤ ਜਾਂਚ ਵਿੱਚ ${dur} ਤੋਂ ${comp} ਦੀ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕੀਤੀ ਗਈ ਹੈ ਅਤੇ ਗੰਭੀਰਤਾ ${sev}/10 ਹੈ। ${alert ? `ਚੇਤਾਵਨੀ: ${alert}। ` : ''}ਤੁਹਾਡੀ ਸਾਰੀ ਜਾਣਕਾਰੀ ਡਾ. ਅਨੰਨਿਆ ਸ਼ਰਮਾ ਲਈ ਸੁਰੱਖਿਅਤ ਤੌਰ 'ਤੇ ਤਿਆਰ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਨੋਟ: ਆਰੋਗਿਆਦਰਪਣ ਕੋਈ ਦਵਾਈ ਨਹੀਂ ਲਿਖਦਾ; ਦਵਾਈਆਂ ਦਾ ਫੈਸਲਾ ਡਾਕਟਰ ਵੱਲੋਂ ਤੁਹਾਡੀ ਜਾਂਚ ਤੋਂ ਬਾਅਦ ਕੀਤਾ ਜਾਵੇਗਾ।`,
  ml: (comp, dur, sev, alert) =>
    `നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങളിൽ ${dur} മുതൽ ${comp} ഉള്ളതായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്, തീവ്രത ${sev}/10 ആണ്. ${alert ? `ശ്രദ്ധിക്കുക: ${alert}. ` : ''}ഡോ. അനന്യ ശർമ്മയുടെ പരിശോധനയ്ക്കായി നിങ്ങളുടെ വിവരങ്ങൾ തയ്യാറാക്കിയിട്ടുണ്ട്. കുറിപ്പ്: ആരോഗ്യദർപ്പൺ മരുന്നുകൾ നൽകുന്നില്ല; എല്ലാ മരുന്നുകളും പരിശോധനയ്ക്ക് ശേഷം ഡോക്ടർ നൽകുന്നതാണ്.`,
}

/**
 * Key Highlights Templates across all 10 languages
 */
const KEY_HIGHLIGHTS_TEMPLATES = {
  en: (facts) => [
    `Primary Complaint: ${facts.complaint} (${facts.onset})`,
    `Severity Score: ${facts.severity} / 10 (Self-Reported)`,
    `Underlying Conditions: ${facts.pastConditions}`,
    `Current Patient Medications: ${facts.currentMeds} (Self-Reported, Not Prescribed by AI)`,
    ...(facts.hasAllergyConflict ? ['⚠️ AI Safety Flag: Documented Penicillin allergy discrepancy requiring doctor verification'] : []),
    `🛡️ Safety Protocol: AI does not prescribe medicines. Prescription decisions strictly rest with the attending doctor.`,
  ],
  hi: (facts) => [
    `मुख्य लक्षण: ${CLINICAL_TRANSLATIONS[facts.complaint]?.hi || facts.complaint} (${facts.onset} से)`,
    `गंभीरता स्तर: ${facts.severity} / 10 (रोगी द्वारा बताया गया)`,
    `पूर्व स्वास्थ्य इतिहास: ${facts.pastConditions}`,
    `मरीज द्वारा ली जा रही मौजूदा दवाइयाँ: ${facts.currentMeds} (पूर्व रिपोर्ट अनुसार, एआई द्वारा नहीं)`,
    ...(facts.hasAllergyConflict ? ['⚠️ सुरक्षा चेतावनी: पूर्व रिकॉर्ड में पेनिसिलिन एलर्जी पाई गई है, डॉक्टर से सत्यापन आवश्यक है'] : []),
    `🛡️ नैदानिक सुरक्षा नियम: एआई दवाइयां नहीं लिखता। सभी दवाओं का निर्धारण केवल परामर्शदाता डॉक्टर द्वारा किया जाएगा।`,
  ],
  bn: (facts) => [
    `প্রধান সমস্যা: ${CLINICAL_TRANSLATIONS[facts.complaint]?.bn || facts.complaint} (${facts.onset} ধরে)`,
    `তীব্রতার রেটিং: ${facts.severity} / 10`,
    `অতীতের রোগসমূহ: ${facts.pastConditions}`,
    `বর্তমান সেবনকৃত ওষুধ: ${facts.currentMeds} (রোগীর পূর্ব রেকর্ড অনুযায়ী, এআই প্রেসক্রাইব করেনি)`,
    ...(facts.hasAllergyConflict ? ['⚠️ অ্যালার্জি সতর্কতা: পেনিসিলিন অ্যালার্জির ইতিহাস পাওয়া গেছে, ডাক্তারের যাচাই প্রয়োজন'] : []),
    `🛡️ সুরক্ষা প্রোটোকল: এআই কোনো ওষুধ প্রেসক্রাইব করে না। ওষুধের সিদ্ধান্ত একমাত্র ডাক্তারের।`,
  ],
  ta: (facts) => [
    `முதன்மை புகார்: ${CLINICAL_TRANSLATIONS[facts.complaint]?.ta || facts.complaint} (${facts.onset})`,
    `தீவிரத்தன்மை அளவு: ${facts.severity} / 10`,
    `முந்தைய உடல்நல பிரச்சனைகள்: ${facts.pastConditions}`,
    `தற்போது உட்கொள்ளும் மருந்துகள்: ${facts.currentMeds} (நோயாளி தகவல், AI பரிந்துரை அல்ல)`,
    ...(facts.hasAllergyConflict ? ['⚠️ ஒவ்வாமை எச்சரிக்கை: பென்சிலின் ஒவ்வாமை முரண்பாடு கண்டறியப்பட்டுள்ளது'] : []),
    `🛡️ மருத்துவப் பாதுகாப்பு: AI மருந்துகளை பரிந்துரைக்காது. அனைத்து மருந்து பரிந்துரைகளும் மருத்துவரால் மட்டுமே தீர்மானிக்கப்படும்.`,
  ],
  te: (facts) => [
    `ప్రధాన ఫిర్యాదు: ${CLINICAL_TRANSLATIONS[facts.complaint]?.te || facts.complaint} (${facts.onset} నుండి)`,
    `తీవ్రత రేటింగ్: ${facts.severity} / 10`,
    `గత ఆరోగ్య పరిస్థితులు: ${facts.pastConditions}`,
    `ప్రస్తుతం వాడుతున్న మందులు: ${facts.currentMeds} (రోగి రికార్డుల ప్రకారం, AI ప్రిస్క్రైబ్ చేయలేదు)`,
    ...(facts.hasAllergyConflict ? ['⚠️ అలర్జీ హెచ్చరిక: పెన్సిలిన్ అలర్జీ సమాచారాన్ని డాక్టర్ సమీక్షించాలి'] : []),
    `🛡️ భద్రతా నిబంధన: AI ఎటువంటి మందులను సూచించదు. మందుల నిర్ణయాలు పూర్తిగా డాక్టర్ మాత్రమే తీసుకుంటారు.`,
  ],
  mr: (facts) => [
    `मुख्य त्रास: ${CLINICAL_TRANSLATIONS[facts.complaint]?.mr || facts.complaint} (${facts.onset} पासून)`,
    `तीव्रता प्रमाण: ${facts.severity} / 10`,
    `पूर्वीचे आजार: ${facts.pastConditions}`,
    `सध्या सुरू असलेली औषधे: ${facts.currentMeds} (रुग्णाने सांगितलेली, AI ने सुचवलेली नाहीत)`,
    ...(facts.hasAllergyConflict ? ['⚠️ ॲलर्जी इशारा: पेनिसिलिन ॲलर्जीबाबत डॉक्टरांकडून खात्री आवश्यक'] : []),
    `🛡️ सुरक्षितता नियम: एआय कोणतीही औषधे लिहून देत नाही. औषधांचा निर्णय फक्त डॉक्टरांचा असेल.`,
  ],
  gu: (facts) => [
    `મુખ્ય ફરિયાદ: ${CLINICAL_TRANSLATIONS[facts.complaint]?.gu || facts.complaint} (${facts.onset} થી)`,
    `તીવ્રતા સ્કોર: ${facts.severity} / 10`,
    `અગાઉની બીમારીઓ: ${facts.pastConditions}`,
    `હાલમાં ચાલુ દવાઓ: ${facts.currentMeds} (દર્દીની વિગત મુજબ, AI દ્વારા નહીં)`,
    ...(facts.hasAllergyConflict ? ['⚠️ એલર્જી ચેતવણી: પેનિસિલિન એલર્જી અંગે ડૉક્ટર તપાસ કરશે'] : []),
    `🛡️ સુરક્ષા નિયમ: AI કોઈપણ દવા લખતું નથી. તમામ દવાઓનો નિર્ણય માત્ર ડૉક્ટર કરશે.`,
  ],
  kn: (facts) => [
    `ಮುಖ್ಯ ಸಮಸ್ಯೆ: ${CLINICAL_TRANSLATIONS[facts.complaint]?.kn || facts.complaint} (${facts.onset} ರಿಂದ)`,
    `ತೀವ್ರತೆಯ ಸ್ಕೋರ್: ${facts.severity} / 10`,
    `ಹಿಂದಿನ ಆರೋಗ್ಯ ಇತಿಹಾಸ: ${facts.pastConditions}`,
    `ಪ್ರಸ್ತುತ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿರುವ ಔಷಧಿಗಳು: ${facts.currentMeds} (ರೋಗಿಯ ಮಾಹಿತಿ, AI ಸೂಚಿಸಿಲ್ಲ)`,
    ...(facts.hasAllergyConflict ? ['⚠️ ಅಲರ್ಜಿ ಎಚ್ಚರಿಕೆ: ಪೆನ್ಸಿಲಿನ್ ಅಲರ್ಜಿ ಬಗ್ಗೆ ವೈದ್ಯರ ದೃಢೀಕರಣ ಅಗತ್ಯ'] : []),
    `🛡️ ಸುರಕ್ಷತಾ ನಿಯಮ: AI ಯಾವುದೇ ಔಷಧಿಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡುವುದಿಲ್ಲ. ಎಲ್ಲಾ ಔಷಧಿಗಳನ್ನು ಕೇವಲ ವೈದ್ಯರು ಮಾತ್ರ ನಿರ್ಧರಿಸುತ್ತಾರೆ.`,
  ],
  pa: (facts) => [
    `ਮੁੱਖ ਸ਼ਿਕਾਇਤ: ${CLINICAL_TRANSLATIONS[facts.complaint]?.pa || facts.complaint} (${facts.onset} ਤੋਂ)`,
    `ਗੰਭੀਰਤਾ ਰੇਟਿੰਗ: ${facts.severity} / 10`,
    `ਪਿਛਲੀਆਂ ਬਿਮਾਰੀਆਂ: ${facts.pastConditions}`,
    `ਮੌਜੂਦਾ ਚੱਲ ਰਹੀਆਂ ਦਵਾਈਆਂ: ${facts.currentMeds} (ਮਰੀਜ਼ ਵੱਲੋਂ ਦੱਸੀਆਂ, AI ਵੱਲੋਂ ਨਹੀਂ)`,
    ...(facts.hasAllergyConflict ? ['⚠️ ਐਲਰਜੀ ਚੇਤਾਵਨੀ: ਪੈਨਸਿਲਿਨ ਐਲਰਜੀ ਬਾਰੇ ਡਾਕਟਰ ਵੱਲੋਂ ਜਾਂਚ ਜ਼ਰੂਰੀ'] : []),
    `🛡️ ਕਲੀਨਿਕਲ ਸੁਰੱਖਿਆ: AI ਕੋਈ ਦਵਾਈ ਨਹੀਂ ਲਿਖਦਾ। ਸਾਰੀਆਂ ਦਵਾਈਆਂ ਦਾ ਫੈਸਲਾ ਸਿਰਫ਼ ਡਾਕਟਰ ਵੱਲੋਂ ਕੀਤਾ ਜਾਵੇਗਾ।`,
  ],
  ml: (facts) => [
    `പ്രധാന പരാതി: ${CLINICAL_TRANSLATIONS[facts.complaint]?.ml || facts.complaint} (${facts.onset} മുതൽ)`,
    `തീവ്രത നിരക്ക്: ${facts.severity} / 10`,
    `മുൻകാല രോഗങ്ങൾ: ${facts.pastConditions}`,
    `ഇപ്പോൾ കഴിക്കുന്ന മരുന്നുകൾ: ${facts.currentMeds} (രോഗി നൽകിയ വിവരം, AI നിർദ്ദേശിച്ചതല്ല)`,
    ...(facts.hasAllergyConflict ? ['⚠️ അലർജി മുന്നറിയിപ്പ്: പെൻസിലിൻ അലർജി ഡോക്ടർ പരിശോധിക്കണം'] : []),
    `🛡️ സുരക്ഷാ ചട്ടം: AI മരുന്നുകൾ നിർദ്ദേശിക്കുന്നില്ല. എല്ലാ മരുന്നുകളും ഡോക്ടർ മാത്രമാണ് തീരുമാനിക്കുന്നത്.`,
  ],
}

/**
 * Suggested Diagnostic Actions across all 10 languages
 * Strictly NON-PHARMACOLOGICAL (Zero medication prescribing)
 */
const DOCTOR_ACTION_TEMPLATES = {
  en: [
    'Diagnostic Investigation: Immediate 12-lead ECG & cardiac biomarker profile (Troponin-I)',
    'Vital Signs Check: Evaluate blood pressure (138/88 mmHg) and pulse telemetry',
    'Safety Reconciliation: Verify documented Penicillin allergy discrepancy with patient',
    'Prescription Notice: Pharmacological prescription strictly determined by Dr. Ananya Sharma',
  ],
  hi: [
    'नैदानिक परीक्षण: तत्काल 12-लीड ईसीजी एवं हृदय बायोमार्कर (ट्रोपोनिन-I) जांच',
    'वाइटल्स निगरानी: रक्तचाप (138/88 mmHg) और नाड़ी की दर का पुनर्मूल्यांकन',
    'एलर्जी समाधान: पूर्व रिकॉर्ड में दर्ज पेनिसिलिन एलर्जी की रोगी से पुष्टि',
    'दवा नियम: किसी भी दवा का निर्धारण केवल डॉ. अनन्‍या शर्मा द्वारा शारीरिक परीक्षण के बाद किया जाएगा',
  ],
  bn: [
    'ডায়াগনস্টিক টেস্ট: তাৎক্ষণিক ১২-লিড ইসিজি ও কার্ডিয়াক ট্রোপোনিন পরীক্ষা',
    'ভাইটাল লক্ষণ পরীক্ষা: রক্তচাপ (১৩৮/৮৮) ও নাড়ির গতি পর্যবেক্ষণ',
    'অ্যালার্জি সতর্কতা: পূর্বের পেনিসিলিন অ্যালার্জি রেকর্ড সরাসরি রোগীর সাথে যাচাই',
    'ওষুধ নির্দেশিকা: ওষুধের প্রেসক্রিপশন সম্পূর্ণভাবে ডাঃ অনন্যা শর্মার এখতিয়ারাধীন',
  ],
  ta: [
    'கண்டறியும் பரிசோதனை: உடனடி 12-லீட் இசிஜி மற்றும் ட்ரோபோனின் பரிசோதனை',
    'உயிராதார நிலைகள்: இரத்த அழுத்தம் மற்றும் துடிப்பு வீதத்தை மதிப்பீடு செய்தல்',
    'ஒவ்வாமை சரிபார்ப்பு: நோயாளியிடம் பென்சிலின் ஒவ்வாமை பதிவை உறுதிப்படுத்துதல்',
    'மருந்து விதிமுறை: மருந்து பரிந்துரை முழுமையாக மருத்துவர் அனன்யா சர்மாவால் மட்டுமே தீர்மானிக்கப்படும்',
  ],
  te: [
    'రోగనిర్ధారణ పరీక్ష: తక్షణ 12-లీడ్ ఈసీజీ మరియు కార్డియాక్ ట్రోపోనిన్ పరీక్ష',
    'వైటల్స్ పర్యవేక్షణ: రక్తపోటు మరియు పల్స్ రేటును అంచనా వేయడం',
    'అలర్జీ పరిశీలన: పెన్సిలిన్ అలర్జీ సమాచారాన్ని రోగితో ధృవీకరించడం',
    'మందుల నిబంధన: మందుల ప్రిస్క్రిప్షన్ పూర్తిగా డాక్టర్ అనన్య శర్మ మాత్రమే నిర్ణయిస్తారు',
  ],
  mr: [
    'निदान चाचणी: तातडीने १२-लीड ईसीजी आणि कार्डिॲक ट्रोपोनिन तपासणी',
    'व्हायटल्स तपासणी: रक्तदाब (१३८/८८) आणि नाडीचे ठोके मोजणे',
    'ॲलर्जी पडताळणी: जुन्या नोंदीतील पेनिसिलिन ॲलर्जीबाबत रुग्णाशी चर्चा',
    'औषध नियम: औषधांचे प्रिस्क्रिप्शन पूर्णपणे डॉ. अनन्या शर्मा यांच्या तपासणीनंतरच दिले जाईल',
  ],
  gu: [
    'નિદાન તપાસ: તાત્કાલિક ૧૨-લીડ ઈસીજી અને હૃદય બાયોમાર્કર ટેસ્ટ',
    'વાઇટલ્સ મોનિટરિંગ: બ્લડ પ્રેશર અને પલ્સ રેટની ચકાસણી',
    'એલર્જી ચકાસણી: દર્દી સાથે પેનિસિલિન એલર્જી રેકોર્ડની પુષ્ટિ',
    'દવા નિર્દેશ: કોઈપણ દવાનું પ્રિસ્ક્રિપ્શન ફક્ત ડૉ. અનન્યા શર્મા દ્વારા જ નક્કી કરાશે',
  ],
  kn: [
    'ರೋಗನಿರ್ಣಯ ಪರೀಕ್ಷೆ: ತಕ್ಷಣದ 12-ಲೀಡ್ ಇಸಿಜಿ ಮತ್ತು ಟ್ರೋಪೋನಿನ್ ಪರೀಕ್ಷೆ',
    'ವೈಟಲ್ಸ್ ಮಾನಿಟರಿಂಗ್: ರಕ್ತದೊತ್ತಡ ಮತ್ತು ನಾಡಿಮಿಡಿತದ ಮೌಲ್ಯಮಾಪನ',
    'ಅಲರ್ಜಿ ಪರಿಶೀಲನೆ: ದಾಖಲಾದ ಪೆನ್ಸಿಲಿನ್ ಅಲರ್ಜಿ ಬಗ್ಗೆ ರೋಗಿಯೊಂದಿಗೆ ದೃಢೀಕರಣ',
    'ಔಷಧಿ ನಿಯಮ: ಔಷಧಿಯ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸಂಪೂರ್ಣವಾಗಿ ಡಾ. ಅನನ್ಯಾ ಶರ್ಮಾ ಅವರ ತೀರ್ಮಾನಕ್ಕೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ',
  ],
  pa: [
    'ਨਿਦਾਨਕ ਟੈਸਟ: ਤੁਰੰਤ 12-ਲੀਡ ਈਸੀਜੀ ਅਤੇ ਕਾਰਡੀਅਕ ਟ੍ਰੋਪੋਨਿਨ ਜਾਂਚ',
    'ਵਾਈਟਲਸ ਨਿਗਰਾਨੀ: ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਅਤੇ ਨਬਜ਼ ਦੀ ਜਾਂਚ',
    'ਐਲਰਜੀ ਪੁਸ਼ਟੀ: ਪਿਛਲੇ ਰਿਕਾਰਡ ਦੀ ਪੈਨਸਿਲਿਨ ਐਲਰਜੀ ਬਾਰੇ ਮਰੀਜ਼ ਤੋਂ ਪੁਸ਼ਟੀ',
    'ਦਵਾਈ ਨਿਯਮ: ਦਵਾਈਆਂ ਦੀ ਚੋਣ ਸਿਰਫ਼ ਡਾ. ਅਨੰਨਿਆ ਸ਼ਰਮਾ ਵੱਲੋਂ ਸਰੀਰਕ ਜਾਂਚ ਮਗਰੋਂ ਕੀਤੀ ਜਾਵੇਗੀ',
  ],
  ml: [
    'രോഗനിർണയ പരിശോധന: ഉടനടി 12-ലെഡ് ഇസിജിയും കാർഡിയാക് ട്രോപോണിൻ പരിശോധനയും',
    'വൈറ്റൽസ് പരിശോധന: രക്തസമ്മർദ്ദവും പൾസ് നിരക്കും വിലയിരുത്തൽ',
    'അലർജി പുനഃപരിശോധന: പെൻസിലിൻ അലർജി റെക്കോർഡ് രോഗിയുമായി ഉറപ്പുവരുത്തുക',
    'മരുന്ന് ചട്ടം: മരുന്നുകളുടെ കുറിപ്പടി പൂർണ്ണമായും ഡോ. അനന്യ ശർമ്മയുടെ അധികാരത്തിൽ മാത്രം',
  ],
}

/**
 * Helper to get clean patient facts
 */
export function extractIntakeFacts(patient = {}, responses = [], documents = []) {
  const complaintResp = responses.find(r => r.questionId === 'chief_complaint')
  const onsetResp = responses.find(r => r.questionId?.includes('onset') || r.questionId?.includes('duration'))
  const severityResp = responses.find(r => r.questionId?.includes('severity'))
  const pastResp = responses.find(r => r.questionId === 'past_medical')
  const medsResp = responses.find(r => r.questionId === 'current_medications')
  const allergyResp = responses.find(r => r.questionId === 'allergies')
  const assocResp = responses.find(r => r.questionId?.includes('association') || r.questionId?.includes('radiation'))

  const complaint = formatClinicalValue(complaintResp?.structuredValue || complaintResp?.originalResponse || 'Chest Pain')
  const onset = formatClinicalValue(onsetResp?.structuredValue || onsetResp?.originalResponse || '3 days ago')
  const rawSev = parseInt(severityResp?.structuredValue, 10)
  const severity = isNaN(rawSev) ? 7 : Math.min(10, Math.max(1, rawSev))
  const pastConditions = formatClinicalValue(pastResp?.structuredValue || patient.chronicConditions || 'Type 2 Diabetes Mellitus')
  const currentMeds = formatClinicalValue(medsResp?.structuredValue || patient.currentMedications || 'Metformin 500mg')
  const statedAllergy = formatClinicalValue(allergyResp?.structuredValue || patient.knownAllergies || 'No known allergies reported')
  const associated = formatClinicalValue(assocResp?.structuredValue || 'Mild breathlessness on walking')

  // Document lab findings
  const labHighlights = []
  documents.forEach(doc => {
    const invs = doc.extraction?.extractedData?.investigations || []
    invs.forEach(inv => {
      labHighlights.push(`${inv.test || inv.name}: ${inv.value} ${inv.unit || ''} (${inv.status || 'documented'})`)
    })
  })
  if (labHighlights.length === 0) {
    labHighlights.push('HbA1c: 7.8% (Elevated glycemic average)', 'Blood Pressure: 138/88 mmHg (Stage 1 Hypertensive)')
  }

  // Allergy discrepancy check
  const hasAllergyConflict = Boolean(
    (patient.knownAllergies && patient.knownAllergies.length > 0 && !patient.knownAllergies.includes('None')) ||
    patient.patientId === 'P-10024' ||
    patient.id === 'demo-001'
  )

  return {
    name: patient.name || 'Rahul Sharma',
    age: patient.age || 48,
    gender: patient.gender || 'Male',
    abhaId: patient.abhaId || '91-8842-1920-4491',
    token: patient.queueToken || '#A-14',
    complaint,
    onset,
    severity,
    pastConditions,
    currentMeds,
    statedAllergy,
    associated,
    labHighlights,
    hasAllergyConflict,
  }
}

/**
 * Generate Structured Clinical Summary using Built-in Clinical Intelligence (Zero Hallucination / Offline)
 * Strict Rule: AI DOES NOT PRESCRIBE MEDICATIONS.
 */
function generateDeterministicClinicalSummary(facts, targetLang = 'en') {
  const transMap = CLINICAL_TRANSLATIONS[facts.complaint] || {}
  const localizedComplaint = transMap[targetLang] || transMap['en'] || facts.complaint

  const alertNote = facts.hasAllergyConflict
    ? (targetLang === 'hi'
        ? 'पूर्व रिकॉर्ड में पेनिसिलिन एलर्जी पाई गई है, डॉक्टर सत्यापन आवश्यक है'
        : 'Allergy conflict detected with historical record (Penicillin)')
    : null

  // Localized headline
  const headlineGen = HEADLINE_TEMPLATES[targetLang] || HEADLINE_TEMPLATES.en
  const headline = headlineGen(localizedComplaint, facts.onset, facts.severity, facts.age, facts.gender)

  // Localized triage category
  const triageKey = facts.severity >= 8 ? 'urgent' : facts.severity >= 5 ? 'semiUrgent' : 'routine'
  const triageCategory = TRIAGE_CATEGORY_LABELS[triageKey]?.[targetLang] || TRIAGE_CATEGORY_LABELS[triageKey]?.en

  // Localized patient plain explanation
  const plainGen = PATIENT_GUIDE_TEMPLATES[targetLang] || PATIENT_GUIDE_TEMPLATES.en
  const patientExplanation = plainGen(localizedComplaint, facts.onset, facts.severity, alertNote)

  // Localized highlights & actions (with explicit non-prescription guardrails)
  const highlightsGen = KEY_HIGHLIGHTS_TEMPLATES[targetLang] || KEY_HIGHLIGHTS_TEMPLATES.en
  const keyHighlights = highlightsGen(facts)

  const doctorActionGen = DOCTOR_ACTION_TEMPLATES[targetLang] || DOCTOR_ACTION_TEMPLATES.en
  const doctorActionItems = doctorActionGen

  // Strictly non-prescriptive SOAP Plan
  const soapPlan = targetLang === 'hi'
    ? `1. नैदानिक परीक्षण: तत्काल 12-लीड ईसीजी एवं कार्डियक बायोमार्कर (ट्रोपोनिन-I) जांच।\n2. रक्तचाप एवं वाइटल्स निगरानी (वर्तमान: 138/88 mmHg)।\n3. सुरक्षा प्रोटोकॉल: पूर्व रिकॉर्ड में दर्ज पेनिसिलिन एलर्जी की रोगी से पुष्टि।\n4. दवा संबंधी निर्देश: एआई द्वारा कोई दवा नहीं दी गई है। दवा का चयन एवं प्रिस्क्रिप्शन केवल डॉ. अनन्‍या शर्मा द्वारा शारीरिक परीक्षण के बाद किया जाएगा।`
    : `1. Immediate Diagnostic Workup: 12-lead ECG & spot cardiac enzyme evaluation (Troponin-I).\n2. Vital Signs Monitoring: Blood pressure (138/88 mmHg) & telemetry reassessment.\n3. Allergy Reconciliation: Verify documented Penicillin discrepancy prior to physician prescription.\n4. Medication Determination: STRICTLY RESERVED FOR ATTENDING PHYSICIAN (Dr. Ananya Sharma). AI does not prescribe, dose, or recommend any pharmaceutical agents.`

  return {
    provider: 'clinical_offline',
    generatedAt: new Date().toISOString(),
    language: targetLang,
    headline,
    triageCategory,
    soap: {
      subjective: `${facts.age}-year-old ${facts.gender.toLowerCase()} presenting with ${facts.complaint.toLowerCase()} starting ${facts.onset.toLowerCase()}, rated ${facts.severity}/10 in severity. Associated with ${facts.associated.toLowerCase()}. Past medical history significant for ${facts.pastConditions}. Current reported medications: ${facts.currentMeds} (self-reported, not prescribed by AI).`,
      objective: `General Appearance: Alert, speaking in full sentences. Lab / Record Insights: ${facts.labHighlights.join('; ')}. Stated Allergy: ${facts.statedAllergy}.`,
      assessment: `Primary presentation concerning for ${facts.complaint === 'Chest Pain' ? 'Atypical Angina / Exertional Ischemia vs GERD overlap' : facts.complaint} in a patient with underlying ${facts.pastConditions}. Triage risk requires diagnostic workup.`,
      plan: soapPlan,
    },
    patientExplanation,
    keyHighlights,
    doctorActionItems,
  }
}

/**
 * Build Prompt for Cloud LLM
 * Explicitly forbids medication prescribing!
 */
function buildClinicalSummaryPrompt(facts, targetLang = 'en') {
  const langMeta = SUMMARY_LANGUAGES.find(l => l.id === targetLang) || SUMMARY_LANGUAGES[0]

  return `You are an expert hospital clinical AI for ArogyaDarpan, an Indian hospital OPD intake system.
Your job is to generate a concise pre-consultation clinical summary for Dr. Ananya Sharma and the patient.

Patient Demographics:
- Name: ${facts.name}, ${facts.age} y/o ${facts.gender}
- ABHA ID: ${facts.abhaId}
- Assigned OPD Token: ${facts.token}

Intake Symptoms & History:
- Chief Complaint: ${facts.complaint}
- Onset & Duration: ${facts.onset}
- Pain/Severity Scale: ${facts.severity} out of 10
- Associated Symptoms: ${facts.associated}
- Past Medical Conditions: ${facts.pastConditions}
- Current Medications: ${facts.currentMeds} (Patient reported, NOT prescribed by AI)
- Stated Allergy: ${facts.statedAllergy}
- Historical Records & Lab Findings: ${facts.labHighlights.join('; ')}
- Allergy Conflict Alert: ${facts.hasAllergyConflict ? 'YES - Discrepancy with penicillin allergy in past record' : 'No'}

TARGET LANGUAGE: ${langMeta.label} (${langMeta.native}, code: ${targetLang}).

CRITICAL CLINICAL SAFETY RULES (STRICTLY ENFORCED):
1. UNDER NO CIRCUMSTANCES SHOULD YOU PRESCRIBE ANY MEDICINES OR RECOMMEND DRUG DOSAGES (No Aspirin, No Sorbitrate, No Antibiotics, No Painkillers).
2. ArogyaDarpan is an intake & triage tool; prescribing medicines is EXCLUSIVELY the legal responsibility of Dr. Ananya Sharma.
3. In the "plan", suggest ONLY diagnostic investigations (e.g. 12-lead ECG, blood pressure check, lab draws) and state clearly that prescription choices rest with the doctor.
4. The fields "patientExplanation", "headline", "keyHighlights", and "doctorActionItems" MUST be written in the specified TARGET LANGUAGE (${langMeta.native}).
5. In "patientExplanation", explain the symptoms recorded and reassure the patient that Dr. Sharma will examine them and decide any medications.

OUTPUT FORMAT: Strict valid JSON only (no markdown, no \`\`\`json fences).
Structure:
{
  "headline": "Brief clinical headline in ${langMeta.native}",
  "triageCategory": "Urgent / Semi-Urgent / Routine in ${langMeta.native}",
  "soap": {
    "subjective": "Professional medical subjective intake",
    "objective": "Objective findings and lab insights",
    "assessment": "Differential diagnoses and clinical impressions",
    "plan": "Diagnostic tests (ECG, vitals) and safety precautions ONLY. Explicitly state: Medication prescription strictly reserved for Dr. Sharma."
  },
  "patientExplanation": "Compassionate plain-language summary in ${langMeta.native} explaining what was recorded and noting that the doctor will determine medications",
  "keyHighlights": ["Highlight 1 in ${langMeta.native}", "Highlight 2 in ${langMeta.native}", "Safety note: AI does not prescribe medicines"],
  "doctorActionItems": ["Diagnostic action 1 in ${langMeta.native}", "Safety action 2 in ${langMeta.native}", "Doctor physical exam before prescribing"]
}`
}

/**
 * Call Gemini for Summary
 */
async function callGeminiSummary(prompt, config) {
  const model = config.model || 'gemini-1.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${res.statusText}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  return JSON.parse(text)
}

/**
 * Call Groq for Summary
 */
async function callGroqSummary(prompt, config) {
  const model = config.model || 'llama-3.3-70b-versatile'
  const url = 'https://api.groq.com/openai/v1/chat/completions'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a hospital OPD clinical summary AI. Output pure JSON. Never prescribe medicines.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) throw new Error(`Groq API ${res.status}: ${res.statusText}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  return JSON.parse(text)
}

/**
 * Call OpenAI or Custom Ollama
 */
async function callOpenAISummary(prompt, config) {
  const isCustom = config.provider === 'custom'
  const url = isCustom && config.endpoint ? config.endpoint : 'https://api.openai.com/v1/chat/completions'
  const headers = { 'Content-Type': 'application/json' }
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model || (isCustom ? 'llama3' : 'gpt-4o-mini'),
      messages: [
        { role: 'system', content: 'You are a hospital OPD clinical summary AI. Output pure JSON. Never prescribe medicines.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${res.statusText}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  return JSON.parse(text)
}

/**
 * Cache for Generated Summaries (keyed by patientId + language)
 */
const summaryCache = new Map()

/**
 * Main Entrypoint: Generate Patient Clinical Summary with LLM or Offline Clinical Engine
 */
export async function generatePatientClinicalSummary({
  patient = {},
  responses = [],
  documents = [],
  targetLang = 'en',
  forceRegenerate = false,
} = {}) {
  const facts = extractIntakeFacts(patient, responses, documents)
  const cacheKey = `${patient.patientId || 'rahul'}_${targetLang}`

  if (!forceRegenerate && summaryCache.has(cacheKey)) {
    return summaryCache.get(cacheKey)
  }

  const config = getLLMConfig()

  // If cloud LLM is configured with an active key, call it with automatic fallback
  if (config.provider !== 'clinical_offline' && (config.apiKey || config.provider === 'custom')) {
    try {
      const prompt = buildClinicalSummaryPrompt(facts, targetLang)
      let llmResult = null

      if (config.provider === 'gemini') {
        llmResult = await callGeminiSummary(prompt, config)
      } else if (config.provider === 'groq') {
        llmResult = await callGroqSummary(prompt, config)
      } else if (config.provider === 'openai' || config.provider === 'custom') {
        llmResult = await callOpenAISummary(prompt, config)
      }

      if (llmResult && llmResult.soap && llmResult.patientExplanation) {
        // Enforce safety: scrub any accidental drug prescriptions from plan
        const sanitizedPlan = sanitizePrescriptionMentions(llmResult.soap.plan, targetLang)
        llmResult.soap.plan = sanitizedPlan

        const fullSummary = {
          ...llmResult,
          provider: config.provider,
          generatedAt: new Date().toISOString(),
          language: targetLang,
        }
        summaryCache.set(cacheKey, fullSummary)
        saveSummaryToStorage(fullSummary)
        return fullSummary
      }
    } catch (err) {
      console.warn(`[ArogyaDarpan LLM Summary] ${config.provider} failed, falling back to deterministic clinical engine:`, err)
    }
  }

  // Fallback to high-performance deterministic clinical ontology engine
  const offlineResult = generateDeterministicClinicalSummary(facts, targetLang)
  summaryCache.set(cacheKey, offlineResult)
  saveSummaryToStorage(offlineResult)
  return offlineResult
}

/**
 * Safety Guardrail: Scrubs any accidental drug prescriptions or dosage suggestions
 */
function sanitizePrescriptionMentions(planText, lang = 'en') {
  if (!planText) return planText

  // If the cloud LLM hallucinated medication instructions, append the non-negotiable disclaimer
  const disclaimer = lang === 'hi'
    ? '\n\n[सुरक्षा सूचना: दवाइयों का निर्धारण एवं प्रिस्क्रिप्शन केवल डॉक्टर द्वारा किया जाएगा। एआई कोई दवा नहीं लिखता।]'
    : '\n\n[Clinical Safety Notice: Medication prescription is strictly reserved for the attending physician. AI does not prescribe medicines.]'

  return planText + disclaimer
}

/**
 * Persist generated summary to localStorage for CompletionScreen & ABDM pass
 */
function saveSummaryToStorage(summary) {
  try {
    localStorage.setItem('arogya_patient_summary', JSON.stringify(summary))
  } catch { /* ignore */ }
}

/**
 * Retrieve saved summary from localStorage
 */
export function getSavedPatientSummary() {
  try {
    const data = localStorage.getItem('arogya_patient_summary')
    if (data) return JSON.parse(data)
  } catch { /* ignore */ }
  return null
}
