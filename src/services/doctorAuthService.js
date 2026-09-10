// ============================
// ArogyaDarpan — Doctor Authentication & Session Service
// Manages doctor authentication, registration license profile, and session persistence
// ============================

export const DEFAULT_DOCTOR_PROFILE = {
  id: 'doc-001',
  name: 'Dr. Ananya Sharma',
  email: 'dr.ananya@apexhealth.in',
  registrationNumber: 'DMC-2018-4921',
  council: 'Delhi Medical Council',
  department: 'Cardiology OPD',
  hospital: 'Apex Health Center',
  room: 'OPD Room 204, East Wing',
  qualifications: 'MBBS, MD (General Medicine), DM (Cardiology)',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI_vnaonz1_3Nzdgz6hH7_03cwDYwEEpn8cLmuZa2dxh3Jkp0OnCq5e7o5uB4JRzoWIQKylgRbAw_KLNFgpe9_mDpmSjJ2S_lWN7GJSU5JeVGai4MFaLdNKtIuvcmWh3mR_T1lNUxZr2E_YRz6A6U7gYMoB8TlhFSLDMoiM75Iiev51tQcz2lYsQrtc4gzki9DTUDp6XLhszNCJ05i59NiNzQuH5aV9eQC__mFxevP1t2XE3X09Arm',
}

const DOCTOR_AUTH_KEY = 'arogya_doctor_auth'

/**
 * Check whether the doctor is currently authenticated
 */
export function isDoctorAuthenticated() {
  try {
    const data = localStorage.getItem(DOCTOR_AUTH_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return Boolean(parsed && parsed.isAuthenticated)
    }
  } catch {
    // Ignore parse issues
  }
  return false
}

/**
 * Retrieve current authenticated doctor's profile
 */
export function getDoctorProfile() {
  try {
    const data = localStorage.getItem(DOCTOR_AUTH_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed && parsed.doctor) {
        return parsed.doctor
      }
    }
  } catch {
    // Ignore parse issues
  }
  return DEFAULT_DOCTOR_PROFILE
}

/**
 * Authenticate doctor with credentials or 1-tap demo login
 */
export function loginDoctor({ identifier = '', pin = '', rememberMe = true } = {}) {
  // Allow default credentials or demo login
  const doctor = {
    ...DEFAULT_DOCTOR_PROFILE,
    lastLoginAt: new Date().toISOString(),
  }

  const sessionData = {
    isAuthenticated: true,
    doctor,
    loggedInAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(DOCTOR_AUTH_KEY, JSON.stringify(sessionData))
  } catch (e) {
    console.warn('Could not persist doctor session:', e)
  }

  return { success: true, doctor }
}

/**
 * Log out doctor and clear session
 */
export function logoutDoctor() {
  try {
    localStorage.removeItem(DOCTOR_AUTH_KEY)
  } catch {
    // Ignore storage issues
  }
}
