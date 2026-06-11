import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { InboxPage } from './pages/InboxPage'
import { TodayPage } from './pages/TodayPage'
import { UpcomingPage } from './pages/UpcomingPage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { DesignSystem } from './pages/DesignSystem'

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}

export default function App() {
  const { dark, toggle } = useTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/design-system" element={<DesignSystem dark={dark} onToggle={toggle} />} />
        <Route element={<AppShell dark={dark} onToggleTheme={toggle} />}>
          <Route path="/" element={<InboxPage />} />
          <Route path="/hoje" element={<TodayPage />} />
          <Route path="/em-breve" element={<UpcomingPage />} />
          <Route path="/projetos" element={<ProjectsPage />} />
          <Route path="/projeto/:id" element={<ProjectPage />} />
          <Route path="*" element={<InboxPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
