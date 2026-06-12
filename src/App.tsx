import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AppShell } from './components/AppShell'
import { InboxPage } from './pages/InboxPage'
import { TodayPage } from './pages/TodayPage'
import { UpcomingPage } from './pages/UpcomingPage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { BrowsePage } from './pages/BrowsePage'
import { FiltersPage, PriorityFilterPage } from './pages/FiltersPage'
import { LabelViewPage } from './pages/LabelViewPage'
import { DesignSystem } from './pages/DesignSystem'
import { useUiStore } from './stores/useUiStore'

export default function App() {
  const dark = useUiStore(s => s.dark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <Routes>
        <Route path="/design-system" element={<DesignSystem />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<InboxPage />} />
          <Route path="/hoje" element={<TodayPage />} />
          <Route path="/em-breve" element={<UpcomingPage />} />
          <Route path="/projetos" element={<ProjectsPage />} />
          <Route path="/navegar" element={<BrowsePage />} />
          <Route path="/filtros" element={<FiltersPage />} />
          <Route path="/filtros/p/:p" element={<PriorityFilterPage />} />
          <Route path="/etiqueta/:id" element={<LabelViewPage />} />
          <Route path="/projeto/:id" element={<ProjectPage />} />
          <Route path="*" element={<InboxPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </MotionConfig>
  )
}
