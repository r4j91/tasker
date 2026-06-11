import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { InboxPage } from './pages/InboxPage'
import { TodayPage } from './pages/TodayPage'
import { UpcomingPage } from './pages/UpcomingPage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { DesignSystem } from './pages/DesignSystem'
import { useUiStore } from './stores/useUiStore'

export default function App() {
  const dark = useUiStore(s => s.dark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/design-system" element={<DesignSystem />} />
        <Route element={<AppShell />}>
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
