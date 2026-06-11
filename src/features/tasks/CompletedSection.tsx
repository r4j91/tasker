import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { Task } from './types'
import { TaskList } from './TaskList'
import { cn } from '../../lib/cn'

interface CompletedSectionProps {
  tasks: Task[]
  hideProject?: boolean
}

/** Seção recolhível de tarefas concluídas — desmarcar restaura a tarefa. */
export function CompletedSection({ tasks, hideProject }: CompletedSectionProps) {
  const [open, setOpen] = useState(false)

  if (tasks.length === 0) return null

  const sorted = [...tasks].sort((a, b) =>
    (b.completedAt ?? '').localeCompare(a.completedAt ?? ''),
  )

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-ink-faint transition-colors hover:text-ink-muted"
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.15 }}
          className="flex"
        >
          <ChevronDown size={14} />
        </motion.span>
        {tasks.length} {tasks.length === 1 ? 'concluída' : 'concluídas'}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn('overflow-hidden')}
          >
            <div className="pt-2">
              <TaskList tasks={sorted} hideProject={hideProject} reorderable={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
