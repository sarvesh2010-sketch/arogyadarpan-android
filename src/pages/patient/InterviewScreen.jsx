import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Check,
  CheckCircle2,
  RefreshCw,
  Zap,
  Activity,
  FileText,
  LogOut,
  Play,
  Square,
  Bot,
  Sparkles,
  Settings
} from 'lucide-react'
import StitchAppHeader from '../../components/StitchAppHeader'
import ConversationalVoiceModal from '../../components/ConversationalVoiceModal'
import RedFlagAlertModal from '../../components/RedFlagAlertModal'
import SessionTimeoutModal from '../../components/SessionTimeoutModal'
import ClinicalHistoryFormView from '../../components/ClinicalHistoryFormView'
import TouchNumericKeypad from '../../components/TouchNumericKeypad'
import TouchDatePicker from '../../components/TouchDatePicker'
import LLMConfigModal from '../../components/LLMConfigModal'
import ComplaintVectorIcon from '../../components/ComplaintVectorIcon'
import { useInterview } from '../../hooks/useInterview'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useSessionTimeout } from '../../hooks/useSessionTimeout'
import { useLanguage } from '../../context/LanguageContext'
import { COMPLAINT_OPTIONS, getLocalizedQuestion, getLocalizedOption } from '../../data/questionBank'
import { getLocalizedCategory } from '../../data/translations'
import { clearPatientSession, saveActiveResponses } from '../../services/sessionStore'
import { normalizeVoiceInput } from '../../services/voiceNormalizationEngine'
import { evaluateRedFlags } from '../../services/redFlagRules'
import { speakText, stopSpeech } from '../../services/audioService'
import { getLLMConfig, generateQuestionsWithLLM } from '../../services/aiQuestionGenerator'

const QUICK_COMPLAINT_CHIPS = [
  { id: 'knee_pain', label: 'Joint / Knee Pain', labelHi: 'जोड़ों / घुटने में दर्द' },
  { id: 'skin_rash', label: 'Skin Rash / Allergy', labelHi: 'त्वचा / खुजली / दाने' },
  { id: 'eye_problem', label: 'Eye Problem', labelHi: 'आंखों की समस्या' },
  { id: 'ear_throat', label: 'Ear / Throat Pain', labelHi: 'कान / गले में दर्द' },
  { id: 'urinary', label: 'Urinary Burning', labelHi: 'पेशाब में जलन' },
  { id: 'dizziness', label: 'Dizziness / Weakness', labelHi: 'चक्कर / कमजोरी' },
  { id: 'dental', label: 'Toothache', labelHi: 'दांत में दर्द' },
  { id: 'diabetes', label: 'Sugar / BP Check', labelHi: 'शुगर / बीपी जांच' },
]

