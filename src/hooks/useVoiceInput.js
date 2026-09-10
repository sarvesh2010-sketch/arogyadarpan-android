import { useState, useEffect, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition as CapSpeechRecognition } from '@capacitor-community/speech-recognition'
import { AudioSnippetRecorder } from '../services/audioService'

/**
 * Map application language codes to standard BCP-47 speech recognition locales
 */
export const SPEECH_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  pa: 'pa-IN',
  ml: 'ml-IN',
}

/**
 * Custom hook for Speech Recognition supporting both native Android (Capacitor)
 * and Web Speech API with audio snippet recording & graceful error fallbacks.
 */
export function useVoiceInput({ lang = 'en-IN', continuous = false, onResult } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null)

  const isNative = Capacitor.isNativePlatform()
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  const recorderRef = useRef(null)
  const nativeListenersRef = useRef([])
  const interimTranscriptRef = useRef('')

  // Keep callback reference updated
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  // Keep interim transcript ref updated
  useEffect(() => {
    interimTranscriptRef.current = interimTranscript
  }, [interimTranscript])

  // Map language to proper BCP-47 speech locale
  const speechLang = SPEECH_LOCALE_MAP[lang] || lang || 'en-IN'

  // Initialize Speech Support
  useEffect(() => {
    if (isNative) {
      // Native Android check via Capacitor plugin
      setIsSupported(true)
      CapSpeechRecognition.available()
        .then((res) => {
          setIsSupported(res?.available !== false)
        })
        .catch(() => {
          setIsSupported(true) // Attempt anyway on Android
        })

      // Setup Native Listeners
      const setupNativeListeners = async () => {
        try {
          const partialSub = await CapSpeechRecognition.addListener('partialResults', (data) => {
            if (data?.matches && data.matches.length > 0) {
              const heard = data.matches[0]
              setInterimTranscript(heard)
            }
          })

          const stateSub = await CapSpeechRecognition.addListener('listeningState', (state) => {
            if (state?.status === 'stopped') {
              setIsListening(false)
              const finalHeard = interimTranscriptRef.current
              if (finalHeard) {
                setTranscript(prev => (prev ? `${prev} ${finalHeard}` : finalHeard).trim())
                setInterimTranscript('')
                onResultRef.current?.(finalHeard)
              }
            } else if (state?.status === 'started') {
              setIsListening(true)
            }
          })

          nativeListenersRef.current = [partialSub, stateSub]
        } catch (err) {
          console.warn('Could not attach native speech listeners:', err)
        }
      }

      setupNativeListeners()

      return () => {
        nativeListenersRef.current.forEach((sub) => {
          try {
            sub?.remove?.()
          } catch { /* ignore */ }
        })
      }
    } else {
      // Standard Web Speech API fallback for desktop / browser testing
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = continuous
        recognition.interimResults = true
        recognition.lang = speechLang
        recognition.maxAlternatives = 3

        recognition.onresult = (event) => {
          let interim = ''
          let final = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              final += result[0].transcript
            } else {
              interim += result[0].transcript
            }
          }
          if (final) {
            setTranscript(prev => (prev ? `${prev} ${final}` : final).trim())
            setInterimTranscript('')
            onResultRef.current?.(final)
          } else {
            setInterimTranscript(interim)
          }
        }

        recognition.onerror = (event) => {
          console.warn('Speech recognition event error:', event.error)
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setError('microphone_blocked')
          } else if (event.error === 'no-speech') {
            // Silence ignored
          } else if (event.error === 'network') {
            setError('network_error')
          } else {
            setError(event.error)
          }
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } else {
        setIsSupported(false)
      }

      return () => {
        try {
          recognitionRef.current?.abort()
        } catch { /* ignore */ }
      }
    }
  }, [isNative, speechLang, continuous])

  const startListening = useCallback(async () => {
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setRecordedAudioUrl(null)

    // Optional audio snippet recorder for audio playback
    try {
      const recorder = new AudioSnippetRecorder()
      recorderRef.current = recorder
      await recorder.start()
    } catch (recErr) {
      console.warn('Audio snippet recorder unavailable:', recErr)
    }

    if (isNative) {
      try {
        // 1. Verify/Request Android runtime permissions
        const hasPerm = await CapSpeechRecognition.hasPermission()
        if (!hasPerm?.permission) {
          const req = await CapSpeechRecognition.requestPermissions()
          if (!req?.permission) {
            setError('microphone_blocked')
            return
          }
        }

        // 2. Start native speech recognition engine
        await CapSpeechRecognition.start({
          language: speechLang,
          maxResults: 3,
          prompt: 'ArogyaDarpan: Speak your symptoms',
          partialResults: true,
          popup: false,
        })
        setIsListening(true)
      } catch (err) {
        console.warn('Native SpeechRecognition start error:', err)
        setError('recognition_failed')
        setIsListening(false)
      }
    } else {
      // Browser SpeechRecognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = speechLang
          recognitionRef.current.start()
          setIsListening(true)
        } catch (e) {
          if (e.name !== 'InvalidStateError') {
            console.warn('SpeechRecognition start error:', e)
            setError('recognition_failed')
          } else {
            setIsListening(true)
          }
        }
      } else {
        setIsListening(true)
      }
    }
  }, [isNative, speechLang])

  const stopListening = useCallback(async () => {
    if (isNative) {
      try {
        await CapSpeechRecognition.stop()
      } catch (err) {
        console.warn('Native SpeechRecognition stop error:', err)
      }

      const pending = interimTranscriptRef.current
      if (pending) {
        setTranscript(prev => (prev ? `${prev} ${pending}` : pending).trim())
        setInterimTranscript('')
        onResultRef.current?.(pending)
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch { /* ignore */ }
      }
    }

    if (recorderRef.current) {
      try {
        const audioData = await recorderRef.current.stop()
        if (audioData?.url) {
          setRecordedAudioUrl(audioData.url)
        }
      } catch (err) {
        console.warn('Could not finalize audio snippet:', err)
      }
    }

    setIsListening(false)
  }, [isNative])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setRecordedAudioUrl(null)
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    recordedAudioUrl,
    speechLang,
    startListening,
    stopListening,
    resetTranscript,
  }
}
