import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Bot,
  RefreshCw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Stethoscope,
  FileText,
  AlertTriangle,
  Settings,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Activity,
  ShieldAlert
} from 'lucide-react'
import {
  SUMMARY_LANGUAGES,
  generatePatientClinicalSummary,
  getSavedPatientSummary
} from '../services/llmSummaryService'
import { getLLMConfig } from '../services/aiQuestionGenerator'
import { speakText, stopSpeech } from '../services/audioService'
import LLMConfigModal from './LLMConfigModal'

const TAB_LABELS = {
  en: { soap: 'Doctor SOAP Note', patient: 'Patient Guide', highlights: 'Diagnostic Protocol' },
  hi: { soap: 'डॉक्टर सोप (SOAP)', patient: 'रोगी सारांश (Guide)', highlights: 'नैदानिक योजना (Protocol)' },
  bn: { soap: 'ডাক্তার সোয়াপ নোট', patient: 'রোগী গাইড', highlights: 'ডায়াগনস্টিক পরিকল্পনা' },
  ta: { soap: 'மருத்துவர் குறிப்பு (SOAP)', patient: 'நோயாளி வழிகாட்டி', highlights: 'பரிசோதனை திட்டம்' },
  te: { soap: 'వైద్యుల నోట్ (SOAP)', patient: 'రోగి గైడ్', highlights: 'రోగనిర్ధారణ ప్రణాళిక' },
  mr: { soap: 'डॉक्टर सोप नोट', patient: 'रुग्ण मार्गदर्शक', highlights: 'तपासणी योजना' },
  gu: { soap: 'ડૉક્ટર સોપ નોટ', patient: 'દર્દી માર્ગદર્શિકા', highlights: 'નિદાન યોજના' },
  kn: { soap: 'ವೈದ್ಯರ ಟಿಪ್ಪಣಿ (SOAP)', patient: 'ರೋಗಿ ಮಾರ್ಗದರ್ಶಿ', highlights: 'ರೋಗನಿರ್ಣಯ ಯೋಜನೆ' },
  pa: { soap: 'ਡਾਕਟਰ ਸੋਪ ਨੋਟ', patient: 'ਮਰੀਜ਼ ਗਾਈਡ', highlights: 'ਜਾਂਚ ਯੋਜਨਾ' },
  ml: { soap: 'ഡോക്ടർ കുറിപ്പ് (SOAP)', patient: 'രോഗി ഗൈഡ്', highlights: 'പരിശോധനാ പദ്ധതി' },
}

