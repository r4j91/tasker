import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, Inbox, Plus, ChevronRight, Sun, Moon, Volume2, Keyboard,
} from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { useUiStore } from '../stores/useUiStore'
import { PROJECT_COLORS } from '../features/tasks/types'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/cn'

/** Tela "Navegar" (mobile) — entrada, projetos e preferências. */
export function BrowsePage() {
  const tasks = useTaskStore(s => s.tasks)
  const projects = useTaskStore(s => s.projects)
  const addProject = useTaskStore(s => s.addProject)
  const dark = useUiStore(s => s.dark)
  const toggleDark = useUiStore(s => s.toggleDark)
  const soundEnabled = useUiStore(s => s.soundEnabled)
  const setSoundEnabled = useUiStore(s => s.setSoundEnabled)
  const setPaletteOpen = useUiStore(s => s.setPaletteOpen)
  const setShortcutsOpen = useUiStore(s => s.setShortcutsOpen)
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0])

  const inboxCount = tasks.filter(t => !t.completed && !t.parentId && !t.projectId).length

  const create = () => {
    if (!name.trim()) return
    const p = addProject(name, color)
    setName('')
    setOpen(false)
    navigate(`/projeto/${p.id}`)
  }

  const Row = ({ children, onClick, to }: { children: React.ReactNode; onClick?: () => void; to?: string }) => {
    const cls = 'flex min-h-[52px] w-full cursor-pointer items-center gap-3 border-b border-line px-1 text-left text-base transition-colors active:bg-surface md:text-sm'
    if (to) return <Link to={to} className={cls}>{children}</Link>
    return <button onClick={onClick} className={cls}>{children}</button>
  }

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <PageHeader title="Navegar" />

      {/* Busca */}
      <Row onClick={() => setPaletteOpen(true)}>
        <Search size={20} className="text-ink-muted" />
        <span className="text-ink-muted">Buscar...</span>
      </Row>

      {/* Caixa de entrada */}
      <Row to="/">
        <Inbox size={20} className="text-primary-ink" />
        Caixa de entrada
        <span className="ml-auto flex items-center gap-1 text-sm text-ink-faint">
          {inboxCount > 0 && inboxCount}
          <ChevronRight size={16} />
        </span>
      </Row>

      {/* Projetos */}
      <div className="mb-1 mt-7 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Projetos
        </span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Novo projeto"
          className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-ink md:size-8"
        >
          <Plus size={18} />
        </button>
      </div>

      {projects.length > 0 ? (
        projects.map(p => {
          const count = tasks.filter(t => !t.completed && !t.parentId && t.projectId === p.id).length
          return (
            <Row key={p.id} to={`/projeto/${p.id}`}>
              <span className="size-3 shrink-0 rounded-full" style={{ background: p.color }} />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto flex items-center gap-1 text-sm text-ink-faint">
                {count > 0 && count}
                <ChevronRight size={16} />
              </span>
            </Row>
          )
        })
      ) : (
        <p className="border-b border-line px-1 py-4 text-sm text-ink-faint">
          Nenhum projeto ainda — toque em + para criar.
        </p>
      )}

      {/* Preferências */}
      <div className="mb-1 mt-7 px-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Preferências
        </span>
      </div>

      <Row onClick={toggleDark}>
        {dark ? <Sun size={20} className="text-ink-muted" /> : <Moon size={20} className="text-ink-muted" />}
        {dark ? 'Tema claro' : 'Tema escuro'}
      </Row>

      <Row onClick={() => setSoundEnabled(!soundEnabled)}>
        <Volume2 size={20} className="text-ink-muted" />
        Som ao concluir
        <span
          className={cn(
            'ml-auto flex h-7 w-12 items-center rounded-full px-1 transition-colors',
            soundEnabled ? 'justify-end bg-primary' : 'justify-start bg-line-strong',
          )}
        >
          <span className="size-5 rounded-full bg-white shadow-[var(--shadow-sm)]" />
        </span>
      </Row>

      <Row onClick={() => setShortcutsOpen(true)}>
        <Keyboard size={20} className="text-ink-muted" />
        Atalhos de teclado
      </Row>

      {/* Modal novo projeto */}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo projeto">
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Ex.: Pessoal, Trabalho..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            autoFocus
          />
          <div>
            <p className="mb-2 text-[13px] font-medium">Cor</p>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Cor ${c}`}
                  className="flex size-11 cursor-pointer items-center justify-center md:size-9"
                >
                  <span
                    className={cn(
                      'size-8 rounded-full transition-transform hover:scale-110 md:size-7',
                      color === c && 'ring-2 ring-primary-ink ring-offset-2 ring-offset-canvas',
                    )}
                    style={{ background: c }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create} disabled={!name.trim()}>Criar projeto</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
