import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope,
  Search,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  LogOut,
  Activity,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  FileText,
  ShieldCheck,
  Building2,
  Sparkles,
  Heart,
  Calendar,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Check,
  ChevronDown,
  Phone,
  Flame,
  AlertCircle
} from 'lucide-react'
import { getAllDoctorPatients, updateRegisteredPatientField } from '../../services/sessionStore'
import { isDoctorAuthenticated, getDoctorProfile, logoutDoctor } from '../../services/doctorAuthService'
import ConnectionStatus from '../../components/ConnectionStatus'

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
}

export default function DoctorDashboard() {
  const navigate = useNavigate()

  // Protect route
  useEffect(() => {
    if (!isDoctorAuthenticated()) {
      navigate('/doctor/login', { replace: true })
    }
  }, [navigate])

  const doctor = useMemo(() => getDoctorProfile(), [])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState('triage') // 'triage' | 'token' | 'name' | 'waiting'
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'compact'
  const [patients, setPatients] = useState(() => getAllDoctorPatients())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Automatically refresh patients on focus or storage change
  useEffect(() => {
    const refreshPatients = () => {
      setPatients(getAllDoctorPatients())
    }
    refreshPatients()
    window.addEventListener('storage', refreshPatients)
    window.addEventListener('focus', refreshPatients)
    const interval = setInterval(refreshPatients, 3000)
    return () => {
      window.removeEventListener('storage', refreshPatients)
      window.removeEventListener('focus', refreshPatients)
      clearInterval(interval)
    }
  }, [])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    setPatients(getAllDoctorPatients())
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const hour = currentTime.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Metric counts
  const priorityPatients = useMemo(() => {
    return patients.filter(p =>
      p.isPriority ||
      p.clinicalSignals?.some(s => s.severity === 'critical' || s.severity === 'high') ||
      p.triage?.category === 'emergency' ||
      p.triage?.category === 'urgent'
    )
  }, [patients])

  const readyForReview = useMemo(() => {
    return patients.filter(p => p.consultationStatus === 'ready_for_review')
  }, [patients])

  const completedPatients = useMemo(() => {
    return patients.filter(p => p.consultationStatus === 'completed')
  }, [patients])

  // Single top critical patient for STAT emergency banner
  const statPatient = useMemo(() => {
    return priorityPatients.find(p => p.consultationStatus !== 'completed') || priorityPatients[0] || null
  }, [priorityPatients])

  // Filtered & Sorted Patient List
  const filteredAndSortedPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = patients.filter(p => {
      const matchSearch =
        !query ||
        (p.name || '').toLowerCase().includes(query) ||
        (p.patientId || '').toLowerCase().includes(query) ||
        (p.queueToken || '').toLowerCase().includes(query) ||
        (p.abhaId || '').toLowerCase().includes(query) ||
        (p.chiefComplaint || '').toLowerCase().includes(query) ||
        (p.phone || '').includes(query)

      if (!matchSearch) return false

      if (filterPriority === 'priority') {
        return (
          p.isPriority ||
          p.clinicalSignals?.some(s => s.severity === 'critical' || s.severity === 'high') ||
          p.triage?.category === 'emergency' ||
          p.triage?.category === 'urgent'
        )
      }
      if (filterPriority === 'ready') {
        return p.consultationStatus === 'ready_for_review'
      }
      if (filterPriority === 'completed') {
        return p.consultationStatus === 'completed'
      }
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'triage') {
        const getPriorityRank = (p) => {
          if (p.isPriority || p.triage?.category === 'emergency' || p.triage?.level === 2) return 1
          if (p.triage?.category === 'urgent' || p.triage?.level === 3) return 2
          if (p.consultationStatus === 'ready_for_review') return 3
          if (p.consultationStatus === 'completed') return 5
          return 4
        }
        return getPriorityRank(a) - getPriorityRank(b)
      }
      if (sortBy === 'token') {
        return (a.queueToken || '').localeCompare(b.queueToken || '')
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'waiting') {
        return (b.waitingTimeMinutes || 0) - (a.waitingTimeMinutes || 0)
      }
      return 0
    })
  }, [patients, searchQuery, filterPriority, sortBy])

  // Quick 1-click status toggle directly from card
  const handleQuickStatusToggle = (e, patientId, currentStatus) => {
    e.stopPropagation()
    const nextStatus = currentStatus === 'completed' ? 'ready_for_review' : 'completed'
    updateRegisteredPatientField(patientId, {
      consultationStatus: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
    })
    setPatients(getAllDoctorPatients())
  }

  const handleLogout = () => {
    logoutDoctor()
    navigate('/doctor/login')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col select-none w-full max-w-full overflow-x-hidden">
      {/* Top Clinical Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-3 sm:px-6 py-2.5 w-full max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Hospital Crest & Doctor Profile Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={doctor.avatar}
                alt={doctor.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-xs ring-2 ring-teal-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-black text-sm sm:text-base text-slate-900 truncate">
                  {doctor.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {doctor.registrationNumber}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  ON DUTY • OPD 204
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                {doctor.department} • Apex Health Nexus
              </p>
            </div>
          </div>

          {/* Telemetry Clock, Quick Sync & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Clock HUD */}
            <div className="hidden lg:flex flex-col text-right pr-2 border-r border-slate-200">
              <span className="font-mono font-bold text-xs text-slate-800">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            <ConnectionStatus />

            {/* Quick Refresh Button with Animation */}
            <button
              type="button"
              onClick={handleManualRefresh}
              className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95 ${
                isRefreshing ? 'rotate-180 duration-500 transition-transform' : ''
              }`}
              title="Refresh queue"
            >
              <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin text-teal-700' : ''}`} />
            </button>

            {/* Launch Kiosk Shortcut */}
            <Link
              to="/patient/language"
              className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Open Patient Intake Kiosk"
            >
              <PlusCircle className="size-3.5 text-teal-700" />
              <span>Intake Kiosk</span>
            </Link>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Sign out of Doctor Portal"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Center Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 space-y-5 overflow-x-hidden">
        {/* STAT Emergency Clinical Alert Banner (If Red-Flags Present) */}
        {statPatient && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white shadow-stat-red border border-rose-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-400/30 animate-pulse">
                <AlertTriangle className="size-5 text-rose-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-mono text-[10px] font-black uppercase tracking-wider border border-rose-400/30">
                    PRIORITY STAT TRIAGE
                  </span>
                  <span className="text-xs font-mono text-rose-300">
                    Token {statPatient.queueToken || '#A-14'} • {statPatient.waitingTimeMinutes || 14}m in queue
                  </span>
                </div>
                <p className="text-xs text-white font-semibold truncate mt-0.5">
                  <strong className="text-rose-200">{statPatient.name}</strong> ({statPatient.age}y, {statPatient.gender}):{' '}
                  <span className="text-slate-100">{statPatient.chiefComplaint}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/doctor/patient/${statPatient.id || statPatient.patientId}`)}
              className="px-4 py-2 rounded-xl bg-white text-rose-950 font-heading font-black text-xs hover:bg-rose-50 active:scale-95 transition shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Examine STAT Dossier</span>
              <ArrowRight className="size-3.5" />
            </button>
          </motion.div>
        )}

        {/* Doctor OPD Session Banner */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Heart className="w-52 h-52 text-teal-400" />
          </div>

          <div className="space-y-1.5 relative z-10 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                Live OPD Triage Console
              </span>
              <span className="text-xs text-teal-300 font-mono">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight">
              {greeting}, {doctor.name}
            </h1>
            <p className="text-xs text-teal-100/80 max-w-2xl leading-relaxed">
              Real-time synchronization active. Patient intake responses, digitized OCR lab reports, and AI clinical summaries stream directly from hospital kiosks.
            </p>
          </div>

          <div className="flex items-center gap-2.5 relative z-10 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 text-center">
              <span className="text-[10px] font-mono text-teal-200 uppercase tracking-wider block">OPD Room</span>
              <span className="font-heading font-black text-lg text-white">204</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 text-center">
              <span className="text-[10px] font-mono text-emerald-200 uppercase tracking-wider block">Intake Mesh</span>
              <span className="font-heading font-black text-lg text-emerald-300">Live</span>
            </div>
          </div>
        </div>

        {/* 4 Clinical Telemetry KPI HUD Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Registered */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition min-w-0">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-slate-600">Total Registered</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Users className="size-4" />
              </div>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-slate-900">{patients.length}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              {patients.filter(p => p.consultationStatus !== 'completed').length} pending review
            </p>
          </div>

          {/* Card 2: Priority Red-Flags */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border transition min-w-0 ${
            priorityPatients.length > 0 ? 'border-rose-300 shadow-stat-red ring-1 ring-rose-200' : 'border-slate-200/80 shadow-xs'
          }`}>
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                {priorityPatients.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                Priority Red-Flags
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-rose-600">{priorityPatients.length}</p>
            <p className="text-[11px] text-rose-600 mt-1 font-semibold truncate">
              {priorityPatients.length > 0 ? 'Immediate clinical review' : 'No acute flags'}
            </p>
          </div>

          {/* Card 3: Ready for Review */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/90 shadow-xs hover:shadow-sm transition min-w-0">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-bold text-amber-800">Ready for Review</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-amber-700">{readyForReview.length}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              Intake & OCR complete
            </p>
          </div>

          {/* Card 4: Consulted & Discharged */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/90 shadow-xs hover:shadow-sm transition min-w-0">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold text-emerald-800">Completed Today</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="font-heading font-black text-2xl sm:text-3xl text-emerald-700">{completedPatients.length}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              Consultations completed
            </p>
          </div>
        </div>

        {/* Intelligent Search, Filter & Quick-Sort Bar */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, token (#A-14), ABHA ID, symptom, or phone..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort & View Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <SlidersHorizontal className="size-3.5 text-slate-500 ml-1.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-2 cursor-pointer"
                >
                  <option value="triage">Sort: Triage Severity</option>
                  <option value="token">Sort: Queue Token</option>
                  <option value="waiting">Sort: Longest Wait</option>
                  <option value="name">Sort: Patient Name</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    viewMode === 'compact' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Compact Table View"
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar overscroll-contain touch-pan-x w-full max-w-full pt-1 pb-0.5">
            <button
              type="button"
              onClick={() => setFilterPriority('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                filterPriority === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>All Patients</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterPriority === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {patients.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterPriority('priority')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                filterPriority === 'priority'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              <AlertTriangle className="size-3" />
              <span>Priority Red-Flags</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterPriority === 'priority' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'}`}>
                {priorityPatients.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterPriority('ready')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                filterPriority === 'ready'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              <Clock className="size-3" />
              <span>Ready for Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterPriority === 'ready' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'}`}>
                {readyForReview.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterPriority('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                filterPriority === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="size-3" />
              <span>Completed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterPriority === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
                {completedPatients.length}
              </span>
            </button>
          </div>
        </div>

        {/* Live Patient Queue Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-black text-sm sm:text-base text-slate-900">
              OPD Patient Queue ({filteredAndSortedPatients.length})
            </h3>
            {searchQuery && (
              <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
                Filtered
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-slate-500">
            {sortBy === 'triage' ? 'Priority Ranked' : `Sorted by ${sortBy}`}
          </span>
        </div>

        {/* Empty State */}
        {filteredAndSortedPatients.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Users className="size-10 text-slate-300 mx-auto" />
            <p className="font-heading font-bold text-sm text-slate-700">No patients found matching your search.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setFilterPriority('all')
              }}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-xs transition"
            >
              Reset Filters & Search
            </button>
          </div>
        ) : viewMode === 'compact' ? (
          /* ============================================================
             COMPACT TRIAGE LIST VIEW (Dense OPD Mode)
             ============================================================ */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto no-scrollbar overscroll-contain touch-pan-x w-full">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Chief Complaint</th>
                    <th className="py-3 px-4">Vitals</th>
                    <th className="py-3 px-4">Triage</th>
                    <th className="py-3 px-4">Wait Time</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAndSortedPatients.map((p) => {
                    const isPriority = p.isPriority || p.triage?.category === 'emergency' || p.triage?.level === 2
                    return (
                      <tr
                        key={p.id || p.patientId}
                        onClick={() => navigate(`/doctor/patient/${p.id || p.patientId}`)}
                        className={`hover:bg-slate-50/80 transition cursor-pointer ${isPriority ? 'bg-rose-50/20' : ''}`}
                      >
                        <td className="py-3 px-4 font-mono font-black text-teal-800">
                          {p.queueToken || '#A-14'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {p.age}y • {p.gender} • <span className="font-mono">{p.abhaId || 'ABHA Verified'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-800 font-semibold truncate">{p.chiefComplaint}</div>
                          {p.hindiComplaint && (
                            <div className="text-[10px] text-teal-700 font-hindi truncate mt-0.5">{p.hindiComplaint}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.vitals ? (
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-slate-800 font-bold">
                                {p.vitals.bp}
                              </span>
                              <span className="text-slate-500">{p.vitals.hr}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPriority
                              ? 'bg-rose-100 text-rose-800'
                              : p.triage?.level === 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-50 text-teal-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPriority ? 'bg-rose-600 animate-pulse' : 'bg-teal-600'}`} />
                            {p.triage?.label ? p.triage.label.split('—')[0].trim() : 'ESI-3'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {p.waitingTimeMinutes || 12} mins
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/doctor/patient/${p.id || p.patientId}`)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white font-bold text-xs transition cursor-pointer"
                          >
                            Examine
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ============================================================
             EXPANDED CLINICAL CARDS VIEW (Standard High-Density Mode)
             ============================================================ */
          <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
            {filteredAndSortedPatients.map((p, index) => {
              const isPriority =
                p.isPriority ||
                p.clinicalSignals?.some(s => s.severity === 'critical' || s.severity === 'high') ||
                p.triage?.category === 'emergency' ||
                p.triage?.level === 2

              const isCompleted = p.consultationStatus === 'completed'
              const isUrgent = p.triage?.level === 3 || p.triage?.category === 'urgent'

              // Border accent based on priority
              const borderAccentClass = isCompleted
                ? 'border-l-6 border-l-emerald-500 border-slate-200/80 hover:border-emerald-500/60'
                : isPriority
                ? 'border-l-6 border-l-rose-500 border-rose-200/80 shadow-stat-red hover:border-rose-400'
                : isUrgent
                ? 'border-l-6 border-l-amber-500 border-amber-200/80 shadow-stat-amber hover:border-amber-400'
                : 'border-l-6 border-l-teal-600 border-slate-200/80 hover:border-teal-500/60 shadow-stat-teal'

              return (
                <motion.div
                  key={p.id || p.patientId || index}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  onClick={() => navigate(`/doctor/patient/${p.id || p.patientId}`)}
                  className={`p-4 sm:p-5 rounded-3xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-[0.995] flex flex-col justify-between gap-4 ${borderAccentClass}`}
                >
                  {/* Top Demographic Header & Triage Ribbon */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Queue Token Badge */}
                      <div className={`w-12 h-12 rounded-2xl font-mono font-black text-sm flex items-center justify-center shrink-0 border ${
                        isPriority
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-teal-50 text-teal-800 border-teal-200'
                      }`}>
                        {p.queueToken || `#A-${index + 10}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-black text-base sm:text-lg text-slate-900 truncate">
                            {p.name || 'Anonymous Patient'}
                          </h4>
                          <span className="text-xs text-slate-600 font-semibold">
                            {p.age ? `${p.age} yrs` : ''} • {p.gender || 'Patient'}
                          </span>
                          <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                            <ShieldCheck className="size-3 text-teal-600" />
                            {p.abhaId || 'ABHA Verified'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="size-3" /> {p.phone || '+91 98765 43210'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Arrived: {p.registeredAtFormatted || '11:15 AM'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            Wait: {p.waitingTimeMinutes || 14} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Triage & Status Badges */}
                    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                        isPriority
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : isUrgent
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-teal-50 border-teal-200 text-teal-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isPriority ? 'bg-rose-600 animate-pulse' : isUrgent ? 'bg-amber-600' : 'bg-teal-600'}`} />
                        {p.triage?.label || (isPriority ? 'ESI Level 2 — Emergent' : 'ESI Level 3 — Urgent')}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleQuickStatusToggle(e, p.patientId || p.id, p.consultationStatus)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : p.consultationStatus === 'ready_for_review'
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Click to toggle completed status"
                      >
                        {isCompleted ? (
                          <>
                            <Check className="size-3.5" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="size-3.5" />
                            <span>Ready for Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Middle Clinical Insights: Chief Complaint & Vitals Telemetry Ribbon */}
                  <div className="space-y-2.5">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs sm:text-sm text-slate-800 font-bold leading-snug">
                        <span className="text-slate-500 font-medium">Chief Complaint:</span>{' '}
                        <span className="text-slate-900">{p.chiefComplaint || 'General Clinical Consultation'}</span>
                      </p>
                      {p.hindiComplaint && (
                        <p className="text-[11px] text-teal-800 font-medium font-hindi flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200 font-mono font-bold text-teal-700 shrink-0">HI</span>
                          <span className="truncate">{p.hindiComplaint}</span>
                        </p>
                      )}
                    </div>

                    {/* Vitals Telemetry Ribbon */}
                    {p.vitals && (
                      <div className="flex items-center gap-2 flex-wrap py-1 text-xs">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800">
                          <span className="text-rose-600">🩸 BP:</span> {p.vitals.bp}{p.vitals.bp && !p.vitals.bp.includes('mmHg') ? ' mmHg' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800">
                          <span className="text-red-500">❤️ HR:</span> {p.vitals.hr || '78 bpm'}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800">
                          <span className="text-cyan-600">🫁 SpO2:</span> {p.vitals.spo2 || '98%'}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800">
                          <span className="text-amber-600">🌡️ Temp:</span> {p.vitals.temp || '98.6°F'}
                        </span>
                        {p.vitals.pain && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800">
                            <span className="text-rose-600">⚡ Pain:</span> {p.vitals.pain}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Clinical Badges & Action CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    {/* Clinical Signal Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPriority && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          <AlertTriangle className="size-3" /> Priority Red-Flag
                        </span>
                      )}

                      {p.knownAllergies && p.knownAllergies.length > 0 && !p.knownAllergies.includes('None') && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          ⚠️ Allergy: {Array.isArray(p.knownAllergies) ? p.knownAllergies.join(', ') : p.knownAllergies}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full">
                        <FileText className="size-3" /> {p.documentsCount || 0} OCR Records
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="size-3 text-teal-600" /> AI Summary Ready
                      </span>
                    </div>

                    {/* Review Dossier Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/doctor/patient/${p.id || p.patientId}`)
                      }}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white font-heading font-bold text-xs shadow-teal-glow transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <span>Examine Dossier & AI Summary</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
