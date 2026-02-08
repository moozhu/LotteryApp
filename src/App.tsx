import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useLotteryStore } from '@/store/lottery'
import HomePage from '@/pages/HomePage'
import DrawPage from '@/pages/DrawPage'
import SettingsPage from '@/pages/SettingsPage'
import { Toaster } from '@/components/ui/Toaster'

export default function App() {
  const theme = useLotteryStore(s => s.settings.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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
