// ============================
// ArogyaDarpan — AI & Clinical Ontology Question Generator
// Generates intelligent, clinically structured SOCRATES follow-up questions
// for custom typed complaints across Indian languages using LLM / Clinical Ontology
// ============================

/**
 * Domain-specific clinical question templates for common complaint categories
 */
const CLINICAL_DOMAINS = {
  joint_pain: {
    matchKeywords: ['joint', 'knee', 'elbow', 'shoulder', 'arthritis', 'guthna', 'ghutna', 'jod', 'jodon', 'swelling', 'sprain', 'ankle', 'wrist', 'bone', 'walk', 'limp'],
    category: 'musculoskeletal',
    questions: [
      {
        id: 'joint_site_swelling',
        question: 'Site & Swelling: Which joints are hurting, and is there visible swelling, warmth, or redness?',
        questionHi: 'स्थान व सूजन: कौन से जोड़ में दर्द है, और क्या वहां सूजन या लालिमा है?',
        questions: {
          hi: 'स्थान व सूजन: कौन से जोड़ में दर्द है, और क्या वहां सूजन या लालिमा है?',
          bn: 'স্থান ও ফোলা: কোন সংযোগস্থলে ব্যথা এবং সেখানে কি ফোলা বা লালভাব আছে?',
          ta: 'இடம் மற்றும் வீக்கம்: எந்த மூட்டுகளில் வலி உள்ளது, வீக்கம் அல்லது சிவத்தல் உள்ளதா?',
          te: 'స్థానం మరియు వాపు: ఏ కీళ్లలో నొప్పి ఉంది మరియు వాపు లేదా ఎరుపు ఉందా?',
          mr: 'जागा आणि सूज: कोणत्या सांध्यामध्ये दुखत आहे आणि तिथे सूज किंवा लालसरपणा आहे का?',
          gu: 'સ્થાન અને સોજો: કયા સાંધામાં દુખાવો છે અને શું ત્યાં સોજો કે લાલાશ છે?',
          kn: 'ಸ್ಥಳ ಮತ್ತು ಊತ: ಯಾವ ಕೀಲುಗಳಲ್ಲಿ ನೋವಿದೆ ಮತ್ತು ಊತ ಅಥವಾ ಕೆಂಪಾಗುವಿಕೆ ಇದೆಯೇ?',
          pa: 'ਸਥਾਨ ਅਤੇ ਸੋਜ: ਕਿਸ ਜੋੜ ਵਿੱਚ ਦਰਦ ਹੈ ਅਤੇ ਕੀ ਉੱਥੇ ਸੋਜ ਜਾਂ ਲਾਲੀ ਹੈ?',
          ml: 'സ്ഥലവും വീക്കവും: ഏത് സന്ധികളിലാണ് വേദന, വീക്കമോ ചുവപ്പോ ഉണ്ടോ?',
        },
        type: 'multi_select',
        options: [
          { value: 'knee', label: 'Knee joint (घुटने)', labelHi: 'घुटने का जोड़' },
          { value: 'ankle_foot', label: 'Ankle / Foot (टखना / पैर)', labelHi: 'टखना / पैर' },
          { value: 'shoulder_arm', label: 'Shoulder / Arm (कंधा / बांह)', labelHi: 'कंधा / बांह' },
          { value: 'hands_fingers', label: 'Fingers / Wrist (उंगलियां / कलाई)', labelHi: 'उंगलियां / कलाई' },
          { value: 'swelling_present', label: 'Visible swelling & warmth (सूजन और गर्माहट)', labelHi: 'सूजन और गर्माहट' },
        ],
        category: 'chief_complaint'
      },
      {
        id: 'joint_onset_mobility',
        question: 'Onset & Mobility: When did the joint pain begin and does it worsen during walking or standing?',
        questionHi: 'शुरुआत व गतिशीलता: दर्द कब शुरू हुआ और क्या चलने या सीढ़ियां चढ़ने पर बढ़ता है?',
        questions: {
          hi: 'शुरुआत व गतिशीलता: दर्द कब शुरू हुआ और क्या चलने या सीढ़ियां चढ़ने पर बढ़ता है?',
          bn: 'শুরু ও গতিশীলতা: ব্যথা কখন শুরু হয়েছিল এবং হাঁটার সময় কি বাড়ে?',
          ta: 'தொடக்கம்: வலி எப்போது தொடங்கியது, நடக்கும்போது அல்லது நிற்கும்போது அதிகமாகிறதா?',
          te: 'ప్రారంభం: నొప్పి ఎప్పుడు ప్రారంభమైంది మరియు నడిచేటప్పుడు పెరుగుతుందా?',
          mr: 'सुरुवात: दुखणे कधी सुरू झाले आणि चालताना त्रास वाढतो का?',
          gu: 'શરૂઆત: દુખાવો ક્યારે શરૂ થયો અને ચાલતી વખતે વધે છે?',
          kn: 'ಪ್ರಾರಂಭ: ನೋವು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು ಮತ್ತು ನಡೆಯುವಾಗ ಹೆಚ್ಚಾಗುತ್ತದೆಯೇ?',
          pa: 'ਸ਼ੁਰੂਆਤ: ਦਰਦ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਇਆ ਅਤੇ ਕੀ ਤੁਰਨ ਵੇਲੇ ਵਧਦਾ ਹੈ?',
          ml: 'തുടക്കം: വേദന എപ്പോൾ തുടങ്ങി, നടക്കുമ്പോൾ കൂടുന്നുണ്ടോ?',
        },
        type: 'single_select',
        options: [
          { value: 'sudden_injury', label: 'Sudden after fall or twist / injury', labelHi: 'चोट या मुड़ने के बाद अचानक' },
          { value: 'gradual_days', label: 'Gradual onset (2-7 days)', labelHi: 'धीरे-धीरे (2-7 दिनों में)' },
          { value: 'chronic_months', label: 'Chronic long-standing (months / years)', labelHi: 'पुराना दर्द (महीनों या सालों से)' },
          { value: 'morning_stiff', label: 'Severe stiffness in the morning for >30 mins', labelHi: 'सुबह उठने पर 30 मिनट से अधिक अकड़न' },
        ],
        category: 'duration'
      },
      {
        id: 'joint_severity',
        question: 'Severity: On a scale of 1 to 10, how severe is your joint discomfort?',
        questionHi: 'तीव्रता: 1 से 10 के पैमाने पर जोड़ों का दर्द कितना गंभीर है?',
        type: 'number',
        min: 1,
        max: 10,
        category: 'severity'
      }
    ]
  },

  skin_rash: {
    matchKeywords: ['skin', 'rash', 'itch', 'itching', 'khujli', 'daane', 'boil', 'allergy', 'redness', 'spots', 'blister', 'eczema', 'ringworm', 'twacha', 'pimples'],
    category: 'dermatological',
    questions: [
      {
        id: 'skin_location_type',
        question: 'Rash Characteristics: Where is the rash located and what does it feel like?',
        questionHi: 'चकत्ते का स्वरूप: यह त्वचा पर कहाँ है और इसमें कैसी परेशानी हो रही है?',
        questions: {
          hi: 'चकत्ते का स्वरूप: यह त्वचा पर कहाँ है और इसमें कैसी परेशानी हो रही है?',
          bn: 'ফুসকুড়ির ধরন: ফুসকুড়ি শরীরের কোথায় এবং কেমন অনুভূতি হচ্ছে?',
          ta: 'தடிப்பின் தன்மை: தடிப்பு எங்குள்ளது மற்றும் அரிப்பு உள்ளதா?',
          te: 'దద్దుర్ల లక్షణం: దద్దుర్లు ఎక్కడ ఉన్నాయి మరియు దురద ఉందా?',
          mr: 'पुरळाचे स्वरूप: पुरळ कुठे आहे आणि खाज येत आहे का?',
          gu: 'ફોલ્લીઓનું સ્વરૂપ: ચકામા ક્યાં છે અને ખંજવાળ આવે છે?',
          kn: 'ದದ್ದುಗಳ ಸ್ವರೂಪ: ದದ್ದುಗಳು ಎಲ್ಲಿವೆ ಮತ್ತು ತುರಿಕೆ ಇದೆಯೇ?',
          pa: 'ਧੱਫੜ ਦੀ ਕਿਸਮ: ਧੱਫੜ ਕਿੱਥੇ ਹਨ ਅਤੇ ਕੀ ਖੁਜਲੀ ਹੁੰਦੀ ਹੈ?',
          ml: 'തടിപ്പിന്റെ ലക്ഷണം: തടിപ്പ് എവിടെയാണ്, ചൊറിച്ചിൽ ഉണ്ടോ?',
        },
        type: 'multi_select',
        options: [
          { value: 'severe_itching', label: 'Intense itching (तेज़ खुजली)', labelHi: 'तेज़ खुजली' },
          { value: 'burning_pain', label: 'Burning sensation or pain (जलन या दर्द)', labelHi: 'जलन या दर्द' },
          { value: 'blister_fluid', label: 'Small blisters / fluid discharge (छाले या पानी निकलना)', labelHi: 'छाले या पानी निकलना' },
          { value: 'dry_scaling', label: 'Dry peeling or scaling (सूखी पपड़ी)', labelHi: 'सूखी पपड़ी' },
          { value: 'widespread_body', label: 'Spreading across entire body (पूरे शरीर पर फैलना)', labelHi: 'पूरे शरीर पर फैलना' },
        ],
        category: 'chief_complaint'
      },
      {
        id: 'skin_triggers',
        question: 'Onset & Triggers: Did this start after any new medicine, soap, food, or insect bite?',
        questionHi: 'शुरुआत व कारण: क्या यह किसी नई दवाई, साबुन, खाने या कीड़े के काटने के बाद शुरू हुआ?',
        type: 'single_select',
        options: [
          { value: 'new_medication', label: 'Started after taking a medicine (दवा लेने के बाद)', labelHi: 'दवा लेने के बाद' },
          { value: 'insect_outdoor', label: 'Insect bite or outdoor contact (कीड़ा काटना)', labelHi: 'कीड़ा काटना' },
          { value: 'food_allergy', label: 'After eating specific food (भोजन के बाद)', labelHi: 'भोजन के बाद' },
          { value: 'no_known_cause', label: 'No specific trigger noticed (कोई कारण नहीं पता)', labelHi: 'कोई स्पष्ट कारण नहीं' },
        ],
        category: 'duration'
      },
      {
        id: 'skin_severity',
        question: 'Severity: On a scale of 1 to 10, how bothersome or painful is this skin issue?',
        questionHi: 'गंभीरता: 1 से 10 में यह समस्या कितनी परेशान करने वाली या दर्दनाक है?',
        type: 'number',
        min: 1,
        max: 10,
        category: 'severity'
      }
    ]
  },

  eye_problem: {
    matchKeywords: ['eye', 'vision', 'aankh', 'aankhon', 'drishti', 'blur', 'conjunctivitis', 'redness', 'watering', 'stye', 'sight', 'blindness'],
    category: 'ophthalmic',
    questions: [
      {
        id: 'eye_symptoms',
        question: 'Eye Symptoms: What symptoms are you experiencing in your eyes?',
        questionHi: 'आंखों के लक्षण: आपकी आंखों में क्या समस्या हो रही है?',
        type: 'multi_select',
        options: [
          { value: 'redness', label: 'Severe redness / Bloodshot (आंख लाल होना)', labelHi: 'आंख लाल होना' },
          { value: 'pain_gritty', label: 'Pain or gritty foreign body sensation (दर्द या चुभन)', labelHi: 'दर्द या चुभन' },
          { value: 'blur_vision', label: 'Blurry or reduced vision (धुंधला दिखाई देना)', labelHi: 'धुंधला दिखाई देना' },
          { value: 'discharge_pus', label: 'Yellow/green discharge or eyelids stuck (कीचड़ आना)', labelHi: 'कीचड़ आना' },
          { value: 'light_sensitive', label: 'Extreme sensitivity to light (रोशनी से परेशानी)', labelHi: 'रोशनी से परेशानी' },
        ],
        category: 'chief_complaint'
      },
      {
        id: 'eye_onset_injury',
        question: 'Onset & History: When did this start and has there been any injury, splash, or trauma to the eye?',
        questionHi: 'शुरुआत व चोट: यह कब शुरू हुआ और क्या आंख में कोई चोट, धूल या केमिकल गिरा था?',
        type: 'single_select',
        options: [
          { value: 'chemical_dust_injury', label: 'Yes — Chemical splash, dust, or physical injury', labelHi: 'हां — केमिकल, धूल या चोट लगी थी' },
          { value: 'started_today', label: 'Started suddenly today', labelHi: 'आज अचानक शुरू हुआ' },
          { value: 'gradual_days', label: 'Over 2-5 days', labelHi: '2-5 दिनों से' },
        ],
        category: 'duration'
      },
      {
        id: 'eye_severity',
        question: 'Severity: On a scale of 1 to 10, how severe is the eye pain or vision difficulty?',
        questionHi: 'गंभीरता: 1 से 10 के पैमाने पर आंख का दर्द या परेशानी कितनी तेज है?',
        type: 'number',
        min: 1,
        max: 10,
        category: 'severity'
      }
    ]
  },

  ear_throat: {
    matchKeywords: ['ear', 'throat', 'gala', 'kaan', 'swallow', 'tonsil', 'voice', 'hoarse', 'hearing', 'tinnitus', 'cold', 'sinus', 'runny nose'],
    category: 'ent',
    questions: [
      {
        id: 'ent_symptoms',
        question: 'Ear & Throat Symptoms: Which of these symptoms are you experiencing?',
        questionHi: 'कान व गले के लक्षण: आपको इनमें से क्या परेशानी है?',
        type: 'multi_select',
        options: [
          { value: 'ear_pain', label: 'Ear pain or throbbing (कान में तेज दर्द)', labelHi: 'कान में तेज दर्द' },
          { value: 'ear_discharge', label: 'Discharge or fluid leaking from ear (कान बहना)', labelHi: 'कान बहना' },
          { value: 'sore_throat', label: 'Severe sore throat / difficulty swallowing (गले में दर्द / निगलने में तकलीफ)', labelHi: 'गले में दर्द / निगलने में तकलीफ' },
          { value: 'hearing_loss', label: 'Reduced hearing or ringing sound (कम सुनाई देना / सांय-सांय)', labelHi: 'कम सुनाई देना' },
          { value: 'fever_chills', label: 'Accompanying fever and chills (बुखार और ठंड)', labelHi: 'बुखार और ठंड' },
        ],
        category: 'chief_complaint'
      },
      {
        id: 'ent_duration',
        question: 'Duration: How many days have you had these ear or throat symptoms?',
        questionHi: 'अवधि: कान या गले की यह तकलीफ कितने दिनों से है?',
        type: 'single_select',
        options: [
          { value: '1_2_days', label: '1 - 2 days (1-2 दिन से)', labelHi: '1-2 दिन से' },
          { value: '3_7_days', label: '3 - 7 days (3-7 दिन से)', labelHi: '3-7 दिन से' },
          { value: 'more_than_week', label: 'More than 1 week (1 सप्ताह से अधिक)', labelHi: '1 सप्ताह से अधिक' },
        ],
        category: 'duration'
      },
      {
        id: 'ent_severity',
        question: 'Severity: On a scale of 1 to 10, how severe is the pain or discomfort?',
        questionHi: 'गंभीरता: 1 से 10 में दर्द कितना तेज है?',
        type: 'number',
        min: 1,
        max: 10,
        category: 'severity'
      }
    ]
  },

  urinary: {
    matchKeywords: ['urine', 'urinary', 'peshab', 'burning', 'dysuria', 'kidney', 'bladder', 'frequency', 'hematuria', 'uti'],
    category: 'genitourinary',
    questions: [
      {
        id: 'urinary_symptoms',
        question: 'Urinary Symptoms: Are you experiencing burning, frequent urination, or flank pain?',
        questionHi: 'पेशाब के लक्षण: क्या पेशाब में जलन, बार-बार जाना, या कमर/पेट में दर्द है?',
        type: 'multi_select',
        options: [
          { value: 'burning_pain', label: 'Burning sensation during urination (पेशाब में जलन)', labelHi: 'पेशाब में जलन' },
          { value: 'increased_frequency', label: 'Frequent urge or difficulty holding (बार-बार जाना)', labelHi: 'बार-बार जाना' },
          { value: 'blood_in_urine', label: 'Red or blood-tinged urine (पेशाब में खून/लालिमा)', labelHi: 'पेशाब में खून' },
          { value: 'lower_back_pain', label: 'Pain in lower back / side (कमर या बगल में तेज दर्द)', labelHi: 'कमर या बगल में दर्द' },
          { value: 'fever_rigors', label: 'High fever with shivering (ठंड लगकर तेज बुखार)', labelHi: 'ठंड लगकर तेज बुखार' },
        ],
        category: 'chief_complaint'
      },
      {
        id: 'urinary_onset',
        question: 'Onset: When did your urinary symptoms begin?',
        questionHi: 'शुरुआत: यह समस्या कब से शुरू हुई?',
        type: 'single_select',
        options: [
          { value: 'today', label: 'Today (आज से)', labelHi: 'आज से' },
          { value: '2_3_days', label: '2 - 3 days ago (2-3 दिन पहले)', labelHi: '2-3 दिन पहले' },
          { value: 'recurrent', label: 'Repeated episodes / Recurrent (पहले भी होता रहा है)', labelHi: 'पहले भी होता रहा है' },
        ],
        category: 'duration'
      },
      {
        id: 'urinary_severity',
        question: 'Severity: On a scale of 1 to 10, how severe is the burning or pain?',
        questionHi: 'गंभीरता: 1 से 10 के पैमाने पर दर्द या जलन कितनी गंभीर है?',
        type: 'number',
        min: 1,
        max: 10,
        category: 'severity'
      }
    ]
  },

  dizziness: {
    matchKeywords: ['dizzy', 'dizziness', 'chakkar', 'spinning', 'vertigo', 'faint', 'fainting', 'unsteady', 'weakness', 'kamzori', 'giddiness', 'blackout'],
    category: 'neurological',
    questions: [
      {
        id: 'dizzy_character',
        question: 'Type of Dizziness: Does the room feel like it is spinning (vertigo), or do you feel faint and unsteady?',
        questionHi: 'चक्कर का स्वरूप: क्या कमरा घूमता हुआ लगता है, या कमजोरी व बेहोशी जैसा लगता है?',
        type: 'single_select',
        options: [
          { value: 'room_spinning', label: 'Room spinning / Rotational vertigo (कमरा गोल घूमना)', labelHi: 'कमरा गोल घूमना' },
          { value: 'lightheaded_faint', label: 'Feeling faint when standing up (खड़े होने पर अंधेरा छाना)', labelHi: 'खड़े होने पर अंधेरा छाना' },
          { value: 'unsteady_walking', label: 'Loss of balance / unsteadiness while walking (चलने में संतुलन बिगड़ना)', labelHi: 'चलने में संतुलन बिगड़ना' },
          { value: 'generalized_weakness', label: 'Severe whole-body weakness (पूरे शरीर में भारी कमजोरी)', labelHi: 'पूरे शरीर में कमजोरी' },
        ],
        category: 'chief_complaint'
      },
      {
        id: 'dizzy_red_flags',
        question: 'Safety Check: Have you experienced any fainting, loss of speech, facial weakness, or numbness?',
        questionHi: 'सुरक्षा जांच: क्या बेहोशी, बोलने में लड़खड़ाहट, चेहरे में कमजोरी या सुन्नपन हुआ है?',
        type: 'multi_select',
        options: [
          { value: 'syncope_fainted', label: 'Passed out or lost consciousness (बेहोश हुए थे)', labelHi: 'बेहोश हुए थे' },
          { value: 'speech_slurring', label: 'Difficulty speaking or slurred speech (बोलने में दिक्कत)', labelHi: 'बोलने में दिक्कत' },
          { value: 'limb_numbness', label: 'Weakness or numbness in arm / leg (हाथ या पैर में कमजोरी/सुन्नपन)', labelHi: 'हाथ या पैर में कमजोरी' },
          { value: 'none_of_above', label: 'None of these (इनमें से कोई नहीं)', labelHi: 'इनमें से कोई नहीं' },
        ],
        category: 'red_flag'
      },
      {
        id: 'dizzy_severity',
        question: 'Severity: On a scale of 1 to 10, how severely does this dizziness impact you right now?',
        questionHi: 'तीव्रता: 1 से 10 के पैमाने पर यह चक्कर आपको कितना प्रभावित कर रहा है?',
        type: 'number',
        min: 1,
        max: 10,
        category: 'severity'
      }
    ]
  },

  dental: {
    matchKeywords: ['tooth', 'dental', 'teeth', 'gum', 'daant', 'jaw', 'molar', 'toothache', 'cavity'],
    category: 'dental',
    questions: [
      {
        id: 'dental_symptoms',
        question: 'Dental Symptoms: Where is the tooth pain and is there swelling or bleeding gums?',
        questionHi: 'दांत के लक्षण: दर्द कहाँ है और क्या मसूड़ों में सूजन या खून आ रहा है?',
        type: 'multi_select',
        options: [
          { value: 'throbbing_toothache', label: 'Throbbing severe tooth pain (दांत में तेज टीस / दर्द)', labelHi: 'दांत में तेज टीस' },
          { value: 'facial_swelling', label: 'Swelling on face or jaw (चेहरे या जबड़े पर सूजन)', labelHi: 'चेहरे या जबड़े पर सूजन' },
          { value: 'hot_cold_sensitive', label: 'Severe sensitivity to hot or cold food (गर्म-ठंडा लगना)', labelHi: 'गर्म-ठंडा लगना' },
          { value: 'bleeding_gums', label: 'Bleeding or swollen gums (मसूड़ों से खून आना)', labelHi: 'मसूड़ों से खून आना' },
        ],
        category: 'chief_complaint'
      },
      {
        id: 'dental_duration',
        question: 'Onset: When did the tooth pain start?',
        questionHi: 'शुरुआत: दांत का दर्द कब शुरू हुआ?',
        type: 'single_select',
        options: [
          { value: 'today_sudden', label: 'Suddenly today or last night (आज या बीती रात से)', labelHi: 'आज या बीती रात से' },
          { value: 'few_days', label: 'Few days ago (कुछ दिनों से)', labelHi: 'कुछ दिनों से' },
          { value: 'chronic_weeks', label: 'Persisting for weeks (हफ्तों से रुक-रुक कर)', labelHi: 'हफ्तों से' },
        ],
        category: 'duration'
      },
      {
        id: 'dental_severity',
        question: 'Severity: On a scale of 1 to 10, how severe is the toothache right now?',
        questionHi: 'गंभीरता: 1 से 10 के पैमाने पर दांत का दर्द कितना तेज है?',
        type: 'number',
        min: 1,
        max: 10,
        category: 'severity'
      }
    ]
  }
}

