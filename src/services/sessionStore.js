// ============================
// ArogyaDarpan — Dynamic Session Data Store
// Manages live patient session responses, OCR extractions, and timeline construction
// ============================

import { DEMO_PATIENTS, getDemoPatient } from '../data/demoPatients.js'

const CLINICAL_LABEL_MAP = {
  // Complaints
  chest_pain: 'Chest Pain',
  fever: 'Fever',
  cough: 'Cough',
  stomach_pain: 'Abdominal Pain',
  headache: 'Headache',
  back_pain: 'Back Pain',
  breathing: 'Breathing Difficulty',
  other: 'General Health Complaint',

  // Onset & Durations
  gradual_1day: '1 day ago (Gradual onset)',
  sudden_today: 'Today (Sudden onset)',
  '2_3_days': '2-3 days ago',
  '1_2_days': '1-2 days ago',
  '3_5_days': '3-5 days ago',
  '1_week': 'About 1 week ago',
  today: 'Today',
  '1_day': 'Yesterday',
  more: 'More than a week ago',
  chronic: 'Ongoing for weeks / Chronic',

  // Sites
  center: 'Center of chest (Substernal)',
  left: 'Left side of chest',
  right: 'Right side of chest',
  diffuse: 'Entire chest area',
  upper_center: 'Upper center abdomen (Epigastric)',
  upper_right: 'Upper right abdomen (Right Hypochondrium)',
  around_navel: 'Around navel (Periumbilical)',
  lower_right: 'Lower right abdomen (RIF)',
  lower_left: 'Lower left abdomen (LIF)',

  // Character
  squeezing: 'Heavy / Squeezing pressure (Dull pressure)',
  sharp: 'Sharp / Stabbing pain',
  burning: 'Burning sensation / Acidity',
  throbbing: 'Throbbing / Pulsating',
  cramping: 'Cramping / Colicky',
  dull_ache: 'Dull constant ache',

  // Radiation
  left_arm: 'Radiates to left arm & shoulder',
  jaw_neck: 'Radiates to jaw & neck',
  back: 'Radiates to back',
  none: 'No radiation (localized)',

  // Associations & Symptoms
  breathlessness: 'Shortness of breath (Dyspnea)',
  sweating: 'Profuse sweating (Diaphoresis)',
  nausea: 'Nausea / Vomiting',
  dizziness: 'Dizziness / Lightheadedness',
  headache: 'Headache',
  body_ache: 'Body ache & Joint stiffness',
  rash: 'Skin rash',
  vomiting: 'Vomiting',
  loose_stools: 'Loose stools / Diarrhea',
  burning_urine: 'Burning urination (Dysuria)',
  constipation: 'Constipation',
  blood_stool: 'Blood in stool',
  bloating: 'Bloating / Gas',

  // Patterns & Modifiers
  constant: 'Constant / Continuous',
  episodic: 'Episodic / Comes in waves',
  exertional: 'Triggered by walking / physical exertion',
  exertion_worse: 'Worse with exertion / climbing stairs',
  respiration_worse: 'Worse with deep breath or coughing',
  rest_better: 'Better with rest',
  antacid_better: 'Better with antacids',
  worse_after_meal: 'Worse after eating',
  better_after_meal: 'Better after eating',
  worse_empty_stomach: 'Worse on empty stomach',
  no_relation: 'No clear relation to meals',

  // Grades
  low_grade: 'Low grade (99-100°F)',
  moderate: 'Moderate (100-102°F)',
  high: 'High (102-104°F)',
  very_high: 'Very High (>104°F with rigors)',
  continuous: 'Continuous / Always present',
  intermittent: 'Comes and goes (Intermittent)',
  evening_rise: 'Rises in evening / night',
  with_chills: 'With shaking chills (Rigors)',

  // Medical History
  diabetes: 'Type 2 Diabetes Mellitus',
  hypertension: 'Essential Hypertension (High BP)',
  heart_disease: 'Coronary Artery Disease',
  asthma: 'Asthma / COPD',
  thyroid: 'Hypothyroidism',
  cancer: 'Cancer history',
  stroke: 'Stroke / Cerebrovascular Disease',

  // Social / Habits
  never: 'Never',
  current: 'Currently active',
  quit_recent: 'Quit within last 2 years',
  quit_long: 'Quit >2 years ago (Ex-smoker)',
  occasional: 'Occasional (social use)',
  regular: 'Regular use',
  quit: 'Quit',
  yes: 'Yes',
  no: 'No',
}

/**
 * Format any clinical enum / value into human readable text
 */
export function formatClinicalValue(val) {
  if (val === null || val === undefined) return 'Not reported'
  if (Array.isArray(val)) {
    return val.map(item => CLINICAL_LABEL_MAP[item] || String(item).replace(/_/g, ' ')).join(', ')
  }
  if (typeof val === 'string') {
    return CLINICAL_LABEL_MAP[val] || val.replace(/_/g, ' ')
  }
  return String(val)
}

