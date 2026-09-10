// ==========================================
// ArogyaDarpan — Unified Audio & Speech Service
// Resolves Chrome/Windows TTS bugs & audio playback
// ==========================================

let preloadedVoices = []

function initVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  preloadedVoices = window.speechSynthesis.getVoices() || []
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      preloadedVoices = window.speechSynthesis.getVoices() || []
    }
  }
  // Active retry polling for WebView where onvoiceschanged might not fire
  let attempts = 0
  const voicePoll = setInterval(() => {
    attempts++
    const v = window.speechSynthesis.getVoices()
    if ((v && v.length > 0) || attempts > 8) {
      if (v && v.length > 0) preloadedVoices = v
      clearInterval(voicePoll)
    }
  }, 250)
}

initVoices()

export function getVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  if (!preloadedVoices || preloadedVoices.length === 0) {
    preloadedVoices = window.speechSynthesis.getVoices() || []
  }
  return preloadedVoices
}

/**
 * Play a gentle tactile audio chime via Web Audio API to unlock audio context on mobile/WebView
 */
export function playAudioChime() {
  if (typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.18)
  } catch { /* ignore audio chime errors */ }
}

/**
 * Smart voice matching for Indian locales and multilingual TTS
 */
export function getBestVoice(speechLocale = 'en-IN') {
  const voices = getVoices()
  if (!voices || voices.length === 0) return null

  const target = speechLocale.toLowerCase().replace('_', '-')
  const baseLang = target.split('-')[0]

  // 1. Exact match (e.g. 'hi-in')
  let match = voices.find(v => v.lang.toLowerCase().replace('_', '-') === target)
  if (match) return match

  // 2. Base language match (e.g. starts with 'hi')
  match = voices.find(v => v.lang.toLowerCase().startsWith(baseLang))
  if (match) return match

  // 3. Indian regional voice if available (e.g. 'en-IN' for English)
  match = voices.find(v => v.lang.toLowerCase().includes('in') || v.name.toLowerCase().includes('india'))
  if (match) return match

  // 4. Fallback to default voice or first available voice
  match = voices.find(v => v.default) || voices[0]
  return match || null
}

/**
 * Reliable Speech Synthesis Read Aloud
 * Overcomes Chromium garbage-collection bug, WebView pauses, and unsupported locale crashes
 */
export function speakText(text, {
  lang = 'en-IN',
  rate = 0.95,
  volume = 1.0,
  pitch = 1.0,
  onStart,
  onEnd,
  onError,
} = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.('Speech synthesis not supported in this browser')
    return () => {}
  }

  if (!text || !text.trim()) {
    onEnd?.()
    return () => {}
  }

  // Play audio chime to ensure audio context is unmuted
  playAudioChime()

  try {
    window.speechSynthesis.cancel()

    // Resume if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = Math.max(0.6, Math.min(1.6, rate))
    utterance.volume = Math.max(0, Math.min(1.0, volume))
    utterance.pitch = Math.max(0.6, Math.min(1.4, pitch))
    utterance.lang = lang

    const voice = getBestVoice(lang)
    if (voice) {
      utterance.voice = voice
    }

    let hasEnded = false
    let fallbackAttempted = false

    // Crucial: Anchor utterance to window to prevent Chrome's garbage-collection cutoff bug!
    window.__arogyaSpeechUtterance = utterance

    utterance.onstart = () => {
      onStart?.()
    }

    utterance.onend = () => {
      if (hasEnded) return
      hasEnded = true
      window.__arogyaSpeechUtterance = null
      onEnd?.()
    }

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e)
      window.__arogyaSpeechUtterance = null

      // If language not supported or voice unavailable, retry speaking with default system voice
      if ((e.error === 'language-unavailable' || e.error === 'voice-unavailable' || e.error === 'not-allowed') && !fallbackAttempted) {
        fallbackAttempted = true
        try {
          const fallback = new SpeechSynthesisUtterance(text)
          fallback.rate = rate
          fallback.lang = 'en-US' // universal fallback supported on virtually all Android WebViews & browsers
          fallback.onstart = onStart
          fallback.onend = () => {
            if (hasEnded) return
            hasEnded = true
            onEnd?.()
          }
          fallback.onerror = () => {
            if (hasEnded) return
            hasEnded = true
            onError?.('Speech playback not available on this device')
          }
          window.__arogyaSpeechUtterance = fallback
          window.speechSynthesis.speak(fallback)
          return
        } catch { /* ignore fallback error */ }
      }

      if (!hasEnded) {
        hasEnded = true
        onError?.(e.error || 'Speech playback error')
      }
    }

    // Chrome workaround for long utterances: periodic resume ping
    const resumeInterval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(resumeInterval)
      } else {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 8000)

    window.speechSynthesis.speak(utterance)

    return () => {
      clearInterval(resumeInterval)
      stopSpeech()
    }
  } catch (err) {
    console.error('speakText failed:', err)
    onError?.(err.message || 'Speech error')
    return () => {}
  }
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
      window.__arogyaSpeechUtterance = null
    } catch { /* ignore */ }
  }
}

/**
 * Lightweight MediaRecorder for recording live microphone audio snippets
 * Allows patients to record and replay their spoken answer
 */
export class AudioSnippetRecorder {
  constructor() {
    this.mediaRecorder = null
    this.audioChunks = []
    this.stream = null
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone not supported on this device')
    }

    this.audioChunks = []
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const options = MediaRecorder.isTypeSupported('audio/webm')
      ? { mimeType: 'audio/webm' }
      : {}

    this.mediaRecorder = new MediaRecorder(this.stream, options)
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }
    this.mediaRecorder.start(200)
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
        const audioUrl = URL.createObjectURL(audioBlob)

        if (this.stream) {
          this.stream.getTracks().forEach(t => t.stop())
          this.stream = null
        }
        resolve({ blob: audioBlob, url: audioUrl })
      }

      try {
        this.mediaRecorder.stop()
      } catch {
        resolve(null)
      }
    })
  }
}
