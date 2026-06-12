import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/index.css'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  // Sonda de testes — apenas em desenvolvimento
  import('./stores/useTaskStore').then(m => {
    ;(window as unknown as Record<string, unknown>).__taskStore = m.useTaskStore
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