/**
 * Generate personal questions dynamically incorporating patient's exact complaint text
 */
function generatePersonalizedGenericQuestions(complaintText = '', lang = 'en') {
  const cleanComplaint = (complaintText || 'your health condition').trim()

  return [
    {
      id: 'custom_onset',
      question: `Onset: When did your ${cleanComplaint} start, and did it develop suddenly?`,
      questionHi: `शुरुआत: आपकी यह समस्या (${cleanComplaint}) कब शुरू हुई, और क्या यह अचानक हुई थी?`,
      questions: {
        hi: `शुरुआत: आपकी यह समस्या (${cleanComplaint}) कब शुरू हुई, और क्या यह अचानक हुई थी?`,
        bn: `সূচনা: আপনার এই সমস্যা (${cleanComplaint}) কখন শুরু হয়েছিল?`,
        ta: `தொடக்க நேரம்: உங்கள் (${cleanComplaint}) எப்போது தொடங்கியது?`,
        te: `ప్రారంభం: మీ (${cleanComplaint}) ఎప్పుడు ప్రారంభమైంది?`,
        mr: `सुरुवात: तुमची समस्या (${cleanComplaint}) कधी सुरू झाली?`,
        gu: `શરૂઆત: તમારી આ સમસ્યા (${cleanComplaint}) ક્યારે શરૂ થઈ?`,
        kn: `ಪ್ರಾರಂಭ: ನಿಮ್ಮ (${cleanComplaint}) ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?`,
        pa: `ਸ਼ੁਰੂਆਤ: ਤੁਹਾਡੀ ਇਹ ਸਮੱਸਿਆ (${cleanComplaint}) ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਈ?`,
        ml: `തുടക്കം: നിങ്ങളുടെ (${cleanComplaint}) എപ്പോഴാണ് തുടങ്ങിയത്?`,
      },
      type: 'single_select',
      options: [
        { value: 'today', label: 'Suddenly today (आज अचानक)', labelHi: 'आज अचानक' },
        { value: 'yesterday', label: 'Yesterday (कल से)', labelHi: 'कल से' },
        { value: 'few_days', label: '2 to 3 days ago (2-3 दिन पहले से)', labelHi: '2-3 दिन पहले से' },
        { value: 'week_more', label: 'More than a week (1 सप्ताह से अधिक)', labelHi: '1 सप्ताह से अधिक' },
        { value: 'months_chronic', label: 'Chronic (महीनों से चली आ रही है)', labelHi: 'महीनों से' },
      ],
      category: 'duration'
    },
    {
      id: 'custom_character',
      question: `Characteristics: Can you describe what discomfort you are feeling with ${cleanComplaint}?`,
      questionHi: `लक्षण स्वरूप: इस समस्या (${cleanComplaint}) में आपको कैसा कष्ट या परेशानी महसूस हो रही है?`,
      questions: {
        hi: `लक्षण स्वरूप: इस समस्या (${cleanComplaint}) में आपको कैसा कष्ट या परेशानी महसूस हो रही है?`,
        bn: `লক্ষণ বিবরণ: (${cleanComplaint}) নিয়ে আপনার কেমন কষ্ট হচ্ছে বর্ণনা করুন।`,
        ta: `அறிகுறிகள்: (${cleanComplaint}) தொடர்பாக உங்களுக்கு என்ன அசௌகரியம் உள்ளது?`,
        te: `లక్షణాలు: (${cleanComplaint}) తో మీకు ఎలాంటి అసౌకర్యం కలుగుతోంది?`,
        mr: `लक्षणांचे स्वरूप: (${cleanComplaint}) मध्ये तुम्हाला काय त्रास होत आहे?`,
        gu: `લક્ષણો: (${cleanComplaint}) માં તમને કેવો ત્રાસ કે તકલીફ થાય છે?`,
        kn: `ಲಕ್ಷಣಗಳು: (${cleanComplaint}) ದಿಂದ ನಿಮಗೆ ಎಂತಹ ತೊಂದರೆ ಅನಿಸುತ್ತಿದೆ?`,
        pa: `ਲੱਛਣ: (${cleanComplaint}) ਨਾਲ ਤੁਹਾਨੂੰ ਕਿਸ ਤਰ੍ਹਾਂ ਦੀ ਤਕਲੀਫ ਮਹਿਸੂਸ ਹੋ ਰਹੀ ਹੈ?`,
        ml: `ലക്ഷണങ്ങൾ: (${cleanComplaint}) കാരണം നിങ്ങൾക്ക് എന്ത് ബുദ്ധിമുട്ടാണ് തോന്നുന്നത്?`,
      },
      type: 'text',
      category: 'chief_complaint'
    },
    {
      id: 'custom_severity',
      question: `Severity: On a scale of 1 to 10, how severe is your ${cleanComplaint} right now?`,
      questionHi: `गंभीरता: 1 से 10 के पैमाने पर आपकी यह समस्या (${cleanComplaint}) अभी कितनी गंभीर है?`,
      questions: {
        hi: `गंभीरता: 1 से 10 के पैमाने पर आपकी यह समस्या (${cleanComplaint}) अभी कितनी गंभीर है?`,
        bn: `তীব্রতা: ১ থেকে ১০ স্কেলে (${cleanComplaint}) এখন কতটা তীব্র?`,
        ta: `தீவிரம்: 1 முதல் 10 வரையிலான அளவில் (${cleanComplaint}) எவ்வளவு தீவிரமானது?`,
        te: `తీవ్రత: 1 నుండి 10 స్కేలులో (${cleanComplaint}) ఎంత తీవ్రంగా ఉంది?`,
        mr: `तीव्रता: १ ते १० च्या प्रमाणात (${cleanComplaint}) किती तीव्र आहे?`,
        gu: `તીવ્રતા: ૧ થી ૧૦ ના સ્કેલ પર (${cleanComplaint}) કેટલું ગંભીર છે?`,
        kn: `ತೀವ್ರತೆ: 1 ರಿಂದ 10 ರ ಪ್ರಮಾಣದಲ್ಲಿ (${cleanComplaint}) ಎಷ್ಟು ತೀವ್ರವಾಗಿದೆ?`,
        pa: `ਗੰਭੀਰਤਾ: 1 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ ਤੇ (${cleanComplaint}) ਕਿੰਨਾ ਗੰਭੀਰ ਹੈ?`,
        ml: `തീവ്രത: 1 മുതൽ 10 വരെയുള്ള സ്കെയിലിൽ (${cleanComplaint}) എത്രത്തോളമുണ്ട്?`,
      },
      type: 'number',
      min: 1,
      max: 10,
      category: 'severity'
    },
    {
      id: 'custom_associated',
      question: `Associated Symptoms: Are there any other symptoms you are noticing along with ${cleanComplaint}?`,
      questionHi: `संबंधित लक्षण: क्या इस समस्या (${cleanComplaint}) के साथ कोई अन्य लक्षण भी महसूस हो रहे हैं?`,
      questions: {
        hi: `संबंधित लक्षण: क्या इस समस्या (${cleanComplaint}) के साथ कोई अन्य लक्षण भी महसूस हो रहे हैं?`,
        bn: `সম্পর্কিত লক্ষণ: (${cleanComplaint}) এর সাথে কি অন্য কোনো লক্ষণ লক্ষ্য করছেন?`,
        ta: `தொடர்புடைய அறிகுறிகள்: (${cleanComplaint}) உடன் வேறு ஏதேனும் அறிகுறிகள் உள்ளதா?`,
        te: `సంబంధిత లక్షణాలు: (${cleanComplaint}) తో పాటు ఇతర లక్షణాలు ఏవైనా గమనించారా?`,
        mr: `संबंधित लक्षणे: (${cleanComplaint}) सोबत इतर काही लक्षणे जाणवत आहेत का?`,
        gu: `સંબંધિત લક્ષણો: (${cleanComplaint}) સાથે અન્ય કોઈ લક્ષણો જણાય છે?`,
        kn: `ಸಂಬಂಧಿತ ಲಕ್ಷಣಗಳು: (${cleanComplaint}) ಜೊತೆಗೆ ಬೇರೆ ಲಕ್ಷಣಗಳಿವೆಯೇ?`,
        pa: `ਸੰਬੰਧਿਤ ਲੱਛਣ: (${cleanComplaint}) ਦੇ ਨਾਲ ਕੋਈ ਹੋਰ ਲੱਛਣ ਵੀ ਹਨ?`,
        ml: `മറ്റ് ലക്ഷണങ്ങൾ: (${cleanComplaint}) ഒപ്പം മറ്റ് ലക്ഷണങ്ങൾ വല്ലതും ഉണ്ടോ?`,
      },
      type: 'text',
      category: 'associated_symptoms'
    }
  ]
}

