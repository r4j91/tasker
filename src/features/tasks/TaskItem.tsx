import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Flag, Trash2, FolderOpen } from 'lucide-react'
import type { Task, Priority } from './types'
import { useTaskStore } from '../../stores/useTaskStore'
import { Checkbox } from '../../components/ui/Checkbox'
import { Button } from '../../components/ui/Button'
import { dueLabel, isOverdue, isDueToday } from '../../lib/dates'
import { cn } from '../../lib/cn'

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  1: { label: 'P1', cls: 'text-overdue' },
  2: { label: 'P2', cls: 'text-today' },
  3: { label: 'P3', cls: 'text-primary-ink' },
  4: { label: 'P4', cls: 'text-ink-faint' },
}

interface TaskItemProps {
  task: Task
  /** Oculta o nome do projeto (na tela do próprio projeto) */
  hideProject?: boolean
}

export function TaskItem({ task, hideProject }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const toggleComplete = useTaskStore(s => s.toggleComplete)
  const updateTask = useTaskStore(s => s.updateTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const projects = useTaskStore(s => s.projects)

  const project = projects.find(p => p.id === task.projectId)
  const due = task.dueDate
  const dueTone = due
    ? isOverdue(due) ? 'text-overdue' : isDueToday(due) ? 'text-today' : 'text-ink-muted'
    : ''

  return (
    <div
      className={cn(
        'rounded-xl border border-transparent transition-colors',
        expanded && 'border-line bg-surface-elevated shadow-[var(--shadow-md)]',
      )}
    >
      {/* Linha principal */}
      <div className="flex items-center gap-1 pl-2 pr-1">
        <Checkbox
          checked={task.completed}
          onChange={() => toggleComplete(task.id)}
          className="w-auto shrink-0"
        />
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 text-left"
        >
          <span
            className={cn(
              'truncate text-sm',
              task.completed && 'text-ink-faint line-through',
            )}
          >
            {task.title}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {task.priority < 4 && (
              <Flag size={12} className={PRIORITY_META[task.priority].cls} fill="currentColor" />
            )}
            {due && (
              <span className={cn('text-xs', dueTone)}>{dueLabel(due)}</span>
            )}
            {project && !hideProject && (
              <span className="size-2 rounded-full" style={{ background: project.color }} />
            )}
          </span>
        </button>
      </div>

      {/* Edição inline */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pb-3 pt-1">
              <textarea
                value={task.notes}
                onChange={e => updateTask(task.id, { notes: e.target.value })}
                placeholder="Notas..."
                rows={2}
                className="w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-sm placeholder:text-ink-faint focus:border-primary focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                {/* Data */}
                <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-ink-muted transition-colors hover:border-line-strong">
                  <Calendar size={13} />
                  <input
                    type="date"
                    value={task.dueDate ?? ''}
                    onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                    className="cursor-pointer bg-transparent text-xs text-ink outline-none"
                  />
                </label>

                {/* Projeto */}
                <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-ink-muted transition-colors hover:border-line-strong">
                  <FolderOpen size={13} />
                  <select
                    value={task.projectId ?? ''}
                    onChange={e => updateTask(task.id, { projectId: e.target.value || null })}
                    className="cursor-pointer bg-transparent text-xs text-ink outline-none"
                  >
                    <option value="">Entrada</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                {/* Prioridade */}
                <div className="flex h-8 items-center gap-0.5 rounded-lg border border-line px-1">
                  {([1, 2, 3, 4] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => updateTask(task.id, { priority: p })}
                      aria-label={`Prioridade ${p}`}
                      className={cn(
                        'flex size-6 cursor-pointer items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                        task.priority === p
                          ? cn('bg-surface', PRIORITY_META[p].cls)
                          : 'text-ink-faint hover:bg-surface',
                      )}
                    >
                      {PRIORITY_META[p].label}
                    </button>
                  ))}
                </div>

                {/* Excluir */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { deleteTask(task.id); setExpanded(false) }}
                  className="ml-auto text-overdue hover:text-overdue hover:bg-overdue-bg"
                >
                  <Trash2 size={14} />
                  Excluir
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
