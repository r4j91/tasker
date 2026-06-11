import { Link, useParams } from 'react-router-dom'
import { Flag, ChevronRight, Tags } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
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

      <div className="mb-1 mt-7 px-1">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Etiquetas
        </span>
      </div>
      <p className="px-1 py-3 text-sm text-ink-faint">
        Etiquetas com cores chegam na próxima atualização.
      </p>
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
