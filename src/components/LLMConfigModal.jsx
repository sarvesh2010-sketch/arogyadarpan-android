import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, Zap, Key, Server, Check, X, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { getLLMConfig, saveLLMConfig } from '../services/aiQuestionGenerator'

const PROVIDERS = [
  {
    id: 'clinical_offline',
    name: 'Built-in Clinical Ontology',
    badge: 'Offline / Zero Latency',
    desc: 'Deterministic medical rule graph & SOCRATES question engine. 100% offline, guaranteed zero hallucination.',
    icon: Zap,
    color: 'emerald',
    requiresKey: false,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Cloud LLM',
    desc: 'Gemini 1.5/2.0 Flash. Generates tailored clinical triage questions in English & Indian regional languages.',
    icon: Sparkles,
    color: 'blue',
    requiresKey: true,
    defaultModel: 'gemini-1.5-flash',
    placeholderKey: 'AIzaSy...',
  },
  {
    id: 'groq',
    name: 'Groq Cloud (Llama 3.3)',
    badge: 'Ultra Fast',
    desc: 'Llama-3.3 70B Versatile on Groq LPUs. Sub-second response time for real-time kiosk intake.',
    icon: Bot,
    color: 'orange',
    requiresKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
    placeholderKey: 'gsk_...',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o mini)',
    badge: 'Cloud LLM',
    desc: 'GPT-4o-mini structured clinical question formulation.',
    icon: Bot,
    color: 'purple',
    requiresKey: true,
    defaultModel: 'gpt-4o-mini',
    placeholderKey: 'sk-...',
  },
  {
    id: 'custom',
    name: 'Custom Endpoint / Ollama',
    badge: 'Local / Hospital Server',
    desc: 'Connect to an on-premise hospital Ollama, vLLM, or LiteLLM server via standard OpenAI-compatible API.',
    icon: Server,
    color: 'slate',
    requiresKey: false,
    defaultEndpoint: 'http://localhost:11434/v1/chat/completions',
    defaultModel: 'llama3',
  },
]

export default function LLMConfigModal({ isOpen, onClose }) {
  const [config, setConfig] = useState({
    provider: 'clinical_offline',
    apiKey: '',
    model: '',
    endpoint: '',
  })
  const [showKey, setShowKey] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const current = getLLMConfig()
      setConfig(current)
      setSavedSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    saveLLMConfig(config)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 700)
  }

  const activeProviderMeta = PROVIDERS.find(p => p.id === config.provider) || PROVIDERS[0]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-200">
                <Bot className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                  <span>Clinical AI & LLM Engine</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 border border-teal-400/30">
                    Triage AI
                  </span>
                </h3>
                <p className="text-xs text-teal-100/80">
                  Select which AI model generates follow-up questions for typed complaints
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-teal-100 hover:text-white transition cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Provider Selector Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select AI Engine
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {PROVIDERS.map((p) => {
                  const isSelected = config.provider === p.id
                  const Icon = p.icon
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          provider: p.id,
                          model: p.defaultModel || prev.model,
                          endpoint: p.defaultEndpoint || prev.endpoint,
                        }))
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 text-left ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-2 ring-teal-200'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-teal-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                            {p.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              p.id === 'clinical_offline'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Provider Specific Inputs */}
            {activeProviderMeta.requiresKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-slate-100"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Key className="size-3.5 text-teal-700" />
                      <span>{activeProviderMeta.name} API Key</span>
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Stored securely in browser LocalStorage
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={activeProviderMeta.placeholderKey || 'Enter API key...'}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <span>Model Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                    placeholder={activeProviderMeta.defaultModel || 'Default model'}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </motion.div>
            )}

            {config.provider === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-slate-100"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Server className="size-3.5 text-teal-700" />
                    <span>OpenAI-Compatible Endpoint URL</span>
                  </label>
                  <input
                    type="text"
                    value={config.endpoint}
                    onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="http://localhost:11434/v1/chat/completions"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Key className="size-3.5 text-teal-700" />
                    <span>Authorization Bearer Token (Optional)</span>
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Bearer token (if required)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </motion.div>
            )}

            {/* Privacy & Safety Note */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-normal">
                <strong>Patient Safety Guarantee:</strong> Red-flag clinical emergencies (e.g. chest pain with breathlessness) are always governed by the deterministic rule engine and never rely solely on probabilistic LLM responses.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const reset = { provider: 'clinical_offline', apiKey: '', model: '', endpoint: '' }
                setConfig(reset)
                saveLLMConfig(reset)
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Reset to Default (Offline)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="size-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