// ============================================================================
// LLM Integration Layer: Supports Gemini, Groq, OpenAI & Custom Endpoints
// ============================================================================

const LLM_CONFIG_KEY = 'arogya_llm_config'

/**
 * Retrieve active LLM configuration from LocalStorage or Environment
 */
export function getLLMConfig() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LLM_CONFIG_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    }
  } catch (e) {
    // Ignore storage parse issues
  }

  // Fallback to environment variables if provided
  let geminiKey = ''
  let groqKey = ''
  let openaiKey = ''

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      geminiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
      groqKey = import.meta.env.VITE_GROQ_API_KEY || ''
      openaiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
    }
  } catch {
    // Ignore env access issues
  }

  if (geminiKey) {
    return { provider: 'gemini', apiKey: geminiKey, model: 'gemini-1.5-flash', endpoint: '' }
  }
  if (groqKey) {
    return { provider: 'groq', apiKey: groqKey, model: 'llama-3.3-70b-versatile', endpoint: '' }
  }
  if (openaiKey) {
    return { provider: 'openai', apiKey: openaiKey, model: 'gpt-4o-mini', endpoint: '' }
  }

  return {
    provider: 'clinical_offline',
    apiKey: '',
    model: '',
    endpoint: ''
  }
}

/**
 * Persist LLM configuration
 */