/**
 * Check whether a patient is currently authenticated / checked in
 */
export function isAuthenticated() {
  try {
    const stored = localStorage.getItem('arogya_patient')
    if (stored) {
      const parsed = JSON.parse(stored)
      return Boolean(parsed && parsed.name && (parsed.isAuthenticated || parsed.patientId))
    }
  } catch (e) {
    console.warn('Auth check error:', e)
  }
  return false
}

/**
 * Start a brand new, isolated patient session.
 * Crucial: Wipes previous session data (responses, documents, triage, interview state)
 * so that details from a prior patient NEVER bleed into the new patient!
 */
export function startNewPatientSession(patientRecord) {
  try {
    clearPatientSession()
    const patientId = patientRecord.patientId || generatePatientId()
    const sessionPatient = {
      ...patientRecord,
      patientId,
      isAuthenticated: true,
      registeredAt: patientRecord.registeredAt || new Date().toISOString(),
      consultationStatus: 'in_progress',
    }
    localStorage.setItem('arogya_patient', JSON.stringify(sessionPatient))
    saveRegisteredPatient(sessionPatient)
    return sessionPatient
  } catch (e) {
    console.warn('Start patient session error:', e)
    return patientRecord
  }
}

/**
 * Log in a patient and store active session credentials
 */
export function loginPatient(patientRecord) {
  try {
    // If switching to another patient, clear prior intake session data
    const current = localStorage.getItem('arogya_patient')
    if (current) {
      try {
        const parsed = JSON.parse(current)
        if (parsed.patientId && parsed.patientId !== patientRecord.patientId) {
          clearPatientSession()
        }
      } catch { /* ignore */ }
    }
    const sessionPatient = {
      ...patientRecord,
      isAuthenticated: true,
      loggedInAt: new Date().toISOString()
    }
    localStorage.setItem('arogya_patient', JSON.stringify(sessionPatient))
    // Also save to registry if not already present
    saveRegisteredPatient(sessionPatient)
    return sessionPatient
  } catch (e) {
    console.warn('Login error:', e)
    return patientRecord
  }
}

/**
 * Log out current patient session cleanly
 */
export function logoutPatient() {
  try {
    localStorage.removeItem('arogya_patient')
    localStorage.removeItem('arogya_responses')
    localStorage.removeItem('arogya_interview_state')
    localStorage.removeItem('arogya_documents')
  } catch (e) {
    console.warn('Logout error:', e)
  }
}

/**
 * Retrieve active patient profile (from localStorage or demo fallback)
 */
export function getActivePatient() {
  try {
    const stored = localStorage.getItem('arogya_patient')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && parsed.name) return parsed
    }
  } catch (e) {
    console.warn('Session store error:', e)
  }
  return getDemoPatient('demo-001')
}

/**
 * Retrieve active patient responses
 */
export function getActiveResponses() {
  try {
    const stored = localStorage.getItem('arogya_responses')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('Response store error:', e)
  }
  return []
}

/**
 * Retrieve active uploaded documents & OCR extractions
 */
export function getActiveDocuments() {
  try {
    const stored = localStorage.getItem('arogya_documents')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('Document store error:', e)
  }
  return []
}

/**
 * Generate a unique Patient ID (e.g. AD-2026-84920)
 */
export function generatePatientId() {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(10000 + Math.random() * 90000)
  return `AD-${year}-${randomNum}`
}

