import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Inbox, CalendarDays, CalendarRange, FolderOpen, Plus, Sun, Moon, Search } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { useUiStore } from '../stores/useUiStore'
import { PROJECT_COLORS, type Priority } from '../features/tasks/types'
import { isDueToday, isOverdue } from '../lib/dates'
import { playCompleteSound } from '../lib/sound'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { UndoToast } from './UndoToast'
import { SelectionBar } from './SelectionBar'
import { CommandPalette } from './CommandPalette'
import { ShortcutsModal } from './ShortcutsModal'
import { cn } from '../lib/cn'


const navItem = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-lg px-3 h-9 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary-subtle text-primary-ink'
      : 'text-ink-muted hover:text-ink hover:bg-surface',
  )

export function AppShell() {
  const dark = useUiStore(s => s.dark)
  const onToggleTheme = useUiStore(s => s.toggleDark)
  const projects = useTaskStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  const addProject = useTaskStore(s => s.addProject)
  const navigate = useNavigate()

  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState<string>(PROJECT_COLORS[0])

  /* ── Atalhos globais de teclado ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return

      const ui = useUiStore.getState()
      if (ui.paletteOpen || ui.shortcutsOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault(); ui.moveSelection(1); break
        case 'ArrowUp':
          e.preventDefault(); ui.moveSelection(-1); break
        case 'Enter':
          if (ui.selectedId) { e.preventDefault(); ui.toggleExpanded(ui.selectedId) }
          break
        case 'e': case 'E': {
          if (!ui.selectedId) break
          e.preventDefault()
          const store = useTaskStore.getState()
          const task = store.tasks.find(t => t.id === ui.selectedId)
          if (task && !task.completed && ui.soundEnabled) playCompleteSound()
          store.toggleComplete(ui.selectedId)
          break
        }
        case '1': case '2': case '3': case '4':
          if (ui.selectedId) {
            e.preventDefault()
            useTaskStore.getState().updateTask(ui.selectedId, { priority: Number(e.key) as Priority })
          }
          break
        case 't': case 'T':
          e.preventDefault(); navigate('/hoje'); break
        case '?':
          e.preventDefault(); ui.setShortcutsOpen(true); break
        case 'Escape':
          if (ui.expandedId) ui.setExpanded(null)
          else if (ui.selectedId) ui.setSelected(null)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const todayCount = tasks.filter(
    t => !t.completed && t.dueDate && (isDueToday(t.dueDate) || isOverdue(t.dueDate)),
  ).length
  const inboxCount = tasks.filter(t => !t.completed && !t.projectId).length

  const createProject = () => {
    if (!projectName.trim()) return
    const p = addProject(projectName, projectColor)
    setProjectName('')
    setNewProjectOpen(false)
    navigate(`/projeto/${p.id}`)
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">

      {/* ── Sidebar (desktop) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface/60 px-3 pt-5 pb-4 md:flex">
        <div className="mb-6 flex items-center justify-between px-3">
          <span className="text-[15px] font-bold tracking-tight">TASKER</span>
          <button
            onClick={onToggleTheme}
            aria-label="Alternar tema"
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface hover:text-ink"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <button
          onClick={() => useUiStore.getState().setPaletteOpen(true)}
          className="mb-4 flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-sm text-ink-faint transition-colors hover:border-line-strong"
        >
          <Search size={14} />
          Buscar...
          <kbd className="ml-auto rounded border border-line bg-surface px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <nav className="flex flex-col gap-0.5">
          <NavLink to="/" end className={navItem}>
            <Inbox size={16} />
            Caixa de entrada
            {inboxCount > 0 && <span className="ml-auto text-xs text-ink-faint">{inboxCount}</span>}
          </NavLink>
          <NavLink to="/hoje" className={navItem}>
            <CalendarDays size={16} />
            Hoje
            {todayCount > 0 && <span className="ml-auto text-xs text-ink-faint">{todayCount}</span>}
          </NavLink>
          <NavLink to="/em-breve" className={navItem}>
            <CalendarRange size={16} />
            Em breve
          </NavLink>
        </nav>

        <div className="mt-7 mb-1.5 flex items-center justify-between px-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Projetos
          </span>
          <button
            onClick={() => setNewProjectOpen(true)}
            aria-label="Novo projeto"
            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface hover:text-ink"
          >
            <Plus size={14} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 overflow-y-auto">
          {projects.map(p => (
            <NavLink key={p.id} to={`/projeto/${p.id}`} className={navItem}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
            </NavLink>
          ))}
          {projects.length === 0 && (
            <p className="px-3 py-1 text-xs text-ink-faint">Nenhum projeto ainda</p>
          )}
        </nav>
      </aside>

      {/* ── Conteúdo ── */}
      <main className="pb-24 pt-[env(safe-area-inset-top)] md:pb-10 md:pl-60">
        <Outlet />
      </main>

      {/* ── Navegação inferior (mobile) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
          {[
            { to: '/', icon: Inbox, label: 'Entrada', end: true },
            { to: '/hoje', icon: CalendarDays, label: 'Hoje' },
            { to: '/em-breve', icon: CalendarRange, label: 'Em breve' },
            { to: '/projetos', icon: FolderOpen, label: 'Projetos' },
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary-ink' : 'text-ink-faint',
                )
              }
            >
              <Icon size={21} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => useUiStore.getState().setPaletteOpen(true)}
            className="flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-ink-faint transition-colors"
          >
            <Search size={21} />
            Buscar
          </button>
        </div>
      </nav>

      {/* ── Modal: novo projeto ── */}
      <Modal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} title="Novo projeto">
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Ex.: Pessoal, Trabalho..."
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProject()}
            autoFocus
          />
          <div>
            <p className="mb-2 text-[13px] font-medium">Cor</p>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setProjectColor(c)}
                  aria-label={`Cor ${c}`}
                  className="flex size-11 cursor-pointer items-center justify-center md:size-9"
                >
                  <span
                    className={cn(
                      'size-8 rounded-full transition-transform hover:scale-110 md:size-7',
                      projectColor === c && 'ring-2 ring-primary-ink ring-offset-2 ring-offset-canvas',
                    )}
                    style={{ background: c }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setNewProjectOpen(false)}>Cancelar</Button>
            <Button onClick={createProject} disabled={!projectName.trim()}>Criar projeto</Button>
          </div>
        </div>
      </Modal>

      <UndoToast />
      <SelectionBar />
      <CommandPalette />
      <ShortcutsModal />
    </div>
  )
}
