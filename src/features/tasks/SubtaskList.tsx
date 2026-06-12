import { useState } from 'react'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import { Plus, X, GripVertical } from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'
import { useUiStore } from '../../stores/useUiStore'
import { Checkbox } from '../../components/ui/Checkbox'
import { RollingNumber } from '../../components/ui/RollingNumber'
import { playCompleteSound } from '../../lib/sound'
import { parseTask } from '../../lib/nlparse'
import { cn } from '../../lib/cn'

/* No touch o arraste de reordenar conflita com o toque normal */
const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

interface SubtaskListProps {
  parentId: string
  /** Cabeçalho "Sub-tarefas N/M" no topo do bloco */
  header?: boolean
}

/** Bloco compacto de sub-tarefas — padrão Todoist. */
export function SubtaskList({ parentId, header }: SubtaskListProps) {
  const tasks = useTaskStore(s => s.tasks)
  const addTask = useTaskStore(s => s.addTask)
  const toggleComplete = useTaskStore(s => s.toggleComplete)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const reorderTasks = useTaskStore(s => s.reorderTasks)
  const soundEnabled = useUiStore(s => s.soundEnabled)

  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  const subtasks = tasks
    .filter(t => t.parentId === parentId)
    .sort((a, b) => a.order - b.order)
  const done = subtasks.filter(t => t.completed).length

  const submit = () => {
    const { projects, labels } = useTaskStore.getState()
    const parsed = parseTask(title, projects, labels)
    if (!parsed.title.trim()) return
    addTask({
      title: parsed.title,
      parentId,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      labels: parsed.labelIds,
    })
    setTitle('')
  }

  const complete = (id: string, completed: boolean) => {
    if (!completed && soundEnabled) playCompleteSound()
    toggleComplete(id)
  }

  return (
    <div>
      {header && (
        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="text-[13px] font-semibold">Sub-tarefas</span>
          {subtasks.length > 0 && (
            <span className="text-xs tabular-nums text-ink-muted">
              <RollingNumber value={done} />/{subtasks.length}
            </span>
          )}
        </div>
      )}

      {subtasks.length > 0 && (
        <Reorder.Group
          axis="y"
          values={subtasks.map(t => t.id)}
          onReorder={ids => reorderTasks(ids)}
          className="flex flex-col"
        >
          <AnimatePresence initial={false}>
            {subtasks.map(sub => (
              <Reorder.Item
                key={sub.id}
                value={sub.id}
                dragListener={!isTouch}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                whileDrag={{ scale: 1.01, backgroundColor: 'var(--surface)' }}
                className="group/sub relative rounded-md"
              >
                <div className="flex min-h-9 items-center gap-2 border-b border-line/60 pr-0.5">
                  {/* Alça de arrastar — aparece no hover */}
                  <span className="flex w-4 shrink-0 cursor-grab items-center justify-center text-ink-faint opacity-0 transition-opacity group-hover/sub:opacity-100 max-md:hidden">
                    <GripVertical size={12} />
                  </span>
                  <Checkbox
                    checked={sub.completed}
                    onChange={() => complete(sub.id, sub.completed)}
                    small
                    className="relative z-10 -m-3 w-auto min-h-0 p-3 max-md:ml-0"
                  />
                  <span
                    className={cn(
                      'flex-1 truncate py-1.5 text-sm leading-5 md:text-[13px]',
                      sub.completed && 'text-ink-faint line-through',
                    )}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteTask(sub.id)}
                    aria-label={`Excluir sub-tarefa ${sub.title}`}
                    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-faint opacity-100 transition-opacity hover:bg-surface hover:text-overdue md:size-6 md:opacity-0 md:group-hover/sub:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Adicionar sub-tarefa — linha discreta colada ao bloco */}
      {adding ? (
        <motion.input
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') { e.stopPropagation(); setTitle(''); setAdding(false) }
          }}
          onBlur={() => { if (!title.trim()) setAdding(false) }}
          autoFocus
          placeholder="Sub-tarefa (Enter para adicionar)"
          className="h-9 w-full rounded-md border border-primary bg-canvas px-2.5 text-sm placeholder:text-ink-faint focus:outline-none md:h-8 md:text-[13px]"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md pl-4 pr-1 text-sm text-ink-muted transition-colors hover:text-ink md:min-h-8 md:text-[13px] max-md:pl-0"
        >
          <Plus size={13} />
          Adicionar sub-tarefa
        </button>
      )}
    </div>
  )
}