export const INITIAL_REGISTERED_PATIENTS = [
  {
    patientId: 'AD-2026-10492',
    name: 'Rahul Sharma',
    age: '46',
    dob: '1980-04-15',
    gender: 'Male',
    phone: '9876543210',
    abhaId: 'ABHA-1234-5678',
    bloodGroup: 'B+',
    address: 'B-14, Model Town, Jaipur, Rajasthan',
    pincode: '302015',
    emergencyContact: 'Sunita Sharma (Wife)',
    emergencyPhone: '9876543211',
    relationship: 'Spouse',
    pastMedicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    pastSurgicalHistory: ['Appendectomy (2018)'],
    knownAllergies: ['Penicillin'],
  },
  {
    patientId: 'AD-2026-29481',
    name: 'Sunita Devi',
    age: '54',
    dob: '1972-08-22',
    gender: 'Female',
    phone: '9811223344',
    abhaId: 'ABHA-5678-9012',
    bloodGroup: 'O+',
    address: 'Flat 402, Green Valley Apartments, Delhi',
    pincode: '110001',
    emergencyContact: 'Rajesh Kumar (Son)',
    emergencyPhone: '9811223345',
    relationship: 'Child',
    pastMedicalHistory: ['Hypothyroidism', 'Asthma'],
    pastSurgicalHistory: ['Cholecystectomy (Gallbladder, 2021)'],
    knownAllergies: ['Sulfa drugs'],
  },
  {
    patientId: 'AD-2026-38290',
    name: 'Ramesh Patel',
    age: '62',
    dob: '1964-11-03',
    gender: 'Male',
    phone: '9723456789',
    abhaId: 'ABHA-9012-3456',
    bloodGroup: 'A+',
    address: '12, Shanti Nagar, Ahmedabad, Gujarat',
    pincode: '380009',
    emergencyContact: 'Meena Patel (Wife)',
    emergencyPhone: '9723456780',
    relationship: 'Spouse',
    pastMedicalHistory: ['Coronary Artery Disease', 'Hypertension'],
    pastSurgicalHistory: ['Cardiac Stent / Angioplasty (2020)'],
    knownAllergies: ['No known drug allergies'],
  },
  {
    patientId: 'AD-2026-47123',
    name: 'Priya Nair',
    age: '29',
    dob: '1997-02-18',
    gender: 'Female',
    phone: '9447123456',
    abhaId: 'ABHA-3456-7890',
    bloodGroup: 'AB+',
    address: 'Kalyan Nagar, Kochi, Kerala',
    pincode: '682016',
    emergencyContact: 'Suresh Nair (Father)',
    emergencyPhone: '9447123450',
    relationship: 'Father',
    pastMedicalHistory: ['None'],
    pastSurgicalHistory: ['None'],
    knownAllergies: ['Dust / Pollen'],
  }
]

/**
 * Retrieve registered patient registry from localStorage or initial seed
 */
export function getRegisteredPatients() {
  try {
    const stored = localStorage.getItem('arogya_registered_patients')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('Patient registry error:', e)
  }
  return INITIAL_REGISTERED_PATIENTS
}

/**
 * Save / update a patient in the registry
 */
export function saveRegisteredPatient(patientData) {
  const currentList = getRegisteredPatients()
  const patientId = patientData.patientId || generatePatientId()
  const fullProfile = {
    ...patientData,
    patientId,
    updatedAt: new Date().toISOString()
  }

  const existingIdx = currentList.findIndex(
    p => p.patientId === patientId || (p.phone && p.phone === fullProfile.phone)
  )

  let updatedList
  if (existingIdx >= 0) {
    updatedList = [...currentList]
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...fullProfile }
  } else {
    updatedList = [fullProfile, ...currentList]
  }

  try {
    localStorage.setItem('arogya_registered_patients', JSON.stringify(updatedList))
  } catch (e) {
    console.warn('Could not save patient registry:', e)
  }

  return fullProfile
}

/**
 * Find patient by phone, patient ID, or ABHA ID
 */
export function findPatientByIdentifier(query) {
  if (!query) return null
  const cleanQuery = String(query).trim().toLowerCase()
  const list = getRegisteredPatients()

  return list.find(p =>
    (p.phone && p.phone.replace(/\D/g, '') === cleanQuery.replace(/\D/g, '')) ||
    (p.patientId && p.patientId.toLowerCase() === cleanQuery) ||
    (p.abhaId && p.abhaId.toLowerCase() === cleanQuery)
  ) || null
}

/**
 * Check whether an active incomplete session exists
 */
export function hasActiveSession() {
  try {
    const patient = localStorage.getItem('arogya_patient')
    const state = localStorage.getItem('arogya_interview_state')
    const responses = localStorage.getItem('arogya_responses')
    return Boolean(patient && (state || responses))
  } catch {
    return false
  }
}

/**
 * Save real-time interview state to localStorage
 */
export function saveActiveInterviewState(state) {
  try {
    localStorage.setItem('arogya_interview_state', JSON.stringify({
      ...state,
      savedAt: new Date().toISOString(),
    }))
  } catch (e) {
    console.warn('Failed to save active interview state:', e)
  }
}

/**
 * Retrieve saved real-time interview state
 */
export function getActiveInterviewState() {
  try {
    const stored = localStorage.getItem('arogya_interview_state')
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.warn('Failed to get interview state:', e)
  }
  return null
}

/**
 * Clear all current session keys cleanly upon completion or exit
 */
export function clearPatientSession() {
  try {
    localStorage.removeItem('arogya_responses')
    localStorage.removeItem('arogya_triage')
    localStorage.removeItem('arogya_documents')
    localStorage.removeItem('arogya_patient')
    localStorage.removeItem('arogya_consent')
    localStorage.removeItem('arogya_interview_state')
  } catch (e) {
    console.warn('Session clear error:', e)
  }
}

/**
 * Update a specific field for a registered patient in the registry
 */
