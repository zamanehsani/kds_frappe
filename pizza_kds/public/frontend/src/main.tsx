import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { initAudioUnlock } from '@/lib/sound'
import './index.css'
import App from './App.tsx'

initAudioUnlock()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <App />
        <Toaster position="bottom-center" />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
