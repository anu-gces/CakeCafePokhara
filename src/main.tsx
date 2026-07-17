import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './appProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider />
  </StrictMode>,
)
