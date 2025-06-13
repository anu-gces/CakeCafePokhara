import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './appProvider'

// Register Firebase Messaging Service Worker
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/firebase-messaging-sw.js')
//       .then((registration) => {
//         console.log(
//           'Firebase messaging service worker registered:',
//           registration,
//         )
//       })
//       .catch((err) => {
//         console.error('Service worker registration failed:', err)
//       })
//   })
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider />
  </StrictMode>,
)
