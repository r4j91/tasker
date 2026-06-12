import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tag, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { useRegisterVisible } from '../lib/useRegisterVisible'
import { TaskList } from '../features/tasks/TaskList'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { LabelEditModal } from '../features/labels/LabelEditModal'

/** Visão filtrada por etiqueta. */
export function LabelViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const labels = useTaskStore(s => s.labels)
  const tasks = useTaskStore(s => s.tasks)
  const deleteLabel = useTaskStore(s => s.deleteLabel)

  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const label = labels.find(l => l.id === id)

  const filtered = tasks
    .filter(t => !t.completed && !t.parentId && label && t.labels.includes(label.id))
    .sort((a, b) => a.order - b.order)

  useRegisterVisible(filtered.map(t => t.id))

  if (!label) {
    return (
      <div className="page-wrap pt-10">
        <EmptyState
          icon={Tag}
          title="Etiqueta não encontrada"
          message="Ela pode ter sido excluída."
        />
      </div>
    )
  }

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Tag size={22} style={{ color: label.color }} fill="none" />
          <h1 className="truncate text-[28px] font-bold tracking-[-0.02em] md:text-2xl">
            {label.name}
          </h1>
        </div>

        <div className="relative">
          <Button
            variant="ghost" size="sm" aria-label="Opções da etiqueta"
            onClick={() => setMenuOpen(o => !o)}
            className="max-md:min-w-11"
          >
            <MoreHorizontal size={16} />
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-surface-elevated py-1 shadow-[var(--shadow-md)]">
                <button
                  onClick={() => { setEditOpen(true); setMenuOpen(false) }}
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm hover:bg-surface md:min-h-9"
                >
                  <Pencil size={13} /> Editar
                </button>
                <button
                  onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm text-overdue hover:bg-overdue-bg md:min-h-9"
                >
                  <Trash2 size={13} /> Excluir etiqueta
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mb-6 min-h-5 text-sm text-ink-muted">
        {filtered.length > 0 &&
          (filtered.length === 1 ? '1 tarefa' : `${filtered.length} tarefas`)}
      </p>

      {filtered.length > 0 ? (
        <TaskList tasks={filtered} reorderable={false} />
      ) : (
        <EmptyState
          icon={Tag}
          title="Nenhuma tarefa com esta etiqueta"
          message={`Use @${label.name} ao criar uma tarefa para vê-la aqui.`}
        />
      )}

      <LabelEditModal open={editOpen} onClose={() => setEditOpen(false)} label={label} />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir etiqueta">
        <p className="mb-4 text-sm text-ink-muted">
          A etiqueta <strong className="text-ink">{label.name}</strong> será removida de todas as
          tarefas. Essa ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={() => { deleteLabel(label.id); navigate('/filtros') }}
          >
            Excluir etiqueta
          </Button>
        </div>
      </Modal>
    </div>
  )
}
