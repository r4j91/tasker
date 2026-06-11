import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FolderOpen, MoreHorizontal, Trash2, Pencil, Check } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { SectionedTasks } from '../features/tasks/SectionedTasks'
import { QuickAdd } from '../features/tasks/QuickAdd'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useRegisterVisible } from '../lib/useRegisterVisible'
import { CompletedSection } from '../features/tasks/CompletedSection'

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projects = useTaskStore(s => s.projects)
  const sections = useTaskStore(s => s.sections)
  const tasks = useTaskStore(s => s.tasks)
  const updateProject = useTaskStore(s => s.updateProject)
  const deleteProject = useTaskStore(s => s.deleteProject)

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const project = projects.find(p => p.id === id)

  const projectSections = sections
    .filter(s => s.projectId === project?.id)
    .sort((a, b) => a.order - b.order)
  const hasSections = projectSections.length > 0

  const projectTasks = tasks
    .filter(t => !t.completed && t.projectId === project?.id)
    .sort((a, b) => a.order - b.order)
  const completedTasks = tasks.filter(t => t.completed && t.projectId === project?.id)

  /* Ordem visível: grupo sem seção primeiro, depois cada seção */
  const visibleOrdered = [
    ...projectTasks.filter(t => !t.sectionId),
    ...projectSections.flatMap(sec => projectTasks.filter(t => t.sectionId === sec.id)),
  ]
  useRegisterVisible(visibleOrdered.map(t => t.id))

  if (!project) {
    return (
      <div className="page-wrap pt-10">
        <EmptyState
          icon={FolderOpen}
          title="Projeto não encontrado"
          message="Ele pode ter sido excluído. Volte para a caixa de entrada."
        />
      </div>
    )
  }

  const saveName = () => {
    if (name.trim()) updateProject(project.id, { name: name.trim() })
    setEditing(false)
  }

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="size-3 shrink-0 rounded-full" style={{ background: project.color }} />
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false) }}
                autoFocus
                className="border-b border-primary bg-transparent text-2xl font-bold tracking-[-0.02em] outline-none"
              />
              <button onClick={saveName} aria-label="Salvar nome" className="cursor-pointer text-done"><Check size={18} /></button>
            </div>
          ) : (
            <h1 className="truncate text-[28px] font-bold tracking-[-0.02em] md:text-2xl">{project.name}</h1>
          )}
        </div>

        <div className="relative">
          <Button
            variant="ghost" size="sm" aria-label="Opções do projeto"
            onClick={() => setMenuOpen(o => !o)}
          >
            <MoreHorizontal size={16} />
          </Button>
          {menuOpen && (
            <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-surface-elevated py-1 shadow-[var(--shadow-md)]">
              <button
                onClick={() => { setName(project.name); setEditing(true); setMenuOpen(false) }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface"
              >
                <Pencil size={13} /> Renomear
              </button>
              <button
                onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-overdue hover:bg-overdue-bg"
              >
                <Trash2 size={13} /> Excluir projeto
              </button>
            </div>
            </>
          )}
        </div>
      </div>

      <QuickAdd projectId={project.id} />

      {projectTasks.length === 0 && !hasSections && (
        <EmptyState
          icon={FolderOpen}
          title="Projeto em branco"
          message="Adicione a primeira tarefa e dê vida a este projeto."
        />
      )}
      <SectionedTasks projectId={project.id} />
      <CompletedSection tasks={completedTasks} hideProject />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir projeto">
        <p className="mb-4 text-sm text-ink-muted">
          As tarefas de <strong className="text-ink">{project.name}</strong> voltarão para a caixa de entrada. Essa ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={() => { deleteProject(project.id); navigate('/') }}
          >
            Excluir projeto
          </Button>
        </div>
      </Modal>
    </div>
  )
}
