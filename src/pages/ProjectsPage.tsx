import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Plus, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { PROJECT_COLORS } from '../features/tasks/types'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/cn'

/** Lista de projetos — usada na navegação mobile */
export function ProjectsPage() {
  const projects = useTaskStore(s => s.projects)
  const tasks = useTaskStore(s => s.tasks)
  const addProject = useTaskStore(s => s.addProject)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0])

  const create = () => {
    if (!name.trim()) return
    addProject(name, color)
    setName('')
    setOpen(false)
  }

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <PageHeader
        title="Projetos"
        accessory={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={14} /> Novo
          </Button>
        }
      />

      {projects.length > 0 ? (
        <div className="flex flex-col gap-1">
          {projects.map(p => {
            const count = tasks.filter(t => !t.completed && t.projectId === p.id).length
            return (
              <Link
                key={p.id}
                to={`/projeto/${p.id}`}
                className="flex min-h-[52px] items-center gap-3 rounded-xl border border-line bg-surface-elevated px-4 transition-colors hover:border-line-strong"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ background: p.color }} />
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-ink-faint">
                  {count > 0 && count}
                  <ChevronRight size={15} />
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="Nenhum projeto"
          message="Projetos agrupam tarefas de um mesmo contexto: casa, trabalho, estudos..."
        />
      )}

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
                  className={cn(
                    'size-7 cursor-pointer rounded-full transition-transform hover:scale-110',
                    color === c && 'ring-2 ring-primary-ink ring-offset-2 ring-offset-canvas',
                  )}
                  style={{ background: c }}
                />
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
