// ==========================================
// ArogyaDarpan — Native Camera Service
// Safely wraps Capacitor Camera for Android while allowing clean web bundling
// ==========================================

export function isNativePlatform() {
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    return true
  }
  return false
}

export async function captureNativePhoto() {
  try {
    if (isNativePlatform()) {
      const moduleName = '@capacitor/camera'
      const { Camera, CameraResultType, CameraSource } = await import(/* @vite-ignore */ moduleName)
      const photo = await Camera.getPhoto({
        quality: 88,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      })
      return photo.dataUrl
    }
  } catch (err) {
    console.warn('Native camera capture failed or cancelled:', err)
  }
  return null
}