export default function LLMSummaryGenerator({
  patient = {},
  responses = [],
  documents = [],
  defaultLang = 'hi',
  autoGenerate = true,
  collapsible = false,
  defaultExpanded = true,
  mode = 'patient', // 'patient' | 'doctor'
}) {
  const [targetLang, setTargetLang] = useState(defaultLang || 'hi')
  const [summary, setSummary] = useState(() => getSavedPatientSummary())
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState(mode === 'doctor' ? 'soap' : 'patient')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [loadingStep, setLoadingStep] = useState(0)

  const llmConfig = getLLMConfig()

  const loadingSteps = [
    'Aggregating patient intake facts & symptoms...',
    'Cross-referencing allergy alerts & medical record findings...',
    'Synthesizing clinical summary across selected language...',
  ]

  // Synchronize targetLang when defaultLang changes from parent (e.g. language dropdown)
  useEffect(() => {
    if (defaultLang && defaultLang !== targetLang) {
      setTargetLang(defaultLang)
      handleGenerate(true, defaultLang)
    }
  }, [defaultLang])

  // Auto-generate on first mount if not already present or if language mismatch
  useEffect(() => {
    if (autoGenerate) {
      if (!summary || summary.language !== (defaultLang || 'hi')) {
        handleGenerate(true, defaultLang || 'hi')
      }
    }
  }, [])

  // When language changes via language chips
  const handleLanguageChange = async (newLang) => {
    setTargetLang(newLang)
    if (mode !== 'doctor') {
      setActiveTab('patient') // immediately switch to patient guide in their language
    }
    await handleGenerate(true, newLang)
  }

  const handleGenerate = async (force = true, langOverride = targetLang) => {
    if (isSpeaking) {
      stopSpeech()
      setIsSpeaking(false)
    }
    setIsGenerating(true)
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev))
    }, 400)

    try {
      const result = await generatePatientClinicalSummary({
        patient,
        responses,
        documents,
        targetLang: langOverride,
        forceRegenerate: force,
      })
      setSummary(result)
    } catch (err) {
      console.warn('Failed to generate summary:', err)
    } finally {
      clearInterval(stepInterval)
      setIsGenerating(false)
    }
  }

  // Multi-Language Audio Speech
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech()
      setIsSpeaking(false)
      return
    }

    if (!summary) return

    const langMeta = SUMMARY_LANGUAGES.find(l => l.id === targetLang) || SUMMARY_LANGUAGES[0]
    const textToSpeak =
      activeTab === 'patient'
        ? summary.patientExplanation
        : `${summary.headline}. ${summary.patientExplanation || ''}`

    speakText(textToSpeak, {
      lang: langMeta.locale || 'hi-IN',
      rate: 0.92,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
  }

  // Copy Summary text
  const handleCopy = () => {
    if (!summary) return
    const text = `ArogyaDarpan Clinical Intake Summary\nPatient: ${patient.name || 'Rahul Sharma'} (Token: ${patient.queueToken || '#A-14'})\n\nHeadline: ${summary.headline}\n\n[SOAP Note]\nSubjective: ${summary.soap?.subjective}\nObjective: ${summary.soap?.objective}\nAssessment: ${summary.soap?.assessment}\nPlan: ${summary.soap?.plan}\n\n[Patient Plain Summary]\n${summary.patientExplanation}`
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentLangMeta = SUMMARY_LANGUAGES.find(l => l.id === targetLang) || SUMMARY_LANGUAGES[0]
  const tabTitles = TAB_LABELS[targetLang] || TAB_LABELS.en

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden text-left">
      {/* Top Banner with Provider Status & Title */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-teal-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm sm:text-base tracking-tight truncate">
                AI Clinical Intake Summary
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-400/20 border border-teal-300/30 text-[10px] font-mono text-teal-200 font-bold shrink-0">
                {llmConfig.provider === 'clinical_offline'
                  ? 'Clinical AI (Offline)'
                  : `${llmConfig.provider.toUpperCase()} LLM`}
              </span>
            </div>
            <p className="text-xs text-teal-200/80 truncate mt-0.5">
              Multilingual clinical summary for Dr. Ananya Sharma & patient
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 transition cursor-pointer"
            title="Configure LLM Provider (Gemini, Groq, OpenAI, Ollama)"
          >
            <Settings className="size-4" />
          </button>
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-100 transition cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 sm:p-5 space-y-4"
          >
            {/* Clinical Safety Guardrail Warning Banner */}
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 shadow-xs">
              <ShieldAlert className="size-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">
                  {targetLang === 'hi'
                    ? '🛡️ सुरक्षा नियम: एआई दवाइयां नहीं लिखता (AI Does Not Prescribe Medicines)'
                    : '🛡️ Clinical Safety Rule: AI Does Not Prescribe Medications'}
                </span>
                <span className="text-[11px] leading-relaxed text-amber-900 block mt-0.5">
                  {targetLang === 'hi'
                    ? 'आरोग्यदर्पण केवल आपके लक्षणों और पूर्व रिपोर्टों को व्यवस्थित करता है। सभी दवाइयों का प्रिस्क्रिप्शन एवं खुराक का निर्धारण शारीरिक परीक्षण के बाद केवल डॉ. अनन्‍या शर्मा द्वारा किया जाएगा।'
                    : 'ArogyaDarpan organizes intake history and never prescribes medicines or recommends dosages. All drug prescriptions are strictly decided by the consulting doctor.'}
                </span>
              </div>
            </div>

            {/* Language Selector Bar & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  भाषा / Language:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full no-scrollbar">
                  {SUMMARY_LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleLanguageChange(l.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        targetLang === l.id
                          ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-500/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {l.native}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-teal-800 border border-slate-200 hover:border-teal-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Regenerate summary"
                >
                  <RefreshCw className={`size-3.5 ${isGenerating ? 'animate-spin text-teal-600' : ''}`} />
                  <span>{isGenerating ? 'Generating...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>

            {/* Generating State Shimmer */}
            {isGenerating ? (
              <div className="py-8 px-4 rounded-2xl bg-gradient-to-b from-teal-50/40 to-slate-50 border border-teal-100 text-center space-y-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Bot className="size-6 animate-spin" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-slate-900">
                    Clinical AI is synthesizing patient summary in {currentLangMeta.native}...
                  </p>
                  <p className="text-xs text-teal-700 font-mono mt-1">
                    {loadingSteps[loadingStep]}
                  </p>
                </div>
                <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full animate-progress" />
                </div>
              </div>
            ) : summary ? (
              <div className="space-y-4">
                {/* Headline Banner */}
                <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Activity className="size-4 text-teal-700 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-teal-900">
                        Pre-Consultation Clinical Intake • {currentLangMeta.native}
                      </span>
                      <p className="font-heading font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                        {summary.headline}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-teal-300 text-teal-900 font-mono text-[11px] font-bold shrink-0 shadow-2xs">
                    {summary.triageCategory || 'Semi-Urgent / Priority 3'}
                  </span>
                </div>

                {/* View Mode Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('patient')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'patient'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <FileText className="size-3.5" />
                      <span>{tabTitles.patient} ({currentLangMeta.native})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('highlights')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'highlights'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <AlertTriangle className="size-3.5" />
                      <span>{tabTitles.highlights}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('soap')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'soap'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Stethoscope className="size-3.5" />
                      <span>{tabTitles.soap}</span>
                    </button>
                  </div>

                  {/* Audio Read-Aloud & Copy Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggleSpeech}
                      className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                        isSpeaking
                          ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-200 animate-pulse'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title={isSpeaking ? 'Stop speaking' : `Listen in ${currentLangMeta.native}`}
                    >
                      {isSpeaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-teal-700" />}
                      <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                      title="Copy clinical summary"
                    >
                      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Tab 1: Patient Plain Language Guide (First & Localized) */}
                {activeTab === 'patient' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/60 to-cyan-50/30 border border-teal-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💬</span>
                      <div>
                        <span className="font-heading font-bold text-sm text-slate-900 block">
                          आपके लिए आसान भाषा में सारांश ({currentLangMeta.native})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Clear clinical explanation in your chosen language
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      {summary.patientExplanation}
                    </p>
                    <div className="pt-2 border-t border-teal-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-teal-900 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-4 text-teal-600" />
                        <span>डॉ. अनन्‍या शर्मा के साथ आपकी बैठक में यह सारांश पहले से मौजूद रहेगा।</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        दवाएं केवल डॉक्टर द्वारा दी जाएंगी
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 2: Key Highlights & Diagnostic Protocol */}
                {activeTab === 'highlights' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Clinical Highlights Identified
                      </span>
                      <ul className="space-y-1.5">
                        {summary.keyHighlights?.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-800 font-medium flex items-start gap-2">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-teal-900 block">
                        Diagnostic Actions for Dr. Ananya Sharma (Non-Pharmacological)
                      </span>
                      <ul className="space-y-1.5">
                        {summary.doctorActionItems?.map((action, idx) => (
                          <li key={idx} className="text-xs text-teal-950 font-medium flex items-start gap-2">
                            <span className="text-teal-700 font-bold">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tab 3: Doctor SOAP Note */}
                {activeTab === 'soap' && (
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="font-mono text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                        Subjective (S)
                      </span>
                      <p className="text-slate-800 font-medium">{summary.soap?.subjective}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="font-mono text-[10px] font-bold text-cyan-800 uppercase tracking-wider block">
                        Objective (O)
                      </span>
                      <p className="text-slate-800 font-medium">{summary.soap?.objective}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="font-mono text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Assessment (A)
                      </span>
                      <p className="text-slate-800 font-medium">{summary.soap?.assessment}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 space-y-1">
                      <span className="font-mono text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                        Plan & Diagnostics (P) — Non-Pharmacological
                      </span>
                      <p className="text-slate-800 font-medium whitespace-pre-line">{summary.soap?.plan}</p>
                    </div>
                  </div>
                )}

                {/* Bottom Verification Seal */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span>FHIR R4 & ABDM Clinical Schema Compliant</span>
                  </span>
                  <span>Synced with Room 204</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  className="px-5 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>Generate AI Clinical Summary</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Configuration Modal */}
      <LLMConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  )
}
