import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Inbox, CalendarDays, CalendarRange, FolderOpen,
  CheckCircle2, Moon, Keyboard, Volume2, VolumeX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { useUiStore } from '../stores/useUiStore'
import { cn } from '../lib/cn'

interface PaletteItem {
  id: string
  icon: LucideIcon
  label: string
  hint?: string
  /** Cor do dot de projeto */
  color?: string
  run: () => void
}

export function CommandPalette() {
  const open = useUiStore(s => s.paletteOpen)
  const setOpen = useUiStore(s => s.setPaletteOpen)

  /* Cmd/Ctrl+K abre / Esc fecha */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useUiStore.getState().paletteOpen)
      }
      if (e.key === 'Escape' && useUiStore.getState().paletteOpen) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/30"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          />
          {/* Conteúdo remonta a cada abertura — estado sempre limpo */}
          <PaletteContent onClose={() => setOpen(false)} />
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function PaletteContent({ onClose }: { onClose: () => void }) {
  const onToggleTheme = useUiStore(s => s.toggleDark)
  const setShortcutsOpen = useUiStore(s => s.setShortcutsOpen)
  const soundEnabled = useUiStore(s => s.soundEnabled)
  const setSoundEnabled = useUiStore(s => s.setSoundEnabled)
  const setDetailTask = useUiStore(s => s.setDetailTask)

  const tasks = useTaskStore(s => s.tasks)
  const projects = useTaskStore(s => s.projects)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase()

    const actions: PaletteItem[] = [
      { id: 'go-inbox',    icon: Inbox,         label: 'Ir para Caixa de entrada', hint: 'Navegar', run: () => { navigate('/'); onClose() } },
      { id: 'go-today',    icon: CalendarDays,  label: 'Ir para Hoje',             hint: 'Navegar', run: () => { navigate('/hoje'); onClose() } },
      { id: 'go-upcoming', icon: CalendarRange, label: 'Ir para Em breve',         hint: 'Navegar', run: () => { navigate('/em-breve'); onClose() } },
      { id: 'go-projects', icon: FolderOpen,    label: 'Navegar (projetos e mais)', hint: 'Navegar', run: () => { navigate('/navegar'); onClose() } },
      { id: 'theme',       icon: Moon,          label: 'Alternar tema claro/escuro', hint: 'Ação',  run: () => { onToggleTheme(); onClose() } },
      {
        id: 'sound', icon: soundEnabled ? VolumeX : Volume2,
        label: soundEnabled ? 'Desativar som de conclusão' : 'Ativar som de conclusão',
        hint: 'Ação',
        run: () => { setSoundEnabled(!soundEnabled); onClose() },
      },
      { id: 'shortcuts',   icon: Keyboard,      label: 'Atalhos de teclado',       hint: '?',       run: () => { onClose(); setShortcutsOpen(true) } },
    ]

    const projectItems: PaletteItem[] = projects.map(p => ({
      id: `proj-${p.id}`,
      icon: FolderOpen,
      label: p.name,
      hint: 'Projeto',
      color: p.color,
      run: () => { navigate(`/projeto/${p.id}`); onClose() },
    }))

    const taskItems: PaletteItem[] = q
      ? tasks
          .filter(t => !t.completed && !t.parentId && t.title.toLowerCase().includes(q))
          .slice(0, 6)
          .map(t => ({
            id: `task-${t.id}`,
            icon: CheckCircle2,
            label: t.title,
            hint: 'Tarefa',
            run: () => {
              navigate(t.projectId ? `/projeto/${t.projectId}` : '/')
              setDetailTask(t.id)
              onClose()
            },
          }))
      : []

    const all = [...taskItems, ...actions, ...projectItems]
    if (!q) return all
    return all.filter(i => i.label.toLowerCase().includes(q))
  }, [query, tasks, projects, soundEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, items.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && items[index]) { e.preventDefault(); items[index].run() }
  }

  /* Mantém o item selecionado visível */
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${index}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [index])

  return (
    <motion.div
      role="dialog" aria-modal="true" aria-label="Busca global"
      className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-[var(--shadow-lg)]"
      initial={{ opacity: 0, scale: 0.97, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -8 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-2.5 border-b border-line px-4">
        <Search size={16} className="shrink-0 text-ink-faint" />
        <input
          autoFocus
          value={query}
          onChange={e => { setQuery(e.target.value); setIndex(0) }}
          onKeyDown={onKeyDown}
          placeholder="Buscar tarefas, projetos ou ações..."
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
        <kbd className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-ink-faint">esc</kbd>
      </div>

      <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
        {items.length > 0 ? (
          items.map((item, i) => (
            <button
              key={item.id}
              data-idx={i}
              onClick={item.run}
              onMouseMove={() => setIndex(i)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors',
                'min-h-11 md:min-h-9',
                i === index ? 'bg-primary-subtle text-primary-ink' : 'text-ink',
              )}
            >
              {item.color ? (
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              ) : (
                <item.icon size={15} className={cn('shrink-0', i === index ? '' : 'text-ink-faint')} />
              )}
              <span className="truncate">{item.label}</span>
              {item.hint && (
                <span className="ml-auto shrink-0 text-[11px] text-ink-faint">{item.hint}</span>
              )}
            </button>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-sm text-ink-muted">
            Nada encontrado para “{query}”
          </p>
        )}
      </div>
    </motion.div>
  )
}