export function updateRegisteredPatientField(patientId, fields) {
  if (!patientId) return
  try {
    const list = getRegisteredPatients()
    const idx = list.findIndex(p => p.patientId === patientId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...fields }
      localStorage.setItem('arogya_registered_patients', JSON.stringify(list))
    }
  } catch (e) {
    console.warn('Failed to update patient field:', e)
  }
}

/**
 * Save active responses partitioned per patient and globally
 */
export function saveActiveResponses(responses, patientId) {
  try {
    localStorage.setItem('arogya_responses', JSON.stringify(responses))
    const currentPatient = getActivePatient()
    const id = patientId || currentPatient?.patientId
    if (id) {
      localStorage.setItem(`arogya_patient_${id}_responses`, JSON.stringify(responses))
      const chiefComplaintResp = responses.find(r => r.questionId === 'chief_complaint')
      const complaintVal = chiefComplaintResp?.structuredValue || chiefComplaintResp?.originalResponse
      updateRegisteredPatientField(id, {
        chiefComplaint: complaintVal || currentPatient.chiefComplaint,
        hasCompletedInterview: true,
        consultationStatus: 'ready_for_review',
        updatedAt: new Date().toISOString(),
      })
    }
  } catch (e) {
    console.warn('Save responses error:', e)
  }
}

/**
 * Save active documents partitioned per patient and globally
 */
export function saveActiveDocuments(documents, patientId) {
  try {
    localStorage.setItem('arogya_documents', JSON.stringify(documents))
    const currentPatient = getActivePatient()
    const id = patientId || currentPatient?.patientId
    if (id) {
      localStorage.setItem(`arogya_patient_${id}_documents`, JSON.stringify(documents))
      updateRegisteredPatientField(id, {
        documentsCount: documents.length,
        updatedAt: new Date().toISOString(),
      })
    }
  } catch (e) {
    console.warn('Save documents error:', e)
  }
}

const HINDI_COMPLAINT_PREVIEWS = {
  'demo-001': 'सीने में भारीपन व तेज़ दर्द (3 दिन से)',
  'demo-002': 'तेज़ बुखार और लगातार सूखी खांसी',
  'demo-003': 'पेट में ऐंठन, मरोड़ और उल्टी की शिकायत',
  'demo-004': 'त्वचा पर लाल चकत्ते और खुजली',
  'chest_pain': 'सीने में तेज़ दर्द और भारी दबाव',
  'fever': 'तेज़ बुखार और ठंड लगना',
  'cough': 'लगातार खांसी और कफ',
  'stomach_pain': 'पेट में गंभीर ऐंठन व दर्द',
  'headache': 'गंभीर सिरदर्द और भारीपन',
  'breathing': 'सांस लेने में तकलीफ़ व घबराहट',
}

export function getHindiComplaintPreview(patientId, complaint) {
  if (patientId && HINDI_COMPLAINT_PREVIEWS[patientId]) {
    return HINDI_COMPLAINT_PREVIEWS[patientId]
  }
  const str = String(complaint || '').toLowerCase()
  for (const [key, val] of Object.entries(HINDI_COMPLAINT_PREVIEWS)) {
    if (str.includes(key) || str.includes(key.replace('_', ' '))) {
      return val
    }
  }
  if (str.includes('chest') || str.includes('heart')) return HINDI_COMPLAINT_PREVIEWS['chest_pain']
  if (str.includes('fever') || str.includes('temp')) return HINDI_COMPLAINT_PREVIEWS['fever']
  if (str.includes('cough')) return HINDI_COMPLAINT_PREVIEWS['cough']
  if (str.includes('stomach') || str.includes('abdom')) return HINDI_COMPLAINT_PREVIEWS['stomach_pain']
  if (str.includes('breath') || str.includes('dyspn')) return HINDI_COMPLAINT_PREVIEWS['breathing']
  if (str.includes('head')) return HINDI_COMPLAINT_PREVIEWS['headache']
  return 'सामान्य नैदानिक परामर्श (Clinical Review)'
}

/**
 * Retrieve all patients for the Doctor Dashboard:
 * Combines newly registered live kiosk patients with demo patients,
 * dynamically generating consultation status, triage priority, symptoms, vitals, summary, and documents.
 */
