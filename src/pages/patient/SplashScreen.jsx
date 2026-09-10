import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import logoEmblem from '../../assets/arogyadarpan_logo_emblem.png'
import LanguageSelector from '../../components/LanguageSelector'
import { useLanguage } from '../../context/LanguageContext'

export default function SplashScreen({ onComplete }) {
  const navigate = useNavigate()
  const { t, lang, currentLanguageMeta } = useLanguage()

  const handleProceed = () => {
    if (onComplete) {
      onComplete()
    } else {
      navigate('/patient/language')
    }
  }

  return (
    <main className="flex flex-col relative w-full bg-[#f8fafc] min-h-screen pt-safe pb-safe select-none">
      {/* Subtle, calm ambient background warmth */}
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-96 pointer-events-none overflow-hidden flex justify-center opacity-40"
      >
        <div className="w-[500px] h-[300px] rounded-full bg-teal-100/50 blur-3xl -translate-y-1/2" />
      </div>

      <div className="flex flex-col w-full relative z-10 items-center justify-between min-h-[92vh] px-6 py-6 max-w-lg mx-auto">
        {/* Top Bar: Language Selector & Doctor Portal & Kiosk access */}
        <header className="w-full flex items-center justify-between gap-2">
          <LanguageSelector variant="compact" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/doctor/login')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Doctor OPD Queue & Workbench"
            >
              <Stethoscope className="size-3.5 text-emerald-600" />
              <span>Doctor Portal</span>
            </button>

            <button
              onClick={() => navigate('/kiosk')}
              className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-teal-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="PHC Kiosk Terminal"
            >
              {t('kioskMode', 'Kiosk')}
            </button>
          </div>
        </header>

        {/* Central Hero Section: Clean, Minimalist Brand & Purpose */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center text-center my-auto w-full py-8"
        >
          {/* Logo Emblem Container */}
          <div className="relative size-32 sm:size-36 rounded-3xl p-3 bg-white shadow-sm border border-slate-200/80 flex items-center justify-center mb-6">
            <img
              alt="ArogyaDarpan Emblem"
              src={logoEmblem}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Typography */}
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('appName', 'ArogyaDarpan')}
          </h1>
          {lang !== 'hi' && (
            <p className="text-base text-slate-500 font-medium mt-1">
              आरोग्यदर्पण
            </p>
          )}

          <p className="text-sm sm:text-base text-slate-600 font-normal mt-4 max-w-sm leading-relaxed">
            {t('tagline', 'Your health story, organized before you see your doctor.')}
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100">
            <Sparkles className="size-3.5 text-teal-600" />
            <span>{t('confidential', 'AI-Assisted Intake • Fast & Confidential')}</span>
          </div>
        </motion.div>

        {/* Bottom Call to Action & Trust Indicator */}
        <div className="w-full flex flex-col items-center space-y-4 max-w-sm">
          <button
            onClick={handleProceed}
            className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-heading text-base font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
            type="button"
          >
            <span>{t('startHealthCheck', 'Start Health Check')}</span>
            <ArrowRight className="size-5" />
          </button>

          {/* Trust & Compliance Reassurance */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium text-center">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>{t('privacyNotice', 'Ayushman Bharat (ABDM) Compliant • 100% Private')}</span>
          </div>

          {/* Attending Physician Access Button */}
          <div className="w-full pt-3 mt-1 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Attending Physician / OPD?</span>
            <button
              onClick={() => navigate('/doctor/login')}
              className="font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Stethoscope className="size-3.5 text-emerald-600" />
              <span>Doctor Login</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
