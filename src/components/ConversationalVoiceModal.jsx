import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Volume2,
  VolumeX,
  Send,
  RefreshCw,
  Stethoscope,
  Activity
} from 'lucide-react'
import { useVoiceInput, SPEECH_LOCALE_MAP } from '../hooks/useVoiceInput'
import {
  parseConversationalIntakeWithAI,
  parseConversationalIntake,
  MULTILINGUAL_GREETINGS
} from '../services/conversationalAiEngine'
import { SUMMARY_LANGUAGES } from '../services/llmSummaryService'
import { speakText, stopSpeech } from '../services/audioService'

export default function ConversationalVoiceModal({
  isOpen,
  onClose,
  lang = 'hi',
  onApplyIntake,
}) {
  const [activeLang, setActiveLang] = useState(lang || 'hi')
  const [currentText, setCurrentText] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [parsedResult, setParsedResult] = useState(null)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isAiParsing, setIsAiParsing] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const chatScrollRef = useRef(null)

  const activeLangMeta = SUMMARY_LANGUAGES.find(l => l.id === activeLang) || SUMMARY_LANGUAGES[1]

  // Voice input hook dynamically tied to activeLang
  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    lang: activeLang,
    continuous: true,
    onResult: async (finalText) => {
      const fullText = (currentText + ' ' + finalText).trim()
      setCurrentText(fullText)
      await handleProcessInput(fullText)
    },
  })

  // Initialize or reset when modal opens or language changes
  useEffect(() => {
    if (isOpen) {
      setCurrentText('')
      setManualInput('')
      setParsedResult(null)
      resetTranscript()

      const greeting = MULTILINGUAL_GREETINGS[activeLang] || MULTILINGUAL_GREETINGS.hi
      setChatHistory([
        {
          sender: 'ai',
          text: greeting,
          time: 'Now',
        }
      ])

      // Start listening after brief mount delay
      const timer = setTimeout(() => {
        startListening()
      }, 400)

      return () => clearTimeout(timer)
    } else {
      stopListening()
      stopSpeech()
      setIsAiSpeaking(false)
    }
  }, [isOpen, activeLang])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatHistory, interimTranscript])

  // Process natural language input (from voice or typing)
  const handleProcessInput = async (inputText) => {
    const textToAnalyze = inputText.trim()
    if (!textToAnalyze || textToAnalyze.length < 3) return

    setIsAiParsing(true)

    // Add user turn to chat if not already present
    setChatHistory(prev => {
      const last = prev[prev.length - 1]
      if (last && last.sender === 'user' && last.text === textToAnalyze) return prev
      return [...prev, { sender: 'user', text: textToAnalyze, time: 'Just now' }]
    })

    try {
      // Parse with AI / NLP across all 10 languages
      const parsed = await parseConversationalIntakeWithAI(textToAnalyze, activeLang)
      setParsedResult(parsed)

      if (parsed?.conversationalReply) {
        setChatHistory(prev => [
          ...prev,
          { sender: 'ai', text: parsed.conversationalReply, time: 'Just now' }
        ])

        // Automatically speak AI reply
        speakText(parsed.conversationalReply, {
          lang: activeLangMeta.locale || 'hi-IN',
          rate: 0.95,
          onStart: () => setIsAiSpeaking(true),
          onEnd: () => setIsAiSpeaking(false),
          onError: () => setIsAiSpeaking(false),
        })
      }
    } catch (err) {
      console.warn('Parsing error:', err)
      // Fallback
      const fallbackParsed = parseConversationalIntake(textToAnalyze, activeLang)
      setParsedResult(fallbackParsed)
    } finally {
      setIsAiParsing(false)
    }
  }

  // Handle manual typed submit
  const handleManualSubmit = async (e) => {
    e?.preventDefault()
    if (!manualInput.trim()) return
    const text = (currentText ? currentText + '. ' : '') + manualInput.trim()
    setCurrentText(text)
    setManualInput('')
    await handleProcessInput(text)
  }

  // Replay AI audio reply
  const handleSpeakReply = () => {
    if (isAiSpeaking) {
      stopSpeech()
      setIsAiSpeaking(false)
      return
    }

    const reply = parsedResult?.conversationalReply || chatHistory[chatHistory.length - 1]?.text
    if (!reply) return

    speakText(reply, {
      lang: activeLangMeta.locale || 'hi-IN',
      rate: 0.95,
      onStart: () => setIsAiSpeaking(true),
      onEnd: () => setIsAiSpeaking(false),
      onError: () => setIsAiSpeaking(false),
    })
  }

  const handleApply = () => {
    if (parsedResult) {
      onApplyIntake?.(parsedResult)
    }
    stopSpeech()
    onClose()
  }

  const handleResetConversation = () => {
    stopSpeech()
    stopListening()
    setCurrentText('')
    setManualInput('')
    setParsedResult(null)
    resetTranscript()
    const greeting = MULTILINGUAL_GREETINGS[activeLang] || MULTILINGUAL_GREETINGS.hi
    setChatHistory([
      {
        sender: 'ai',
        text: greeting,
        time: 'Now',
      }
    ])
    startListening()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl border border-teal-500/30 shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header with Title & Close */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between gap-3 border-b border-teal-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-200 shrink-0 shadow-xs">
              <Sparkles className="size-5 text-teal-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-sm sm:text-base text-white tracking-tight truncate">
                संवादी एआई इंटेक (Conversational AI Intake)
              </h3>
              <p className="text-[11px] sm:text-xs text-teal-200/80 truncate mt-0.5">
                Speak your symptoms naturally in any of 10 Indian languages
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm cursor-pointer transition shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Language Selection Chips (All 10 Languages) */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono shrink-0">
            भाषा:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {SUMMARY_LANGUAGES.map(langMeta => (
              <button
                key={langMeta.id}
                type="button"
                onClick={() => {
                  setActiveLang(langMeta.id)
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeLang === langMeta.id
                    ? 'bg-teal-700 text-white shadow-xs ring-2 ring-teal-500/30'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200/90'
                }`}
              >
                {langMeta.native}
              </button>
            ))}
          </div>
        </div>

        {/* Conversational Dialogue Turns View */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-[#f8fafc] to-white min-h-[180px] max-h-[300px]"
        >
          {chatHistory.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-700 text-white rounded-tr-xs shadow-xs font-medium'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${msg.sender === 'user' ? 'text-teal-200' : 'text-teal-700'}`}>
                    {msg.sender === 'user' ? 'You (Patient)' : `Arogya AI (${activeLangMeta.native})`}
                  </span>
                  {msg.sender === 'ai' && (
                    <button
                      type="button"
                      onClick={handleSpeakReply}
                      className="p-1 rounded text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                      title="Listen aloud"
                    >
                      {isAiSpeaking ? <VolumeX className="size-3.5 text-teal-600 animate-pulse" /> : <Volume2 className="size-3.5" />}
                    </button>
                  )}
                </div>
                <p>{msg.text}</p>
              </div>
            </motion.div>
          ))}

          {/* Interim transcript indicator while user is currently talking */}
          {isListening && interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] p-3 rounded-2xl bg-teal-50 text-teal-900 border border-teal-200 text-xs italic animate-pulse">
                🎙️ {interimTranscript}...
              </div>
            </div>
          )}

          {/* AI Thinking indicator */}
          {isAiParsing && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-600 text-xs flex items-center gap-2">
                <Activity className="size-4 text-teal-600 animate-spin" />
                <span>लक्षणों का विश्लेषण हो रहा है (Analyzing clinical entities)...</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Extracted Clinical Entities Card */}
        {parsedResult && parsedResult.primaryComplaint && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <Check className="size-4 text-emerald-600 stroke-[3]" />
                लक्षण पहचाने गए (Clinical Entities Detected)
              </span>
              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                Confidence: {Math.round(parsedResult.confidence * 100)}%
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="px-2 py-1 rounded-xl bg-white border border-emerald-300 font-bold text-slate-900">
                मुख्य समस्या: <span className="text-teal-800">{parsedResult.primaryComplaint.label}</span>
              </span>
              {parsedResult.duration && (
                <span className="px-2 py-1 rounded-xl bg-white border border-emerald-300 text-slate-800">
                  अवधि: <span className="font-bold text-teal-800">{parsedResult.duration}</span>
                </span>
              )}
              {parsedResult.severity && (
                <span className="px-2 py-1 rounded-xl bg-white border border-emerald-300 text-slate-800">
                  तीव्रता: <span className="font-bold text-teal-800">{parsedResult.severity}/10</span>
                </span>
              )}
              {parsedResult.associatedSymptoms?.map((sym, i) => (
                <span key={i} className="px-2 py-1 rounded-xl bg-white border border-emerald-300 text-slate-700">
                  साथ में: <span className="font-semibold text-slate-900">{sym.label}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Microphone Controller & Wave Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-center gap-4">
            {/* Pulsing Mic Button */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <span
                  className="absolute w-16 h-16 rounded-full bg-teal-400/30 animate-ping"
                  style={{ transform: `scale(${1 + (audioLevel || 20) / 60})` }}
                />
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                    : 'bg-teal-700 hover:bg-teal-800 text-white ring-4 ring-teal-100'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to speak'}
              >
                {isListening ? <Mic className="size-6 text-white" /> : <MicOff className="size-6 text-white" />}
              </button>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">
                {isListening
                  ? `${activeLangMeta.native} में बोलें (Listening in ${activeLangMeta.label})...`
                  : 'माइक पर टैप करके बोलें (Tap mic to speak)'}
              </span>
              <span className="text-[11px] text-slate-500">
                उदा. “सीने में तेज दर्द है और कल से चक्कर आ रहे हैं”
              </span>
            </div>

            {currentText && (
              <button
                type="button"
                onClick={handleResetConversation}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                title="Reset intake conversation"
              >
                <RefreshCw className="size-4" />
              </button>
            )}
          </div>

          {/* Fallback Manual Typing Form */}
          <form onSubmit={handleManualSubmit} className="relative flex items-center">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={`या ${activeLangMeta.native} में लिखकर बताएं (Or type symptoms here)...`}
              className="w-full pl-3.5 pr-20 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 shadow-2xs"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <span>भेजें</span>
              <Send className="size-3" />
            </button>
          </form>

          {/* Action Confirmation Footer */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition"
            >
              रद्द करें (Cancel)
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!parsedResult?.primaryComplaint}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>इंटेक में शामिल करें (Apply to Intake)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