export default function InterviewScreen() {
  const navigate = useNavigate()
  const { lang, t, speechLocale } = useLanguage()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showFullForm, setShowFullForm] = useState(false)
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false)
  const [showOtherComplaints, setShowOtherComplaints] = useState(false)
  const [customComplaintInput, setCustomComplaintInput] = useState('')
  const [selectedQuickChip, setSelectedQuickChip] = useState(null)
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false)
  const [showLLMModal, setShowLLMModal] = useState(false)
  const [activeLLMConfig, setActiveLLMConfig] = useState(() => getLLMConfig())
  const [isGeneratingAIQuestions, setIsGeneratingAIQuestions] = useState(false)
  const recordedAudioRef = useRef(null)

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    responses,
    isComplete,
    triageData,
    mode,
    setMode,
    isLowLiteracy,
    submitResponse,
    nextQuestion,
    previousQuestion,
    resetInterview,
  } = useInterview()

  const [textInput, setTextInput] = useState('')
  const [numberInput, setNumberInput] = useState('')
  const [selectedOptions, setSelectedOptions] = useState([])
  const [dropdownValue, setDropdownValue] = useState('')
  const [dateValue, setDateValue] = useState('')

  // Accessible speech rate
  const [speechRate] = useState(isLowLiteracy ? 0.82 : 0.95)

  // Conversational Voice AI Modal & Red-Flag States
  const [showConversationalModal, setShowConversationalModal] = useState(false)
  const [acknowledgedRedFlags, setAcknowledgedRedFlags] = useState([])

  // Evaluate real-time Red Flags across current responses
  const redFlagEvaluation = useMemo(() => {
    return evaluateRedFlags(responses)
  }, [responses])

  const activeRedFlag = redFlagEvaluation.topAlert
  const isRedFlagOpen = Boolean(
    activeRedFlag &&
    activeRedFlag.priority === 'critical' &&
    !acknowledgedRedFlags.includes(activeRedFlag.id)
  )

  // Inactivity Timeout Tracker (3-minute idle kiosk timeout)
  const {
    isWarning: isTimeoutWarning,
    secondsLeft: timeoutSecondsLeft,
    resetTimeout
  } = useSessionTimeout({
    idleMinutes: 3,
    warningSeconds: 30,
    onTimeout: () => {
      clearPatientSession()
      navigate('/patient/language')
    },
    enabled: !isComplete
  })

  const [voiceMatchStatus, setVoiceMatchStatus] = useState(null)

  const handleVoiceResult = useCallback((transcriptText) => {
    setTextInput(prev => (prev ? prev + ' ' + transcriptText : transcriptText).trim())

    if (currentQuestion?.type === 'complaint_select') {
      setCustomComplaintInput(transcriptText)
    }

    if (currentQuestion) {
      const norm = normalizeVoiceInput(transcriptText, currentQuestion)
      if (norm && norm.confidence >= 0.88 && norm.structuredValue !== undefined && norm.matchedOption) {
        setVoiceMatchStatus({
          active: true,
          heard: transcriptText,
          normalized: Array.isArray(norm.structuredValue) ? norm.structuredValue.join(', ') : String(norm.structuredValue),
          explanation: norm.explanation
        })

        if (
          currentQuestion.type === 'yes_no' ||
          currentQuestion.type === 'complaint_select' ||
          currentQuestion.type === 'single_select' ||
          currentQuestion.type === 'dropdown'
        ) {
          submitResponse(currentQuestion.id, transcriptText, norm.structuredValue, 'voice')
          setTimeout(() => {
            setVoiceMatchStatus(null)
            nextQuestion()
          }, 900)
        } else if (currentQuestion.type === 'number') {
          setNumberInput(String(norm.structuredValue))
        } else if (currentQuestion.type === 'multi_select') {
          setSelectedOptions(Array.isArray(norm.structuredValue) ? norm.structuredValue : [norm.structuredValue])
        }
      } else if (currentQuestion.type === 'complaint_select' && transcriptText.trim()) {
        // Freeform complaint spoken without direct option match -> show in other complaints
        setShowOtherComplaints(true)
      }
    }
  }, [currentQuestion, submitResponse, nextQuestion])

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error: voiceError,
    recordedAudioUrl,
    startListening,
    stopListening,
  } = useVoiceInput({
    lang: speechLocale,
    onResult: handleVoiceResult,
  })

  useEffect(() => {
    return () => {
      stopSpeech()
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause()
      }
    }
  }, [])

  // Sync state when question changes
  useEffect(() => {
    stopSpeech()
    setIsSpeaking(false)
    setTextInput('')
    setNumberInput('')
    setSelectedOptions([])
    setDropdownValue('')
    setDateValue('')
    setVoiceMatchStatus(null)
  }, [currentQuestion?.id])

  // Playback recorded audio snippet
  const handleTogglePlayRecordedAudio = () => {
    if (!recordedAudioUrl) return

    if (isPlayingRecordedAudio) {
      recordedAudioRef.current?.pause()
      setIsPlayingRecordedAudio(false)
    } else {
      stopSpeech()
      setIsSpeaking(false)
      const audio = new Audio(recordedAudioUrl)
      recordedAudioRef.current = audio
      audio.onended = () => setIsPlayingRecordedAudio(false)
      audio.onerror = () => setIsPlayingRecordedAudio(false)
      audio.play()
      setIsPlayingRecordedAudio(true)
    }
  }

  // Multi-Language Text-to-Speech (TTS) Read Aloud
  const handleReadAloud = () => {
    if (!currentQuestion) return

    if (isSpeaking) {
      stopSpeech()
      setIsSpeaking(false)
      return
    }

    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause()
      setIsPlayingRecordedAudio(false)
    }

    const questionToSpeak = getLocalizedQuestion(currentQuestion, lang)
    speakText(questionToSpeak, {
      lang: speechLocale,
      rate: speechRate,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
  }

  // Handle Free Conversational Natural Speech AI Intake
  const handleApplyConversationalIntake = (intakeData) => {
    if (!intakeData) return

    if (intakeData.primaryComplaint?.id) {
      submitResponse('chief_complaint', intakeData.rawTranscript, intakeData.primaryComplaint.id, 'voice')
    }
    if (intakeData.duration) {
      submitResponse('socrates_onset', intakeData.duration, intakeData.duration, 'voice')
    }
    if (intakeData.associatedSymptoms && intakeData.associatedSymptoms.length > 0) {
      const symVals = intakeData.associatedSymptoms.map(s => s.id)
      submitResponse('socrates_associations', intakeData.associatedSymptoms.map(s => s.label).join(', '), symVals, 'voice')
    }
    if (intakeData.severity) {
      submitResponse('socrates_severity', String(intakeData.severity), intakeData.severity, 'voice')
    }
    if (intakeData.medications && intakeData.medications.length > 0) {
      const medStr = intakeData.medications.map(m => `${m.medication} ${m.dose || ''}`).join(', ')
      submitResponse('current_medications', medStr, medStr, 'voice')
    }
    if (intakeData.diseases && intakeData.diseases.length > 0) {
      const disList = intakeData.diseases.map(d => d.name)
      submitResponse('past_medical', disList.join(', '), disList, 'voice')
    }

    setShowConversationalModal(false)
    setTimeout(nextQuestion, 500)
  }

  // Auto-save responses to localStorage & sessionStore whenever updated
  useEffect(() => {
    if (responses.length > 0) {
      try {
        saveActiveResponses(responses)
        localStorage.setItem('arogya_triage', JSON.stringify(triageData))
      } catch { /* ignore */ }
    }
  }, [responses, triageData])

  const handleEndSession = () => {
    stopSpeech()
    clearPatientSession()
    navigate('/')
  }

  const handleSelectOption = (value) => {
    if (currentQuestion.type === 'multi_select') {
      setSelectedOptions(prev =>
        prev.includes(value)
          ? prev.filter(v => v !== value)
          : [...prev, value]
      )
    } else {
      submitResponse(currentQuestion.id, '', value, 'touch')
      setTextInput('')
      setNumberInput('')
      setSelectedOptions([])
      setTimeout(nextQuestion, 250)
    }
  }

  const handleSubmitCurrent = () => {
    let value = ''
    if (currentQuestion.type === 'text') value = textInput
    else if (currentQuestion.type === 'number') value = parseInt(numberInput, 10) || numberInput
    else if (currentQuestion.type === 'multi_select') value = selectedOptions
    else if (currentQuestion.type === 'dropdown' || currentQuestion.type === 'select') value = dropdownValue
    else if (currentQuestion.type === 'date') value = dateValue

    submitResponse(currentQuestion.id, textInput || transcript, value, 'touch')
    setTextInput('')
    setNumberInput('')
    setSelectedOptions([])
    setDropdownValue('')
    setDateValue('')
    nextQuestion()
  }

  const handleCustomComplaintSubmit = async (complaintVal) => {
    const finalVal = (complaintVal || customComplaintInput || '').trim()
    if (!finalVal) return

    const config = getLLMConfig()
    if (config.provider !== 'clinical_offline' && (config.apiKey || config.provider === 'custom')) {
      setIsGeneratingAIQuestions(true)
      try {
        await generateQuestionsWithLLM(finalVal, lang)
      } catch (err) {
        console.warn('AI question generation error:', err)
      } finally {
        setIsGeneratingAIQuestions(false)
      }
    }

    submitResponse('chief_complaint', finalVal, finalVal, 'touch')
    setCustomComplaintInput('')
    setSelectedQuickChip(null)
    setTimeout(nextQuestion, 250)
  }

  const handleComplaintSelect = (complaintId) => {
    if (complaintId === 'other') {
      setShowOtherComplaints(true)
      return
    }
    submitResponse('chief_complaint', '', complaintId, 'touch')
    setTextInput('')
    setTimeout(nextQuestion, 250)
  }

  // ──────────────────────────────────────────────
  // Completion Screen (Fully Localized)
  // ──────────────────────────────────────────────
  if (isComplete) {
    const chiefVal = responses.find(r => r.questionId === 'chief_complaint')?.structuredValue || 'General'
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col select-none">
        <StitchAppHeader title="healthInterview" showBack onBack={() => navigate('/')} />

        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-center text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="size-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm"
          >
            <CheckCircle2 className="size-8" />
          </motion.div>

          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">
              {t('complete', 'Intake Completed')}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {t('completeMessage', 'Your health information has been organized and is ready for your doctor.')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-left shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('summary', 'Summary')}</span>
              <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                {responses.length} {t('itemsFound', 'Questions Answered')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">{t('chiefComplaint', 'Chief Complaint')}</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block capitalize">
                  {String(chiefVal).replace(/_/g, ' ')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">{t('clinicalAttention', 'Triage Status')}</span>
                <span className={`text-sm font-bold mt-0.5 block ${triageData?.priority === 'critical' ? 'text-red-600' : 'text-emerald-700'}`}>
                  {triageData?.priority === 'critical' ? `⚠️ ${t('priorityReview', 'Priority Review')}` : `✓ ${t('readyForConsultation', 'Standard Ready')}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={resetInterview}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="size-4" />
              <span>{t('edit', 'Edit Answers')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/patient/documents')}
              className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('uploadDocuments', 'Continue to Documents')}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Graceful fallback if no question is active
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col select-none">
        <StitchAppHeader title="healthInterview" showBack onBack={() => navigate('/')} />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 text-center space-y-4">
          <Activity className="size-10 text-teal-600 mx-auto" />
          <h2 className="font-heading font-bold text-lg text-slate-900">{t('healthInterview', 'Clinical Intake')}</h2>
          <button
            onClick={resetInterview}
            className="px-6 py-2.5 rounded-xl bg-teal-700 text-white font-medium text-sm shadow-sm cursor-pointer"
          >
            {t('startFresh', 'Start Questions')}
          </button>
        </main>
      </div>
    )
  }

  // Dynamic multilingual question text: primary in chosen language, secondary reference in English/Hindi
  const questionText = getLocalizedQuestion(currentQuestion, lang)
  const secondaryQuestionText = lang !== 'en'
    ? currentQuestion.question
    : (currentQuestion.hindi || currentQuestion.questionHi)

  // Localized Category
  const categoryLabel = getLocalizedCategory(currentQuestion.category || currentQuestion.section, lang)

  // Prominent complaints list
  const primaryComplaints = COMPLAINT_OPTIONS.slice(0, 6)
  const otherComplaints = COMPLAINT_OPTIONS.slice(6)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col select-none">
      <StitchAppHeader
        title="healthInterview"
        showBack
        onBack={() => setShowEndSessionConfirm(true)}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Top Progress & Toolbar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                {categoryLabel}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {t('questionOf', 'Question')} {currentIndex + 1} / {totalQuestions}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Conversational Voice AI Trigger */}
              <button
                type="button"
                onClick={() => setShowConversationalModal(true)}
                className="px-2.5 py-1 rounded-full text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="Speak symptoms to Conversational AI"
              >
                <Mic className="size-3 text-teal-700 animate-pulse" />
                <span>{lang === 'hi' ? 'संवादी एआई' : 'Voice AI'}</span>
              </button>

              {/* AYUSH Track switch */}
              <button
                onClick={() => setMode(mode === 'ayush' ? 'allopathic' : 'ayush')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                  mode === 'ayush'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle AYUSH / Allopathic Track"
              >
                <span>{mode === 'ayush' ? t('ayushTrack', '🌿 AYUSH') : t('allopathicTrack', '🩺 Allopathic')}</span>
              </button>

              {/* Full Form toggle */}
              <button
                onClick={() => setShowFullForm(!showFullForm)}
                className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                title="Review all answers"
              >
                <FileText className="size-3.5" />
                <span>{showFullForm ? t('stepView', 'Step View') : t('allAnswers', 'All Answers')}</span>
              </button>
            </div>
          </div>

          {/* Minimalist Progress Bar */}
          <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          {/* FULL FORM VIEW OVERLAY */}
          {showFullForm ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 max-h-[70vh] overflow-y-auto">
              <ClinicalHistoryFormView
                responses={responses}
                onUpdateResponse={(qId, val) => submitResponse(qId, '', val, 'form_edit')}
                onClose={() => setShowFullForm(false)}
              />
            </div>
          ) : (
            /* STEP QUESTION CARD (Fully Localized & Clean) */
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6"
            >
              {/* Question Header & TTS Read Aloud */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading leading-snug">
                    {questionText}
                  </h2>
                  {secondaryQuestionText && secondaryQuestionText !== questionText && (
                    <p className="text-xs sm:text-sm text-slate-500 font-normal">
                      {secondaryQuestionText}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleReadAloud}
                  className={`shrink-0 px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-2xs ${
                    isSpeaking
                      ? 'bg-teal-600 text-white border-teal-600 animate-pulse ring-2 ring-teal-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                  title="Listen to question"
                >
                  {isSpeaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-teal-700" />}
                  <span>{isSpeaking ? t('stop', 'Stop') : t('listen', 'Listen')}</span>
                </button>
              </div>

              {/* ──────────────────────────────────
                  1. COMPLAINT SELECT (Multilingual Grid + Custom Typing)
                  ────────────────────────────────── */}
              {currentQuestion.type === 'complaint_select' && (
                <div className="space-y-3.5">
                  {/* Hero Conversational AI Intake Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setShowConversationalModal(true)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99] border border-teal-600/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-200 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Mic className="size-5 text-teal-300 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-heading font-bold text-xs sm:text-sm text-white">
                            {lang === 'hi' ? 'बोलकर अपने लक्षण बताएं (Conversational Voice AI)' : 'Tell Symptoms with Conversational AI'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-teal-400/20 text-teal-200 border border-teal-400/30 font-mono text-[9px] font-bold uppercase">
                            10 Languages
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-100/80 truncate mt-0.5">
                          {lang === 'hi'
                            ? 'हिन्दी, বাংলা, தமிழ், తెలుగు, मराठी, ગુજરાતી, ಕನ್ನಡ, ਪੰਜਾਬੀ, മലയാളം, English में बोलें'
                            : 'Speak freely in Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Punjabi, Malayalam or English'}
                        </p>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-teal-500/20 group-hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-bold shrink-0 flex items-center gap-1 transition">
                      <Sparkles className="size-3.5 text-teal-300" />
                      <span className="hidden sm:inline">Start Voice</span>
                    </div>
                  </motion.div>

                  {/* Primary 6 Prominent Complaints */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {primaryComplaints.map((opt) => {
                      const nativeLabel = opt.labels && opt.labels[lang] ? opt.labels[lang] : opt.label
                      const subLabel = lang !== 'en' ? opt.label : (opt.labels?.hi || '')

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleComplaintSelect(opt.id)}
                          className="p-3 text-left border border-slate-200/90 rounded-2xl bg-white hover:border-teal-500 hover:bg-teal-50/20 active:scale-[0.98] transition-all cursor-pointer shadow-2xs flex flex-col justify-between h-28 group"
                        >
                          <ComplaintVectorIcon id={opt.id} size="md" />
                          <div className="mt-1">
                            <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight group-hover:text-teal-900 transition-colors">
                              {nativeLabel}
                            </span>
                            {subLabel && subLabel !== nativeLabel && (
                              <span className="block text-[11px] text-slate-500 mt-0.5 font-medium">
                                {subLabel}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Secondary row: Breathing Difficulty & Other Complaints Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* Breathing Difficulty option */}
                    <button
                      type="button"
                      onClick={() => handleComplaintSelect('breathing')}
                      className="p-2.5 text-left border border-slate-200/90 rounded-xl bg-white hover:border-teal-500 hover:bg-teal-50/20 transition cursor-pointer flex items-center gap-2.5 shadow-2xs group"
                    >
                      <ComplaintVectorIcon id="breathing" size="sm" />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-teal-900 transition-colors">
                          {lang === 'hi' ? 'सांस लेने में तकलीफ' : 'Breathing Difficulty'}
                        </span>
                        {lang !== 'en' && (
                          <span className="block text-[10px] text-slate-500 font-medium">Breathing Difficulty</span>
                        )}
                      </div>
                    </button>

                    {/* Toggle Custom Complaint / Other */}
                    <button
                      type="button"
                      onClick={() => setShowOtherComplaints(!showOtherComplaints)}
                      className={`p-2.5 text-left border rounded-xl transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
                        showOtherComplaints
                          ? 'border-teal-600 bg-teal-50/60 text-teal-900 ring-1 ring-teal-500/20'
                          : 'border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/20 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ComplaintVectorIcon id="other" size="sm" />
                        <span className="text-xs font-bold truncate">
                          {showOtherComplaints
                            ? (lang === 'hi' ? 'अन्य शिकायतें छिपाएं' : 'Hide other complaints')
                            : (lang === 'hi' ? '+ अन्य शिकायत (लिखें / बोलें)' : '+ Other Complaints (Type / Speak)')}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-teal-700 shrink-0">
                        {showOtherComplaints ? '−' : '+'}
                      </span>
                    </button>
                  </div>

                  {/* Interactive Custom Complaint Typing & Quick Suggestions Section */}
                  {showOtherComplaints && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-2xl bg-gradient-to-b from-teal-50/60 to-slate-50 border border-teal-200/80 space-y-3 shadow-xs"
                    >
                      {/* Clinical AI & LLM Engine Indicator */}
                      <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-teal-700 animate-pulse" />
                          <span className="text-[11px] font-bold text-teal-950">
                            {lang === 'hi' ? 'एआई ट्राइएज प्रश्न निर्माण' : 'Clinical AI Adaptive Triage'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowLLMModal(true)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-[11px] font-bold text-teal-800 border border-teal-300 shadow-2xs transition cursor-pointer active:scale-95"
                          title="Configure AI Model / LLM"
                        >
                          <Settings className="size-3 text-teal-600" />
                          <span>
                            {activeLLMConfig.provider === 'clinical_offline'
                              ? 'AI: Built-in'
                              : `AI: ${activeLLMConfig.provider.toUpperCase()}`}
                          </span>
                        </button>
                      </div>

                      {/* AI Question Generation Progress Banner */}
                      {isGeneratingAIQuestions && (
                        <div className="p-3 rounded-xl bg-teal-800 text-white flex items-center gap-3 animate-pulse shadow-xs">
                          <Bot className="size-5 text-teal-300 animate-spin shrink-0" />
                          <div className="text-xs">
                            <p className="font-bold">
                              {lang === 'hi' ? 'एआई आपके लक्षणों के अनुसार प्रश्न तैयार कर रहा है...' : 'AI is synthesizing clinical follow-up questions...'}
                            </p>
                            <p className="text-[10px] text-teal-200">SOCRATES Clinical Protocol</p>
                          </div>
                        </div>
                      )}
                      {/* Interactive Typing Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="size-4 text-teal-700" />
                            <span>{lang === 'hi' ? 'अपनी मुख्य समस्या का नाम लिखें:' : 'Type your specific health complaint:'}</span>
                          </label>
                          {customComplaintInput && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomComplaintInput('')
                                setSelectedQuickChip(null)
                              }}
                              className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold"
                            >
                              {t('clear', 'Clear')}
                            </button>
                          )}
                        </div>

                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={customComplaintInput}
                            onChange={(e) => {
                              setCustomComplaintInput(e.target.value)
                              setSelectedQuickChip(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCustomComplaintSubmit()
                            }}
                            placeholder={
                              lang === 'hi'
                                ? 'उदा. घुटने में दर्द, त्वचा पर दाने, कान का दर्द, उल्टी, चक्कर...'
                                : 'e.g., Knee joint pain, skin rash, ear infection, vomiting, dizziness...'
                            }
                            className="w-full pl-3.5 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 shadow-2xs"
                          />

                          <div className="absolute right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={isListening ? stopListening : startListening}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isListening
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'text-slate-400 hover:text-teal-700 hover:bg-slate-100'
                              }`}
                              title="Dictate your complaint"
                            >
                              <Mic className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomComplaintSubmit()}
                              disabled={!customComplaintInput.trim()}
                              className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>{t('continue', 'Next')}</span>
                              <ArrowRight className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Suggestions Chips */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-600 mb-2">
                          {lang === 'hi' ? 'या नीचे दिए गए मुख्य कारणों में से चुनें:' : 'Or choose from common complaints below:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_COMPLAINT_CHIPS.map((chip) => {
                            const chipLabel = lang === 'hi' ? chip.labelHi : chip.label
                            const isSelected = selectedQuickChip === chip.id || customComplaintInput === chipLabel
                            return (
                              <button
                                key={chip.id}
                                type="button"
                                onClick={() => {
                                  setSelectedQuickChip(chip.id)
                                  setCustomComplaintInput(chipLabel)
                                  handleCustomComplaintSubmit(chipLabel)
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                  isSelected
                                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs ring-2 ring-teal-200'
                                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-teal-500 hover:bg-teal-50/40 shadow-2xs'
                                }`}
                              >
                                <ComplaintVectorIcon id={chip.id} size="sm" withBackground={false} />
                                <span>{chipLabel}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────
                  2. SEVERITY / SCALE SLIDER
                  ────────────────────────────────── */}
              {(currentQuestion.type === 'scale' || currentQuestion.id === 'pain_severity' || currentQuestion.id === 'socrates_severity') && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                    <span>1 • {t('mild', 'Mild')}</span>
                    <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
                      {numberInput || '5'} / 10
                    </span>
                    <span>10 • {t('severe', 'Severe')}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={numberInput || 5}
                    onChange={(e) => setNumberInput(e.target.value)}
                    className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    aria-label="Pain severity slider"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectOption(String(Math.min(10, Math.max(1, parseInt(numberInput, 10) || 5))))}
                      className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      {t('confirmSeverity', 'Confirm Severity')} ({Math.min(10, Math.max(1, parseInt(numberInput, 10) || 5))}/10)
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────
                  3. YES / NO BUTTONS
                  ────────────────────────────────── */}
              {currentQuestion.type === 'yes_no' && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center py-2">
                  <button
                    type="button"
                    onClick={() => handleSelectOption('yes')}
                    className="w-full sm:flex-1 py-4 rounded-xl text-center font-bold text-base bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    {t('yes', 'Yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectOption('no')}
                    className="w-full sm:flex-1 py-4 rounded-xl text-center font-bold text-base bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-xs"
                  >
                    {t('no', 'No')}
                  </button>
                </div>
              )}

              {/* ──────────────────────────────────
                  4. SINGLE SELECT OPTIONS
                  ────────────────────────────────── */}
              {currentQuestion.type === 'single_select' && currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((opt) => {
                    const optLabel = getLocalizedOption(opt, lang)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectOption(opt.value)}
                        className="w-full p-3.5 text-left border border-slate-200 rounded-xl bg-white hover:border-teal-600 hover:bg-teal-50/20 transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs"
                      >
                        <span>{optLabel}</span>
                        <ArrowRight className="size-4 text-slate-400" />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ──────────────────────────────────
                  5. MULTI-SELECT OPTIONS
                  ────────────────────────────────── */}
              {currentQuestion.type === 'multi_select' && currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((opt) => {
                    const optLabel = getLocalizedOption(opt, lang)
                    const isSelected = selectedOptions.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectOption(opt.value)}
                        className={`w-full p-3.5 text-left transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold rounded-xl border ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-600 text-teal-900 ring-1 ring-teal-600'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span>{optLabel}</span>
                        <span
                          className={`flex size-5 items-center justify-center rounded-md border ${
                            isSelected ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="size-3.5" />}
                        </span>
                      </button>
                    )
                  })}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSubmitCurrent}
                      disabled={selectedOptions.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      {t('confirm', 'Confirm')} ({selectedOptions.length})
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────
                  6. NUMERIC INPUT
                  ────────────────────────────────── */}
              {(currentQuestion.type === 'number' || currentQuestion.type === 'numeric_touch') && (
                <div className="space-y-3">
                  <TouchNumericKeypad
                    value={numberInput}
                    onChange={setNumberInput}
                    onSubmit={handleSubmitCurrent}
                    label={questionText}
                    unit={currentQuestion.unit || ''}
                  />
                </div>
              )}

              {/* ──────────────────────────────────
                  7. DATE PICKER
                  ────────────────────────────────── */}
              {currentQuestion.type === 'date' && (
                <div className="space-y-3">
                  <TouchDatePicker
                    value={dateValue}
                    onChange={setDateValue}
                    onSubmit={handleSubmitCurrent}
                  />
                </div>
              )}

              {/* ──────────────────────────────────
                  8. TEXT INPUT
                  ────────────────────────────────── */}
              {currentQuestion.type === 'text' && (
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t('speakOrChoose', 'Type details or use the microphone below...')}
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitCurrent}
                      disabled={!textInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      {t('confirm', 'Submit Answer')}
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────
                  INTEGRATED VOICE ASSISTANT & AUDIO PLAYBACK
                  ────────────────────────────────── */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-teal-50/50 via-white to-slate-50 rounded-2xl p-3 sm:p-3.5 border border-teal-100/90 shadow-2xs">
                  <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`size-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
                        isListening
                          ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-md animate-pulse ring-4 ring-rose-100'
                          : 'bg-gradient-to-tr from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-xs'
                      }`}
                      title={isListening ? 'Stop listening' : 'Tap to speak'}
                    >
                      {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold ${isListening ? 'text-rose-700' : 'text-slate-900'}`}>
                          {isListening
                            ? (lang === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now')
                            : t('tapToSpeak', 'Tap to speak')}
                        </p>
                        {isListening && (
                          <span className="inline-flex items-center gap-0.5 ml-1">
                            <span className="w-1 h-3 bg-rose-500 rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-rose-500 rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2 bg-rose-500 rounded-full animate-pulse delay-150" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {transcript || interimTranscript || (lang === 'hi' ? 'अपनी भाषा में बोलें' : 'Speak naturally in your language')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    {/* Replay recorded audio if captured */}
                    {recordedAudioUrl && (
                      <button
                        type="button"
                        onClick={handleTogglePlayRecordedAudio}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition ${
                          isPlayingRecordedAudio
                            ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                        }`}
                        title="Play back your voice answer"
                      >
                        {isPlayingRecordedAudio ? (
                          <Square className="size-3 text-amber-700 fill-amber-700" />
                        ) : (
                          <Play className="size-3 text-teal-700 fill-teal-700" />
                        )}
                        <span className="font-semibold">
                          {isPlayingRecordedAudio ? t('stop', 'Stop') : t('playRecording', 'Play Voice')}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowConversationalModal(true)}
                      className="text-xs font-bold text-teal-800 bg-white hover:bg-teal-50 border border-teal-200/80 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Zap className="size-3.5 text-teal-600" />
                      <span>{t('conversationalAi', 'Voice AI')}</span>
                    </button>
                  </div>
                </div>

                {voiceError === 'microphone_blocked' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <span className="font-bold shrink-0">⚠️</span>
                    <span>Microphone access was blocked. Please check mobile app permissions, or type your complaint above.</span>
                  </div>
                )}

                {voiceMatchStatus && (
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                    <span>Heard: <strong>"{voiceMatchStatus.heard}"</strong> → {voiceMatchStatus.normalized}</span>
                    <span className="text-[11px] text-emerald-700 font-medium">Auto-advancing...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Navigation Controls Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={previousQuestion}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span>{t('previous', 'Back')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                submitResponse(currentQuestion.id, '', null, 'skipped')
                nextQuestion()
              }}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 transition cursor-pointer px-3 py-2"
            >
              {t('skip', 'Skip this question')}
            </button>
          </div>
        </div>
      </main>

      {/* Inactivity Warning Countdown Modal */}
      <SessionTimeoutModal
        isOpen={isTimeoutWarning}
        secondsLeft={timeoutSecondsLeft}
        onStay={resetTimeout}
        onEndSession={handleEndSession}
      />

      {/* Explicit End Session Confirmation Modal */}
      <AnimatePresence>
        {showEndSessionConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl border border-slate-200"
            >
              <div className="size-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <LogOut className="size-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base font-heading mb-1">
                {t('endSession', 'Exit Intake Session?')}
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                {t('endSessionConfirm', 'Are you sure you want to exit? Your responses are saved automatically.')}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEndSessionConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleEndSession}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {t('endSession', 'Yes, Exit')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conversational Voice AI Modal */}
      <ConversationalVoiceModal
        isOpen={showConversationalModal}
        onClose={() => setShowConversationalModal(false)}
        lang={lang}
        onApplyIntake={handleApplyConversationalIntake}
      />

      {/* Critical Red Flag Priority Alert Modal */}
      {isRedFlagOpen && (
        <RedFlagAlertModal
          alert={activeRedFlag}
          onAcknowledge={(alertId) => setAcknowledgedRedFlags(prev => [...prev, alertId])}
        />
      )}

      {/* Clinical AI & LLM Engine Selector Modal */}
      <LLMConfigModal
        isOpen={showLLMModal}
        onClose={() => {
          setShowLLMModal(false)
          setActiveLLMConfig(getLLMConfig())
        }}
      />
    </div>
  )
}