export function saveLLMConfig(config) {
  try {
    localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('Error saving LLM config:', e)
    return false
  }
}

// In-memory and session cache for generated questions
const questionCache = new Map()

export function getCachedQuestions(complaintText) {
  if (!complaintText) return null
  const key = complaintText.trim().toLowerCase()
  if (questionCache.has(key)) return questionCache.get(key)
  try {
    const stored = sessionStorage.getItem(`arogya_q_${key}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      questionCache.set(key, parsed)
      return parsed
    }
  } catch {
    // Ignore storage parse issues
  }
  return null
}

export function cacheQuestions(complaintText, questions) {
  if (!complaintText || !Array.isArray(questions)) return
  const key = complaintText.trim().toLowerCase()
  questionCache.set(key, questions)
  try {
    sessionStorage.setItem(`arogya_q_${key}`, JSON.stringify(questions))
  } catch {
    // Ignore quota issues
  }
}

/**
 * Builds the strict clinical prompt for any LLM
 */
function buildClinicalPrompt(complaintText, lang = 'en') {
  return `You are a clinical AI triage assistant for ArogyaDarpan, an Indian Government OPD hospital kiosk system.
The patient presented with chief complaint: "${complaintText}".
Language requested: ${lang}.

Generate 3 clinically rigorous follow-up triage questions adhering to the medical SOCRATES framework (Site, Onset, Character, Radiation, Associations, Time, Exacerbating factors, Severity).

CRITICAL REQUIREMENTS:
1. Return strictly a valid JSON array of objects. Do NOT include markdown code fences (no \`\`\`json).
2. Each question object must have:
   - "id": a unique snake_case string (e.g. "complaint_onset", "complaint_radiation", "complaint_severity")
   - "question": Clear clinical question in English
   - "questionHi": Accurate Hindi translation
   - "type": one of "single_select", "multi_select", "number", or "text"
   - "options": (for single_select/multi_select) array of 3-5 items: [{"value": "...", "label": "English text", "labelHi": "Hindi text"}]
   - "category": one of "chief_complaint", "duration", "severity", "associated_symptoms", or "red_flag"
3. Include at least one single_select or multi_select question and one 1-10 severity scale question ("type": "number", "min": 1, "max": 10).`
}

/**
 * Call Google Gemini REST API
 */
async function callGemini(prompt, config) {
  const model = config.model || 'gemini-1.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    }),
    signal: AbortSignal.timeout(6000)
  })

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  return parseLLMJson(rawText)
}

/**
 * Call Groq Cloud REST API (Fast Llama 3)
 */
async function callGroq(prompt, config) {
  const model = config.model || 'llama-3.3-70b-versatile'
  const url = 'https://api.groq.com/openai/v1/chat/completions'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an emergency OPD clinical triage AI. Always respond with pure JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    }),
    signal: AbortSignal.timeout(6000)
  })

  if (!res.ok) {
    throw new Error(`Groq API error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return parseLLMJson(content)
}

/**
 * Call OpenAI API or OpenAI-Compatible Custom Endpoint (e.g. Ollama / Local Server)
 */
async function callOpenAICompatible(prompt, config) {
  const isCustom = config.provider === 'custom'
  const url = isCustom && config.endpoint
    ? config.endpoint
    : 'https://api.openai.com/v1/chat/completions'

  const headers = { 'Content-Type': 'application/json' }
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  const model = config.model || (isCustom ? 'llama3' : 'gpt-4o-mini')

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an emergency OPD clinical triage AI. Output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    }),
    signal: AbortSignal.timeout(6500)
  })

  if (!res.ok) {
    throw new Error(`LLM API error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return parseLLMJson(content)
}

/**
 * Safely parse JSON from LLM string output
 */
function parseLLMJson(rawText) {
  if (!rawText) return null
  let cleaned = rawText.trim()

  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim()
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim()
  }

  const parsed = JSON.parse(cleaned)
  // Handle case where LLM wraps array in an object like { "questions": [...] }
  if (Array.isArray(parsed)) return parsed
  if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions
  if (parsed.data && Array.isArray(parsed.data)) return parsed.data
  return null
}