export function getAllDoctorPatients() {
  const registered = getRegisteredPatients()
  const currentActive = getActivePatient()
  const activeResponses = getActiveResponses()
  const activeDocs = getActiveDocuments()

  const formattedRegistered = registered.map(p => {
    const isCurrent = currentActive && (currentActive.patientId === p.patientId || currentActive.phone === p.phone)
    
    // Retrieve responses for this patient
    let responses = isCurrent && activeResponses.length > 0 ? activeResponses : []
    if (responses.length === 0) {
      try {
        const stored = localStorage.getItem(`arogya_patient_${p.patientId}_responses`)
        if (stored) responses = JSON.parse(stored)
      } catch { /* ignore */ }
    }

    // Retrieve documents for this patient
    let docs = isCurrent && activeDocs.length > 0 ? activeDocs : []
    if (docs.length === 0) {
      try {
        const stored = localStorage.getItem(`arogya_patient_${p.patientId}_documents`)
        if (stored) docs = JSON.parse(stored)
      } catch { /* ignore */ }
    }

    // Retrieve triage for this patient
    let triage = null
    try {
      if (isCurrent) {
        const storedTriage = localStorage.getItem('arogya_triage')
        if (storedTriage) triage = JSON.parse(storedTriage)
      }
    } catch { /* ignore */ }

    // Derive chief complaint text
    const chiefComplaintResp = responses.find(r => r.questionId === 'chief_complaint')
    const rawComplaint = chiefComplaintResp?.structuredValue || chiefComplaintResp?.originalResponse || p.chiefComplaint || 'Clinical Consultation'
    const complaintText = formatClinicalValue(rawComplaint)

    // Derive triage severity
    const triageCategory = triage?.category || (responses.some(r => r.questionId?.includes('severity') && parseInt(r.structuredValue) >= 7) ? 'urgent' : 'routine')
    const isUrgent = triageCategory === 'emergency' || triageCategory === 'urgent'

    // Formulate clinical signals
    const clinicalSignals = []
    if (isUrgent) {
      clinicalSignals.push({
        severity: triageCategory === 'emergency' ? 'critical' : 'high',
        message: 'High Priority Triage Trigger',
        detail: `Patient reported elevated severity for ${complaintText}`,
        source: 'triage',
        status: 'active'
      })
    }
    if (p.knownAllergies && p.knownAllergies.length > 0) {
      clinicalSignals.push({
        severity: 'medium',
        message: `Known Allergy: ${Array.isArray(p.knownAllergies) ? p.knownAllergies.join(', ') : p.knownAllergies}`,
        detail: 'Documented during patient intake/registration.',
        source: 'registration',
        status: 'active'
      })
    }

    // Determine consultation status
    const status = p.consultationStatus || (responses.length > 0 ? 'ready_for_review' : 'in_progress')

    // Formulate realistic vitals based on complaint & priority
    const vitals = isUrgent
      ? { bp: '144/92', hr: '96 bpm', spo2: '96%', temp: '98.8°F', pain: '7/10', status: 'elevated' }
      : { bp: '122/80', hr: '76 bpm', spo2: '99%', temp: '98.4°F', pain: '2/10', status: 'normal' }

    const triageInfo = {
      level: isUrgent ? 2 : 3,
      label: isUrgent ? 'ESI Level 2 — Emergent' : 'ESI Level 3 — Urgent',
      category: isUrgent ? 'emergency' : 'routine',
      badgeColor: isUrgent ? 'rose' : 'teal',
    }

    const hindiPreview = getHindiComplaintPreview(p.patientId, rawComplaint)

    return {
      id: p.patientId,
      patientId: p.patientId,
      name: p.name,
      age: parseInt(p.age) || 35,
      gender: p.gender || 'Other',
      phone: p.phone || '9876543210',
      abhaId: p.abhaId || `ABHA-${p.patientId}`,
      language: p.language || 'en',
      createdAt: p.registeredAt || p.updatedAt || new Date().toISOString(),
      queueToken: p.queueToken || `#A-${String(10 + registered.indexOf(p)).padStart(2, '0')}`,
      chiefComplaint: complaintText,
      hindiComplaint: hindiPreview,
      consultationStatus: status,
      documentsCount: docs.length,
      vitals,
      triage: triageInfo,
      isPriority: isUrgent,
      registeredAtFormatted: p.registeredAt ? new Date(p.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '11:15 AM',
      waitingTimeMinutes: 12,
      consultation: {
        id: `consult-${p.patientId}`,
        department: 'General Medicine',
        chiefComplaint: rawComplaint,
        chiefComplaintText: `${complaintText} (${p.gender}, ${p.age} yrs)`,
        status,
        language: p.language || 'hi',
        consentGiven: true,
        startedAt: p.registeredAt || new Date().toISOString(),
        completedAt: status === 'ready_for_review' ? new Date().toISOString() : null,
      },
      clinicalSignals,
      summary: {
        chiefComplaint: `${complaintText}`,
        hpi: `A ${p.age}-year-old ${p.gender} presents with ${complaintText}. Patient ID: ${p.patientId}. Contact: ${p.phone}.`,
        pastHistory: (p.pastMedicalHistory || []).map(m => ({
          condition: m,
          since: 'Documented',
          source: 'intake',
          verified: true
        })),
        medications: docs.flatMap(d => d.extraction?.extractedData?.medications || []).concat(
          responses.find(r => r.questionId === 'current_medications')?.structuredValue
            ? [{ name: String(responses.find(r => r.questionId === 'current_medications').structuredValue), frequency: 'Regular dose', source: 'interview', confidence: 0.95, verified: true }]
            : []
        ),
        allergies: {
          status: p.knownAllergies ? 'known' : 'unknown',
          currentResponse: Array.isArray(p.knownAllergies) ? p.knownAllergies.join(', ') : (p.knownAllergies || 'None reported'),
          needsReview: false
        },
        investigations: docs.flatMap(d => d.extraction?.extractedData?.investigations || []),
        familyHistory: responses.find(r => r.questionId === 'family_history')?.structuredValue || 'Not reported',
        personalHistory: {},
        generatedAt: new Date().toISOString(),
        verificationStatus: status,
      },
      timeline: buildDynamicTimeline(p, responses, docs),
      documents: docs,
      interviewResponses: responses,
    }
  })

  // Merge registered patients with DEMO_PATIENTS (registered patients first), normalizing demo patients
  const registeredIds = new Set(formattedRegistered.map(p => p.id))
  const remainingDemo = DEMO_PATIENTS.filter(p => !registeredIds.has(p.id)).map((p, idx) => {
    const rawComplaint = p.consultation?.chiefComplaintText || p.summary?.chiefComplaint || formatClinicalValue(p.consultation?.chiefComplaint) || 'Clinical Consultation'
    const docs = p.documents || []
    const signals = p.clinicalSignals || []
    const isPriority = signals.some(s => s.severity === 'critical' || s.severity === 'high') ||
      p.triage?.category === 'emergency' ||
      p.triage?.category === 'urgent' ||
      p.id === 'demo-001'

    const vitals = p.vitals || (
      p.id === 'demo-001'
        ? { bp: '138/88', hr: '88 bpm', spo2: '97%', temp: '98.6°F', pain: '7/10', status: 'elevated' }
        : p.id === 'demo-002'
        ? { bp: '118/76', hr: '84 bpm', spo2: '99%', temp: '101.2°F', pain: '4/10', status: 'febrile' }
        : { bp: '124/80', hr: '74 bpm', spo2: '99%', temp: '98.4°F', pain: '2/10', status: 'normal' }
    )

    const triage = p.triage || (
      isPriority
        ? { level: 2, label: 'ESI Level 2 — Emergent', category: 'emergency', badgeColor: 'rose' }
        : p.id === 'demo-002'
        ? { level: 3, label: 'ESI Level 3 — Urgent', category: 'urgent', badgeColor: 'amber' }
        : { level: 4, label: 'ESI Level 4 — Routine', category: 'routine', badgeColor: 'teal' }
    )

    const consultationStatus = p.consultation?.status || 'ready_for_review'

    return {
      ...p,
      patientId: p.id,
      queueToken: p.queueToken || `#A-${String(14 + idx).padStart(2, '0')}`,
      chiefComplaint: rawComplaint,
      hindiComplaint: getHindiComplaintPreview(p.id, rawComplaint),
      consultationStatus,
      documentsCount: docs.length,
      vitals,
      triage,
      isPriority,
      registeredAtFormatted: `10:${30 + idx * 15} AM`,
      waitingTimeMinutes: 14 + idx * 8,
    }
  })

  return [...formattedRegistered, ...remainingDemo]
}

/**
 * Retrieve patient by ID for PatientDetail screen
 */
export function getPatientById(id) {
  if (!id) return getDemoPatient('demo-001')
  const all = getAllDoctorPatients()
  const match = all.find(p => p.id === id || p.patientId === id)
  if (match) return match
  return getDemoPatient(id) || getDemoPatient('demo-001')
}

/**
 * Dynamically construct medical timeline events for ANY patient session
 */
export function buildDynamicTimeline(customPatient, customResponses, customDocs) {
  const patient = customPatient || getActivePatient()
  const responses = customResponses || getActiveResponses()
  const documents = customDocs || getActiveDocuments()

  const timeline = []
  const currentYear = new Date().getFullYear()

  // 1. Add current visit event from active interview responses (Current Complaint)
  const chiefComplaintResp = responses.find(r => r.questionId === 'chief_complaint')
  const onsetResp = responses.find(r => r.questionId === 'socrates_onset' || r.questionId === 'cp_onset' || r.questionId === 'generic_onset' || r.questionId === 'f_onset' || r.questionId === 'sp_onset')
  const severityResp = responses.find(r => r.questionId.includes('severity'))
  
  const rawComplaint = chiefComplaintResp?.structuredValue || chiefComplaintResp?.originalResponse || 'Clinical Consultation'
  const complaintFormatted = formatClinicalValue(rawComplaint)
  const onsetFormatted = onsetResp ? formatClinicalValue(onsetResp.structuredValue || onsetResp.originalResponse) : 'Recent onset'
  const severityText = severityResp ? ` (Severity: ${severityResp.structuredValue || 5}/10)` : ''

  timeline.push({
    id: 'tl-current',
    date: new Date().toISOString().split('T')[0],
    eventType: 'consultation',
    title: `Current Complaint — ${complaintFormatted.toUpperCase()}`,
    description: `Patient ${patient.name || 'User'} presents with ${complaintFormatted} starting ${onsetFormatted}${severityText}.`,
    sourceResponseId: 'chief_complaint',
    verificationStatus: 'unverified',
  })

  // 2. Synthesize Historical Milestones from Intake Responses (Past Medical, Surgical, Meds)
  const pastMedResp = responses.find(r => r.questionId === 'past_medical')
  if (pastMedResp) {
    const val = pastMedResp.structuredValue
    const conditions = Array.isArray(val) ? val : [val]
    conditions.filter(Boolean).forEach((cond, idx) => {
      // Create historical staggered timeline points (e.g. 2019, 2022)
      const historicalYear = currentYear - (5 - idx * 2)
      timeline.push({
        id: `tl-hist-cond-${idx}`,
        date: `${Math.max(2018, historicalYear)}-04-10`,
        eventType: 'diagnosis',
        title: `${formatClinicalValue(cond)} Diagnosed`,
        description: `Longstanding condition documented during patient intake interview.`,
        verificationStatus: 'patient_confirmed',
      })
    })
  }

  const surgicalResp = responses.find(r => r.questionId === 'past_surgical')
  if (surgicalResp && surgicalResp.structuredValue && surgicalResp.structuredValue !== 'None') {
    timeline.push({
      id: 'tl-hist-surg',
      date: `${currentYear - 2}-08-20`,
      eventType: 'surgery',
      title: `Prior Procedure / Surgery: ${formatClinicalValue(surgicalResp.structuredValue)}`,
      description: `Surgical history recorded during clinical interview.`,
      verificationStatus: 'patient_confirmed',
    })
  }

  // 3. Add events from uploaded OCR documents
  documents.forEach((doc, idx) => {
    const extraction = doc.extraction || {}
    const docDate = extraction.documentDate || doc.documentDate || '2025-05-12'
    const docType = extraction.documentType || doc.category || 'Medical Record'

    // Document Classification Header Event
    timeline.push({
      id: `tl-doc-header-${idx}`,
      date: docDate,
      eventType: 'consultation',
      title: `${docType}: ${doc.fileName || 'Uploaded Record'}`,
      description: `Documented clinical encounter from ${doc.fileName}. Verified date: ${docDate}.`,
      sourceDocumentId: doc.id || `doc-${idx}`,
      verificationStatus: 'patient_confirmed',
    })

    // Diagnoses from document
    if (extraction.extractedData?.diagnosis?.length > 0 || extraction.extractedData?.diagnoses?.length > 0) {
      const diags = extraction.extractedData?.diagnoses || extraction.extractedData?.diagnosis || []
      diags.forEach((diag, dIdx) => {
        timeline.push({
          id: `tl-doc-diag-${idx}-${dIdx}`,
          date: docDate,
          eventType: 'diagnosis',
          title: `Diagnosed: ${typeof diag === 'string' ? diag : diag.name}`,
          description: `Documented in ${doc.fileName || 'Uploaded Record'}`,
          sourceDocumentId: doc.id || `doc-${idx}`,
          verificationStatus: 'patient_confirmed',
        })
      })
    }

    // Procedures from document
    if (extraction.extractedData?.procedures?.length > 0) {
      extraction.extractedData.procedures.forEach((proc, pIdx) => {
        timeline.push({
          id: `tl-doc-proc-${idx}-${pIdx}`,
          date: docDate,
          eventType: 'surgery',
          title: `Clinical Procedure: ${typeof proc === 'string' ? proc : proc.name}`,
          description: `Procedure documented in ${doc.fileName}`,
          sourceDocumentId: doc.id || `doc-${idx}`,
          verificationStatus: 'patient_confirmed',
        })
      })
    }

    // Medications from document
    if (extraction.extractedData?.medications?.length > 0) {
      extraction.extractedData.medications.forEach((med, mIdx) => {
        timeline.push({
          id: `tl-doc-med-${idx}-${mIdx}`,
          date: docDate,
          eventType: 'medication',
          title: `${med.name} ${med.strength || med.dosage || ''} Prescribed`,
          description: `${med.frequency || 'Regular dose'} (${med.duration || 'Ongoing'}) documented in ${doc.fileName}`,
          sourceDocumentId: doc.id || `doc-${idx}`,
          verificationStatus: 'patient_confirmed',
        })
      })
    }

    // Investigations from document
    if (extraction.extractedData?.investigations?.length > 0) {
      extraction.extractedData.investigations.forEach((inv, iIdx) => {
        const isAbnormal = inv.status === 'abnormal' || inv.status === 'critical'
        timeline.push({
          id: `tl-doc-inv-${idx}-${iIdx}`,
          date: docDate,
          eventType: 'investigation',
          title: `${inv.test || inv.name}: ${inv.value} ${inv.unit || ''} ${isAbnormal ? '(Abnormal ' + (inv.direction === 'high' ? '↑' : '↓') + ')' : '(Normal)'}`,
          description: `Lab test result from ${doc.fileName || 'Report'}. Reference Range: ${inv.referenceRange || inv.normalRange || 'Standard'}.`,
          sourceDocumentId: doc.id || `doc-${idx}`,
          verificationStatus: 'patient_confirmed',
        })
      })
    }
  })

  // 4. Fallback to demo timeline only if user has not answered any interview questions and has no documents
  if (timeline.length === 1 && responses.length === 0 && documents.length === 0) {
    const demo = getDemoPatient('demo-001')
    return demo.timeline
  }

  // Deduplicate and sort chronologically descending (newest first)
  const seenTitles = new Set()
  const uniqueTimeline = timeline.filter(item => {
    const key = `${item.date}-${item.title}`
    if (seenTitles.has(key)) return false
    seenTitles.add(key)
    return true
  })

  return uniqueTimeline.sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * Dynamically construct confirmation cards for ConfirmationScreen
 */
export function buildDynamicConfirmationItems() {
  const responses = getActiveResponses()
  const documents = getActiveDocuments()

  if (responses.length === 0 && documents.length === 0) {
    // Fallback to demo Rahul Sharma items
    return [
      { label: 'Main problem', value: 'Chest pain for 3 days', status: 'confirmed' },
      { label: 'Started', value: '3 days ago', status: 'confirmed' },
      { label: 'Severity', value: '7 / 10', status: 'confirmed' },
      { label: 'Breathing difficulty', value: 'Yes', status: 'confirmed' },
      { label: 'Known conditions', value: 'Type 2 Diabetes Mellitus', status: 'confirmed' },
      { label: 'Current medicine', value: 'Metformin 500 mg', status: 'confirmed' },
      { label: 'Drug allergy', value: 'Needs confirmation', status: 'needs_review' },
      { label: 'Family history', value: 'Father had heart disease', status: 'confirmed' },
    ]
  }

  const items = []

  // Chief Complaint
  const complaint = responses.find(r => r.questionId === 'chief_complaint')
  if (complaint) {
    const val = formatClinicalValue(complaint.structuredValue || complaint.originalResponse)
    items.push({ label: 'Main problem', value: val.toUpperCase(), status: 'confirmed' })
  }

  // Onset
  const onset = responses.find(r => r.questionId.includes('onset'))
  if (onset) {
    items.push({ label: 'Started', value: formatClinicalValue(onset.structuredValue || onset.originalResponse), status: 'confirmed' })
  }

  // Severity (strictly clamped 1 - 10)
  const severity = responses.find(r => r.questionId.includes('severity'))
  if (severity) {
    const rawNum = parseInt(severity.structuredValue, 10)
    const clamped = isNaN(rawNum) ? 5 : Math.min(10, Math.max(1, rawNum))
    items.push({ label: 'Severity Score', value: `${clamped} / 10`, status: 'confirmed' })
  }

  // Past Medical Conditions
  const past = responses.find(r => r.questionId === 'past_medical')
  if (past) {
    const val = formatClinicalValue(past.structuredValue || 'None')
    items.push({ label: 'Known conditions', value: val, status: 'confirmed' })
  }

  // Medications
  const meds = responses.find(r => r.questionId === 'current_medications')
  if (meds && meds.structuredValue) {
    items.push({ label: 'Current medicine', value: String(meds.structuredValue), status: 'confirmed' })
  }

  // Allergies
  const allergy = responses.find(r => r.questionId === 'allergies')
  if (allergy) {
    const allergyText = String(allergy.structuredValue || allergy.originalResponse || 'No known allergy')
    const hasConflict = documents.some(d => d.extraction?.extractedData?.allergies?.length > 0)
    items.push({
      label: 'Drug allergy',
      value: hasConflict ? 'Needs confirmation (Conflict with past record)' : allergyText,
      status: hasConflict ? 'needs_review' : 'confirmed',
    })
  }

  // Family History
  const fam = responses.find(r => r.questionId === 'family_history')
  if (fam && fam.structuredValue) {
    items.push({ label: 'Family history', value: formatClinicalValue(fam.structuredValue), status: 'confirmed' })
  }

  // Personal / Habits
  const smoke = responses.find(r => r.questionId === 'smoking_status')
  if (smoke && smoke.structuredValue) {
    items.push({ label: 'Smoking status', value: formatClinicalValue(smoke.structuredValue), status: 'confirmed' })
  }

  return items
}
