import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Stethoscope,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Building2,
  Award
} from 'lucide-react'
import { isDoctorAuthenticated, loginDoctor, DEFAULT_DOCTOR_PROFILE } from '../../services/doctorAuthService'

export default function DoctorLogin() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('DMC-2018-4921')
  const [pin, setPin] = useState('1234')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to /doctor if already authenticated
  useEffect(() => {
    if (isDoctorAuthenticated()) {
      navigate('/doctor', { replace: true })
    }
  }, [navigate])

  const handleLogin = (e) => {
    e?.preventDefault()
    setError('')

    if (!identifier.trim() || !pin.trim()) {
      setError('Please provide Medical Registration ID and Security PIN.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      loginDoctor({ identifier, pin })
      setIsLoading(false)
      navigate('/doctor')
    }, 450)
  }

  const handleQuickDemoLogin = () => {
    setIsLoading(true)
    setIdentifier('DMC-2018-4921')
    setPin('1234')
    setTimeout(() => {
      loginDoctor()
      setIsLoading(false)
      navigate('/doctor')
    }, 350)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f9fb] via-[#eef4f6] to-[#e4eef1] text-slate-900 flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Patient Intake</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            ABDM HPR Portal • Node v2.4
          </span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
          {/* Hero Banner with Doctor Avatar & Crest */}
          <div className="p-6 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={DEFAULT_DOCTOR_PROFILE.avatar}
                    alt="Dr. Ananya Sharma"
                    className="w-14 h-14 rounded-2xl object-cover shadow-md ring-2 ring-teal-400/50"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-heading font-bold text-base text-white">Dr. Ananya Sharma</h2>
                    <span className="text-teal-300 text-xs">✓</span>
                  </div>
                  <p className="text-xs text-teal-200">Consultant Cardiologist</p>
                  <p className="text-[10px] text-teal-300/80 font-mono mt-0.5">DMC Reg: DMC-2018-4921</p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-200">
                <Stethoscope className="size-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-teal-700/50 flex items-center justify-between text-[11px] text-teal-200 font-medium">
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5 text-teal-300" /> Apex Health Center, OPD 204
              </span>
              <span className="font-mono text-emerald-300 font-bold">● Active Session</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            <div>
              <h1 className="font-heading font-bold text-xl text-slate-900">
                Doctor OPD Sign In
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in to review patient clinical intakes, reports, and AI summaries.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Medical Reg ID / Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medical Reg ID / Official Email
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Mail className="size-4" />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. DMC-2018-4921 or dr.ananya@apexhealth.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition"
                  />
                </div>
              </div>

              {/* Security PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security PIN / Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <KeyRound className="size-4" />
                  </span>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 4-digit PIN (1234)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition font-mono tracking-wider"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-heading font-bold text-sm shadow-md active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Doctor Workbench'}</span>
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="relative py-1 flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute px-3 bg-white text-[10px] font-mono text-slate-400 uppercase font-bold">
                or instant preview
              </span>
            </div>

            {/* Quick Demo 1-Tap Login */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-teal-300 text-teal-900 font-bold text-xs shadow-2xs active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="size-4 text-teal-600" />
              <span>⚡ Quick 1-Tap Demo Login as Dr. Ananya Sharma</span>
            </button>

            {/* Regulatory Compliance Badge */}
            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100">
              <span className="flex items-center gap-1 text-teal-800 font-semibold">
                <ShieldCheck className="size-3 text-teal-600" /> ABDM HPR Verified
              </span>
              <span>DPDP Act 2023 Encrypted</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 font-mono">
        ArogyaDarpan Health Informatics • Department of Health & Family Welfare
      </footer>
    </div>
  )
}
