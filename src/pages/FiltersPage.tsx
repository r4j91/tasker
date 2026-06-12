import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Flag, ChevronRight, Tags, Tag, Plus } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { LabelEditModal } from '../features/labels/LabelEditModal'
import { useRegisterVisible } from '../lib/useRegisterVisible'
import { TaskList } from '../features/tasks/TaskList'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import type { Priority } from '../features/tasks/types'

const PRIORITIES: Array<{ p: Priority; label: string; tint: string }> = [
  { p: 1, label: 'Prioridade 1', tint: 'var(--priority-1)' },
  { p: 2, label: 'Prioridade 2', tint: 'var(--priority-2)' },
  { p: 3, label: 'Prioridade 3', tint: 'var(--priority-3)' },
  { p: 4, label: 'Prioridade 4', tint: 'var(--ink-faint)' },
]

/** Tela "Filtros e etiquetas" — prioridades agora; etiquetas na melhoria 3. */
export function FiltersPage() {
  const tasks = useTaskStore(s => s.tasks)
  const labels = useTaskStore(s => s.labels)
  const [newLabelOpen, setNewLabelOpen] = useState(false)

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <PageHeader title="Filtros e etiquetas" />

      <div className="mb-1 px-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Prioridades
        </span>
      </div>

      {PRIORITIES.map(({ p, label, tint }) => {
        const count = tasks.filter(t => !t.completed && !t.parentId && t.priority === p).length
        return (
          <Link
            key={p}
            to={`/filtros/p/${p}`}
            className="flex min-h-[52px] w-full items-center gap-3 border-b border-line px-1 text-base transition-colors active:bg-surface md:text-sm"
          >
            <Flag size={18} fill={tint} style={{ color: tint }} />
            {label}
            <span className="ml-auto flex items-center gap-1 text-sm text-ink-faint">
              {count > 0 && count}
              <ChevronRight size={16} />
            </span>
          </Link>
        )
      })}

      <div className="mb-1 mt-7 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Etiquetas
        </span>
        <button
          onClick={() => setNewLabelOpen(true)}
          aria-label="Nova etiqueta"
          className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-ink md:size-8"
        >
          <Plus size={18} />
        </button>
      </div>

      {labels.length > 0 ? (
        labels.map(l => {
          const count = tasks.filter(t => !t.completed && !t.parentId && t.labels.includes(l.id)).length
          return (
            <Link
              key={l.id}
              to={`/etiqueta/${l.id}`}
              className="flex min-h-[52px] w-full items-center gap-3 border-b border-line px-1 text-base transition-colors active:bg-surface md:text-sm"
            >
              <Tag size={18} style={{ color: l.color }} fill={`${l.color}40`} />
              {l.name}
              <span className="ml-auto flex items-center gap-1 text-sm text-ink-faint">
                {count > 0 && count}
                <ChevronRight size={16} />
              </span>
            </Link>
          )
        })
      ) : (
        <p className="px-1 py-3 text-sm text-ink-faint">
          Nenhuma etiqueta ainda — toque em + para criar, ou use @nome ao adicionar uma tarefa.
        </p>
      )}

      <LabelEditModal open={newLabelOpen} onClose={() => setNewLabelOpen(false)} />
    </div>
  )
}

/** Lista filtrada por prioridade. */
export function PriorityFilterPage() {
  const { p } = useParams<{ p: string }>()
  const priority = Number(p) as Priority
  const tasks = useTaskStore(s => s.tasks)
  const meta = PRIORITIES.find(x => x.p === priority)

  const filtered = tasks
    .filter(t => !t.completed && !t.parentId && t.priority === priority)
    .sort((a, b) => a.order - b.order)

  useRegisterVisible(filtered.map(t => t.id))

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <PageHeader
        title={meta?.label ?? 'Prioridade'}
        subtitle={filtered.length > 0 ? `${filtered.length} ${filtered.length === 1 ? 'tarefa' : 'tarefas'}` : undefined}
      />
      {filtered.length > 0 ? (
        <TaskList tasks={filtered} reorderable={false} />
      ) : (
        <EmptyState
          icon={Tags}
          title="Nada por aqui"
          message="Nenhuma tarefa ativa com essa prioridade."
        />
      )}
    </div>
  )
}
