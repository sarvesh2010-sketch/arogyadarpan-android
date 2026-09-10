import React from 'react'

/**
 * High-definition, relatable medical vector icons for clinical symptoms & complaints.
 * Replaces standard emojis with clinically accurate, accessible SVG vectors.
 */
export default function ComplaintVectorIcon({
  id,
  className = '',
  size = 'md', // 'sm' (28px), 'md' (36px), 'lg' (44px)
  withBackground = true,
}) {
  const normId = (id || '').toLowerCase().trim()

  // Dimension presets
  const sizeMap = {
    sm: { container: 'w-7 h-7 rounded-lg', icon: 'size-4' },
    md: { container: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl', icon: 'size-5 sm:size-5.5' },
    lg: { container: 'w-12 h-12 rounded-2xl', icon: 'size-6 sm:size-7' },
  }

  const { container, icon: iconSize } = sizeMap[size] || sizeMap.md

  // Vector configurations for symptoms
  switch (normId) {
    case 'chest_pain':
    case 'chest':
    case 'cardiac':
      return renderWrapper(
        withBackground,
        container,
        'bg-rose-50 text-rose-600 border border-rose-200/80 group-hover:bg-rose-100/70 group-hover:border-rose-300 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Anatomical Heart Contour */}
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Electrocardiogram (ECG) Pulse Wave Trace */}
          <path
            d="M3.5 12h3.5l1.5-3 2 6 2-4.5 1.5 1.5h6"
            stroke="#dc2626"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    case 'fever':
    case 'high_fever':
    case 'temp':
      return renderWrapper(
        withBackground,
        container,
        'bg-amber-50 text-amber-600 border border-amber-200/80 group-hover:bg-amber-100/70 group-hover:border-amber-300 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Thermometer Glass Body */}
          <path
            d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Mercury Core */}
          <circle cx="11.5" cy="17.5" r="2.25" fill="#ea580c" />
          <path d="M11.5 8.5v7" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" />
          {/* Calibrated Degree Marks */}
          <path d="M14 6h2M14 9h2M14 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* Radiating Heat Wave Pulse */}
          <path d="M19 4c1 1 1 2.5 0 3.5M21 2c1.8 1.8 1.8 4.2 0 6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case 'cough':
    case 'lungs':
    case 'respiratory':
      return renderWrapper(
        withBackground,
        container,
        'bg-sky-50 text-sky-600 border border-sky-200/80 group-hover:bg-sky-100/70 group-hover:border-sky-300 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Trachea & Airway Cartilage */}
          <path d="M12 2v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 4h4M10 6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* Left & Right Bronchi */}
          <path d="M12 8l-2.5 2.5M12 8l2.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          {/* Left Lung Lobe */}
          <path
            d="M9.5 10.5C7 10.5 4 12.5 4 16.5c0 3.5 2.5 5.5 5.5 5.5c1.8 0 2.5-.8 2.5-2V11l-2.5-.5z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Lung Lobe */}
          <path
            d="M14.5 10.5C17 10.5 20 12.5 20 16.5c0 3.5-2.5 5.5-5.5 5.5c-1.8 0-2.5-.8-2.5-2V11l2.5-.5z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cough Expelling Airflow Ripples */}
          <path d="M1.5 14.5c.8-.5 1.7-.5 2.5 0M1.5 17.5c.8-.5 1.7-.5 2.5 0" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )

    case 'stomach_pain':
    case 'abdominal_pain':
    case 'stomach':
    case 'abdomen':
      return renderWrapper(
        withBackground,
        container,
        'bg-emerald-50 text-emerald-600 border border-emerald-200/80 group-hover:bg-emerald-100/70 group-hover:border-emerald-300 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Anatomical Stomach Profile */}
          <path
            d="M9 2v3c0 1.5-.5 2.5-1.5 3.5C6 10 4.5 12 4.5 15c0 4 3 6.5 7.5 6.5s7.5-2.5 7.5-6.5c0-3.2-1.8-5.5-4-7C14 6.8 13.5 5 13.5 2"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Curvature Detail */}
          <path
            d="M10 7.5c1.8 1.5 2.5 3 2.5 5.5c0 1.8-.7 3-2 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="1.5 2.5"
          />
          {/* Abdominal Spasm / Pain Impulse Flash */}
          <path d="M11 11l-1.5 2.5h3L11 16" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case 'headache':
    case 'migraine':
    case 'head':
      return renderWrapper(
        withBackground,
        container,
        'bg-purple-50 text-purple-600 border border-purple-200/80 group-hover:bg-purple-100/70 group-hover:border-purple-300 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Cranial Head & Cerebrum Contour */}
          <path
            d="M12 4a7 7 0 0 0-7 7c0 2.5 1.3 4.7 3.3 6l.7 3h6l.7-3c2-1.3 3.3-3.5 3.3-6a7 7 0 0 0-7-7z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Brain Lobes & Gyri */}
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0M9 13a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* Neurological Tension Pulse Rays at Temples */}
          <path d="M3 7l2 1.5M2 11h2.5M3 15l2-1.5M21 7l-2 1.5M22 11h-2.5M21 15l-2-1.5" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )

    case 'back_pain':
    case 'spine':
    case 'back':
      return renderWrapper(
        withBackground,
        container,
        'bg-indigo-50 text-indigo-600 border border-indigo-200/80 group-hover:bg-indigo-100/70 group-hover:border-indigo-300 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Spinal Cord Center Axis */}
          <path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
          {/* Cervical Vertebra */}
          <rect x="8.5" y="3" width="7" height="2.5" rx="1.25" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
          {/* Thoracic Vertebrae */}
          <rect x="7.5" y="7.5" width="9" height="2.8" rx="1.4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
          <rect x="7" y="12" width="10" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
          {/* Lumbar Vertebra (Focal Spine Pain Area Highlighted) */}
          <rect x="6.5" y="16.5" width="11" height="3.5" rx="1.5" fill="#4f46e5" fillOpacity="0.25" stroke="#4f46e5" strokeWidth="1.9" />
          {/* Spinal Pain Nerve Radiations */}
          <path d="M3 18.25h2M19 18.25h2" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="18.25" r="1.1" fill="#4f46e5" />
        </svg>
      )

    case 'breathing':
    case 'breathlessness':
    case 'breath':
      return renderWrapper(
        withBackground,
        container,
        'bg-teal-50 text-teal-600 border border-teal-200/80 group-hover:bg-teal-100/70 group-hover:border-teal-300 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Inhalation Wave & Air Stream */}
          <path
            d="M9.5 8.5C10 5.5 12 4 15 4c3.3 0 6 2.7 6 6s-2.7 6-6 6H3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path d="M3 10h8M3 14h6M3 18h4" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )

    case 'knee_pain':
    case 'joint':
      return renderWrapper(
        withBackground,
        container,
        'bg-orange-50 text-orange-600 border border-orange-200/80 group-hover:bg-orange-100/70 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Joint Articulation Bones */}
          <path d="M12 3v7M12 14v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" stroke="#ea580c" strokeWidth="1.75" />
          <path d="M6 12h2M16 12h2" stroke="#ea580c" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )

    case 'skin_rash':
    case 'skin':
    case 'allergy':
      return renderWrapper(
        withBackground,
        container,
        'bg-pink-50 text-pink-600 border border-pink-200/80 group-hover:bg-pink-100/70 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Derma Layer & Rash Points */}
          <path d="M4 19c4-1 8 1 12 0s4-1 4-1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="8" cy="10" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="14" cy="7" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="17" cy="12" r="1.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )

    case 'eye_problem':
    case 'eye':
      return renderWrapper(
        withBackground,
        container,
        'bg-cyan-50 text-cyan-600 border border-cyan-200/80 group-hover:bg-cyan-100/70 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
          <circle cx="12" cy="12" r="3" stroke="#0891b2" strokeWidth="2" fill="#0891b2" fillOpacity="0.25" />
        </svg>
      )

    case 'ear_throat':
    case 'ent':
      return renderWrapper(
        withBackground,
        container,
        'bg-violet-50 text-violet-600 border border-violet-200/80 group-hover:bg-violet-100/70 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 3-1.5 5-2.5 6.5s-2 3-2 5a2 2 0 1 1-4 0c0-3 2-4.5 3-6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
          <path d="M10 10a2 2 0 0 1 3 2" stroke="#7c3aed" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )

    case 'urinary':
      return renderWrapper(
        withBackground,
        container,
        'bg-blue-50 text-blue-600 border border-blue-200/80 group-hover:bg-blue-100/70 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
          <path d="M12 9v6M9 12h6" stroke="#2563eb" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )

    case 'dizziness':
    case 'weakness':
      return renderWrapper(
        withBackground,
        container,
        'bg-yellow-50 text-yellow-700 border border-yellow-200/80 group-hover:bg-yellow-100/70 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M12 7v5l3 3" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2" fill="#ca8a04" />
        </svg>
      )

    case 'dental':
    case 'tooth':
      return renderWrapper(
        withBackground,
        container,
        'bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-slate-100 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Molar Tooth Vector */}
          <path
            d="M7 4c-2.5 0-4 2-4 4.5 0 3 1.5 6 2 9.5.3 2 1.5 3 2.5 3s1.5-1.5 2-4c.3-1.5.8-2 1.5-2s1.2.5 1.5 2c.5 2.5 1 4 2 4s2.2-1 2.5-3c.5-3.5 2-6.5 2-9.5 0-2.5-1.5-4.5-4-4.5-2 0-2.8 1-4 1s-2-1-4-1z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.15"
          />
        </svg>
      )

    case 'diabetes':
    case 'blood_sugar':
      return renderWrapper(
        withBackground,
        container,
        'bg-red-50 text-red-600 border border-red-200/80 group-hover:bg-red-100/70 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.18" />
          <circle cx="12" cy="13" r="2.5" fill="#dc2626" />
        </svg>
      )

    case 'other':
    default:
      return renderWrapper(
        withBackground,
        container,
        'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-slate-200/80 shadow-2xs',
        className,
        <svg viewBox="0 0 24 24" className={iconSize} fill="none" aria-hidden="true">
          {/* Stethoscope & Medical Cross */}
          <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M9 12.5v3.5a4 4 0 0 0 4 4h1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="18" cy="20" r="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 3h3M12 3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 9v6M15 12h6" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}

function renderWrapper(withBackground, container, colorClasses, extraClass, children) {
  if (!withBackground) {
    return <div className={`inline-flex items-center justify-center ${extraClass}`}>{children}</div>
  }
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-all ${container} ${colorClasses} ${extraClass}`}
    >
      {children}
    </div>
  )
}
