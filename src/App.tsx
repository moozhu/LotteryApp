import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useLotteryStore } from '@/store/lottery'
import HomePage from '@/pages/HomePage'
import DrawPage from '@/pages/DrawPage'
import SettingsPage from '@/pages/SettingsPage'
import { Toaster } from '@/components/ui/Toaster'
import { soundManager } from '@/lib/sound'

export default function App() {
  const { theme, fontFamily, soundEnabled } = useLotteryStore(s => s.settings)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    // Apply font to both html and body for complete coverage
    const fontStack = fontFamily === 'serif' 
      ? '"Noto Serif SC", "Songti SC", serif' 
      : '"Inter", "Noto Sans SC", system-ui, sans-serif'
    document.documentElement.style.fontFamily = fontStack
    document.body.style.fontFamily = fontStack
    
    // Add font-family class to ensure all elements inherit
    document.body.classList.remove('font-sans', 'font-serif')
    document.body.classList.add(fontFamily === 'serif' ? 'font-serif' : 'font-sans')
  }, [theme, fontFamily])

  // Sync sound settings
  useEffect(() => {
    soundManager.setEnabled(soundEnabled)
  }, [soundEnabled])

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/draw/:prizeId" element={<DrawPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <Toaster />
    </div>
  )
}
