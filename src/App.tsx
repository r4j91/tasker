import { useState, useEffect } from 'react'
import { Home } from './pages/Home'
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
  const isDesignSystem = window.location.pathname.startsWith('/design-system')

  return isDesignSystem
    ? <DesignSystem dark={dark} onToggle={toggle} />
    : <Home />
}
