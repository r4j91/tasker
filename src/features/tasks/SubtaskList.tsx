import { useState } from 'react'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'
import { useUiStore } from '../../stores/useUiStore'
import { Checkbox } from '../../components/ui/Checkbox'
import { playCompleteSound } from '../../lib/sound'
import { cn } from '../../lib/cn'

interface SubtaskListProps {
  parentId: string
}

/** Sub-tarefas dentro da visão expandida — 1 nível, estilo Things 3. */
export function SubtaskList({ parentId }: SubtaskListProps) {
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

  const submit = () => {
    if (!title.trim()) return
    addTask({ title, parentId })
    setTitle('')
  }

  const complete = (id: string, completed: boolean) => {
    if (!completed && soundEnabled) playCompleteSound()
    toggleComplete(id)
  }

  return (
    <div>
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
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                whileDrag={{ scale: 1.01, backgroundColor: 'var(--surface)' }}
                className="group/sub relative rounded-lg"
              >
                <div className="flex items-center gap-2.5 border-b border-line/60 py-1 pl-1 pr-0.5">
                  <Checkbox
                    checked={sub.completed}
                    onChange={() => complete(sub.id, sub.completed)}
                    small
                    className="relative z-10 -m-3 w-auto min-h-0 p-3"
                  />
                  <span
                    className={cn(
                      'min-h-9 flex-1 truncate py-2 text-sm leading-5 md:text-[13px]',
                      sub.completed && 'text-ink-faint line-through',
                    )}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteTask(sub.id)}
                    aria-label={`Excluir sub-tarefa ${sub.title}`}
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-faint opacity-100 transition-opacity hover:bg-surface hover:text-overdue md:size-7 md:opacity-0 md:group-hover/sub:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Adicionar sub-tarefa */}
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
          className="mt-1 h-10 w-full rounded-lg border border-primary bg-canvas px-3 text-sm placeholder:text-ink-faint focus:outline-none md:h-9 md:text-[13px]"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-1 text-sm text-ink-faint transition-colors hover:text-ink-muted md:min-h-8 md:text-[13px]"
        >
          <Plus size={13} />
          Adicionar sub-tarefa
        </button>
      )}
    </div>
  )
}
