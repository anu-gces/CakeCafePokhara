import errorSound from '@/assets/error.mp3'
import successSound from '@/assets/success.mp3'
import notificationsSound from '@/assets/notification.mp3'
// Play error sound
export function playErrorSound() {
  const audio = new Audio(errorSound)
  audio.play()
}

// Play success sound
export function playSuccessSound() {
  const audio = new Audio(successSound)
  audio.play()
}

// Play notifications sound
export function playNotificationsSound() {
  const audio = new Audio(notificationsSound)
  audio.play()
}
