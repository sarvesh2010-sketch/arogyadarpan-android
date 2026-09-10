import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  CameraOff,
  SwitchCamera,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  ArrowRight,
  Eye,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react'
import { isNativePlatform, captureNativePhoto } from '../../services/nativeCamera'
import StitchAppHeader from '../../components/StitchAppHeader'
import DocumentInspectorModal from '../../components/DocumentInspectorModal'
import { scanMedicalDocument } from '../../services/ocrEngine'
import { saveActiveDocuments } from '../../services/sessionStore'
import { useLanguage } from '../../context/LanguageContext'

const DOC_TYPES = [
  { id: 'Prescription', key: 'prescription', label: 'Prescription (पर्चा)' },
  { id: 'Laboratory Report', key: 'labReport', label: 'Lab Report (जांच रिपोर्ट)' },
  { id: 'Discharge Summary', key: 'dischargeSummary', label: 'Discharge Summary' },
  { id: 'Pharmacy Bill', key: 'otherDocument', label: 'Pharmacy Bill / Other' },
]

export default function DocumentUpload() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [selectedType, setSelectedType] = useState('Prescription')
  const [facingMode, setFacingMode] = useState('environment')
  const [cameraStatus, setCameraStatus] = useState('initializing') // 'initializing' | 'active' | 'error' | 'denied' | 'off'
  const [cameraErrorMessage, setCameraErrorMessage] = useState('')
  const [gridVisible, setGridVisible] = useState(true)
  const [isFlashing, setIsFlashing] = useState(false)
  const [activeInspectorDoc, setActiveInspectorDoc] = useState(null)
  const isNative = isNativePlatform()

  // Scanned / Uploaded documents state
  const [documents, setDocuments] = useState(() => {
    try {
      const stored = localStorage.getItem('arogya_documents')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return []
  })

  // Start real live camera stream (for web / kiosk or in-app preview)
  const startCamera = useCallback(async (mode = facingMode) => {
    if (isNative) {
      // On native Android, Capacitor Camera handles capture via intent
      setCameraStatus('active')
      return
    }

    setCameraStatus('initializing')
    setCameraErrorMessage('')

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('error')
      setCameraErrorMessage(t('cameraError', 'Camera not supported in this browser.'))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {})
        }
      }
      setCameraStatus('active')
    } catch (primaryErr) {
      console.warn('Primary camera stream error, trying fallback:', primaryErr)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        streamRef.current = fallbackStream

        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {})
          }
        }
        setCameraStatus('active')
      } catch (fallbackErr) {
        console.error('All camera attempts failed:', fallbackErr)
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setCameraStatus('denied')
          setCameraErrorMessage('Camera permission was denied. Please allow camera access in app settings.')
        } else {
          setCameraStatus('error')
          setCameraErrorMessage(t('cameraError', 'Camera device not found or in use.'))
        }
      }
    }
  }, [facingMode, isNative, t])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraStatus('off')
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      stopCamera()
    }
  }, [facingMode, startCamera, stopCamera])

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  // Snap photo: Uses native Capacitor Camera on Android device, or live canvas capture on Web
  const triggerShutter = async () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 200)

    const docId = `doc-cam-${Date.now()}`
    const fileName = `${selectedType}_Scan_${new Date().toLocaleTimeString().replace(/:/g, '')}.jpg`

    if (isNative) {
      try {
        const photoDataUrl = await captureNativePhoto()
        if (photoDataUrl) {
          const newDoc = {
            id: docId,
            category: selectedType,
            fileName,
            uploadDate: new Date().toISOString().split('T')[0],
            status: 'processing',
            previewUrl: photoDataUrl,
          }
          setDocuments(prev => [newDoc, ...prev])

          // Process with OCR
          try {
            const blob = await (await fetch(photoDataUrl)).blob()
            const file = new File([blob], fileName, { type: 'image/jpeg' })
            const ocrResult = await scanMedicalDocument(file)
            setDocuments(prev => prev.map(d =>
              d.id === docId ? { ...d, status: 'processed', extraction: ocrResult } : d
            ))
          } catch (ocrErr) {
            console.warn('OCR error:', ocrErr)
            setDocuments(prev => prev.map(d =>
              d.id === docId ? { ...d, status: 'processed' } : d
            ))
          }
        }
      } catch (err) {
        console.warn('Native camera cancelled or error:', err)
      }
      return
    }

    // Web / Browser canvas frame capture
    if (cameraStatus === 'active' && videoRef.current) {
      try {
        const video = videoRef.current
        const width = video.videoWidth || 1280
        const height = video.videoHeight || 720

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, width, height)

        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.88)
        const newDoc = {
          id: docId,
          category: selectedType,
          fileName,
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'processing',
          previewUrl: photoDataUrl,
        }
        setDocuments(prev => [newDoc, ...prev])

        // Process OCR
        const blob = await (await fetch(photoDataUrl)).blob()
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        try {
          const ocrResult = await scanMedicalDocument(file)
          setDocuments(prev => prev.map(d =>
            d.id === docId ? { ...d, status: 'processed', extraction: ocrResult } : d
          ))
        } catch (ocrErr) {
          setDocuments(prev => prev.map(d =>
            d.id === docId ? { ...d, status: 'processed' } : d
          ))
        }
      } catch (err) {
        console.error('Frame capture failed:', err)
        fileInputRef.current?.click()
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  // File upload from disk/gallery
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    for (const file of files) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      const objectUrl = URL.createObjectURL(file)

      const doc = {
        id: docId,
        fileName: file.name,
        category: selectedType,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'processing',
        previewUrl: objectUrl,
      }
      setDocuments(prev => [doc, ...prev])

      try {
        const ocrResult = await scanMedicalDocument(file)
        setDocuments(prev => prev.map(d =>
          d.id === docId
            ? { ...d, status: 'processed', extraction: ocrResult }
            : d
        ))
      } catch (ocrErr) {
        console.warn('OCR error:', ocrErr)
        setDocuments(prev => prev.map(d =>
          d.id === docId ? { ...d, status: 'processed' } : d
        ))
      }
    }
  }

  const handleDeleteDoc = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handleContinue = () => {
    try {
      saveActiveDocuments(documents)
    } catch { /* ignore */ }
    navigate('/patient/document-review')
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans text-slate-800 pb-16 select-none">
      <StitchAppHeader
        title="uploadDocuments"
        showBack
        onBack={() => navigate('/patient/interview')}
      />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-5 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          {/* Header Description & Document Type Selector */}
          <div className="space-y-2">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {t('uploadDocuments', 'Bring your previous records together')}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('uploadSubtext', 'Scan prescriptions or laboratory reports. ArogyaDarpan will organize them for your doctor.')}
            </p>

            {/* Document Category Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {DOC_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    selectedType === type.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{t(type.key, type.label)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ──────────────────────────────────
              LIVE CAMERA VIEWFINDER CONTAINER
              ────────────────────────────────── */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-md bg-slate-900 border border-slate-800">
            {cameraStatus === 'active' ? (
              <>
                {isNative ? (
                  /* Native Android Camera Launch Frame */
                  <div
                    onClick={triggerShutter}
                    className="w-full h-full flex flex-col items-center justify-center text-white space-y-3 p-6 text-center cursor-pointer bg-gradient-to-b from-slate-800 to-slate-900"
                  >
                    <div className="size-16 rounded-full bg-teal-600/30 flex items-center justify-center border border-teal-500/50">
                      <Camera className="size-8 text-teal-400" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-base text-white">Tap to Open Native Android Camera</p>
                      <p className="text-xs text-slate-400 mt-1">High-resolution document scanning with autofocus</p>
                    </div>
                  </div>
                ) : (
                  /* Web Live Video Stream */
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {gridVisible && (
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-white" />
                        <div className="border-r border-white" />
                        <div />
                      </div>
                    )}

                    <div className="absolute inset-5 border-2 border-dashed border-teal-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-2.5">
                      <span className="text-[10px] font-mono text-teal-300 bg-black/50 px-2 py-0.5 rounded w-fit">
                        {t('alignCorners', 'Align corners in frame')}
                      </span>
                      <div className="flex justify-center">
                        <span className="text-[10px] text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full">
                          {t('holdSteady', 'Hold steady under good lighting')}
                        </span>
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer backdrop-blur-xs"
                        title="Switch Camera"
                      >
                        <SwitchCamera className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGridVisible(!gridVisible)}
                        className={`size-8 rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-xs ${
                          gridVisible ? 'bg-teal-600 text-white' : 'bg-black/60 text-white'
                        }`}
                        title="Toggle Grid"
                      >
                        <span className="text-xs font-mono font-bold">#</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : cameraStatus === 'initializing' ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-2.5">
                <RefreshCw className="size-8 animate-spin text-teal-400" />
                <p className="text-xs font-medium text-slate-300">{t('scanningDocument', 'Starting camera...')}</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-slate-300 space-y-3">
                <CameraOff className="size-10 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t('cameraError', 'Camera Not Available')}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    {cameraErrorMessage || 'You can upload documents directly from your device storage.'}
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium cursor-pointer"
                  >
                    {t('retryCamera', 'Retry Camera')}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium cursor-pointer"
                  >
                    {t('uploadFile', 'Upload File')}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {isFlashing && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-white z-20 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Camera Capture Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-around gap-4">
            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 text-slate-600 hover:text-teal-700 transition cursor-pointer"
              title="Upload file from device"
            >
              <div className="size-11 rounded-full bg-slate-100 hover:bg-teal-50 flex items-center justify-center transition">
                <FolderOpen className="size-5 text-slate-700" />
              </div>
              <span className="text-[11px] font-medium">{t('uploadFile', 'Upload File')}</span>
            </button>

            {/* Main Shutter Button */}
            <button
              type="button"
              onClick={triggerShutter}
              className="size-16 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all p-1 cursor-pointer ring-4 ring-teal-100"
              title={t('captureDocument', 'Take Photo')}
            >
              <div className="size-13 rounded-full border-2 border-white flex items-center justify-center">
                <Camera className="size-6" />
              </div>
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Scanned Documents Gallery */}
          {documents.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('documents', 'Documents')} ({documents.length})
                </h3>
              </div>

              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {doc.previewUrl ? (
                        <img
                          src={doc.previewUrl}
                          alt="Thumbnail"
                          className="size-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <FileText className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {doc.category} • {doc.status === 'processing' ? t('processing', 'Processing...') : `✓ ${t('processed', 'Ready')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveInspectorDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Inspect Document"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Continue Action */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('continue', 'Continue to Document Review')}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </main>

      {/* Document Inspector Modal */}
      {activeInspectorDoc && (
        <DocumentInspectorModal
          document={activeInspectorDoc}
          onClose={() => setActiveInspectorDoc(null)}
        />
      )}
    </div>
  )
}