/**
 * Asynchronously generates questions with the active LLM (Gemini / Groq / OpenAI / Custom)
 * with automatic fallback to the clinical ontology engine.
 */
export async function generateQuestionsWithLLM(complaintText = '', lang = 'en') {
  if (!complaintText) {
    return generateFollowUpQuestions('other', complaintText, lang)
  }

  // Check cache first
  const cached = getCachedQuestions(complaintText)
  if (cached && cached.length > 0) {
    return cached
  }

  const config = getLLMConfig()

  // If set to offline or missing required key for cloud providers, use clinical ontology
  if (config.provider === 'clinical_offline' || (!config.apiKey && config.provider !== 'custom')) {
    const offlineQuestions = generateFollowUpQuestions('other', complaintText, lang)
    cacheQuestions(complaintText, offlineQuestions)
    return offlineQuestions
  }

  try {
    const prompt = buildClinicalPrompt(complaintText, lang)
    let questions = null

    if (config.provider === 'gemini') {
      questions = await callGemini(prompt, config)
    } else if (config.provider === 'groq') {
      questions = await callGroq(prompt, config)
    } else if (config.provider === 'openai' || config.provider === 'custom') {
      questions = await callOpenAICompatible(prompt, config)
    }

    if (Array.isArray(questions) && questions.length > 0) {
      // Validate questions structure
      const validated = questions.map((q, idx) => ({
        id: q.id || `ai_q_${idx + 1}`,
        question: q.question || 'Describe your symptoms further',
        questionHi: q.questionHi || q.question,
        questions: q.questions || { hi: q.questionHi || q.question },
        type: q.type || 'text',
        options: Array.isArray(q.options) ? q.options : undefined,
        min: q.min,
        max: q.max,
        category: q.category || 'chief_complaint'
      }))

      cacheQuestions(complaintText, validated)
      return validated
    }
  } catch (err) {
    console.warn(`[ArogyaDarpan LLM Generator] ${config.provider} call failed, falling back to clinical ontology:`, err)
  }

  // Fallback to deterministic clinical ontology engine
  const fallbackQuestions = generateFollowUpQuestions('other', complaintText, lang)
  cacheQuestions(complaintText, fallbackQuestions)
  return fallbackQuestions
}

/**
 * Main AI / Clinical Question Generator Entrypoint
 * Intelligently analyzes any complaint keyword, checking cache first,
 * matching clinical ontology domains, or generating personalized SOCRATES questions.
 *
 * @param {string} complaintId - e.g. 'joint_pain', 'knee_pain', or 'other'
 * @param {string} customText - freely typed complaint by the user
 * @param {string} lang - current selected language ('hi', 'en', etc.)
 * @returns {Array<Object>} list of clinical questions
 */
export function generateFollowUpQuestions(complaintId = '', customText = '', lang = 'en') {
  // Check if questions were already cached by LLM
  if (customText) {
    const cached = getCachedQuestions(customText)
    if (cached && cached.length > 0) {
      return cached
    }
  }

  const searchText = `${complaintId} ${customText}`.toLowerCase().trim()

  // Match against clinical domains
  for (const [key, domain] of Object.entries(CLINICAL_DOMAINS)) {
    if (complaintId === key || domain.matchKeywords.some(kw => searchText.includes(kw))) {
      return domain.questions
    }
  }

  // If no predefined domain matches, synthesize personalized questions
  return generatePersonalizedGenericQuestions(customText || complaintId || 'Chief Complaint', lang)
}

