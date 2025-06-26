import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
import { AppProvider } from './appProvider'
import { Button } from './components/ui/button'
import { registerSW } from 'virtual:pwa-register'

// Register Firebase Messaging Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log(
          'Firebase messaging service worker registered:',
          registration,
        )
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err)
      })
  })
}

export function UpdatePrompt({
  open,
  onReload,
}: {
  open: boolean
  onReload: () => void
}) {
  return (
    <Drawer open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Update Available</DrawerTitle>
        </DrawerHeader>
        <div className="py-2">A new version of Cake Cafe is available.</div>
        <DrawerFooter>
          <Button onClick={onReload}>Reload</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function Root() {
  const [showUpdate, setShowUpdate] = useState(false)

  registerSW({
    onNeedRefresh() {
      setShowUpdate(true)
    },
  })

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <>
      <AppProvider />
      <UpdatePrompt open={showUpdate} onReload={handleReload} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
