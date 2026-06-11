import { Reorder, AnimatePresence, motion } from 'framer-motion'
import type { Task } from './types'
import { TaskItem } from './TaskItem'
import { useTaskStore } from '../../stores/useTaskStore'

interface TaskListProps {
  tasks: Task[]
  hideProject?: boolean
  /** Permite arrastar para reordenar (listas planas) */
  reorderable?: boolean
}

export function TaskList({ tasks, hideProject, reorderable = true }: TaskListProps) {
  const reorderTasks = useTaskStore(s => s.reorderTasks)

  if (reorderable) {
    return (
      <Reorder.Group
        axis="y"
        values={tasks.map(t => t.id)}
        onReorder={ids => reorderTasks(ids)}
        className="flex flex-col"
      >
        <AnimatePresence initial={false}>
          {tasks.map(task => (
            <Reorder.Item
              key={task.id}
              value={task.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              whileDrag={{ scale: 1.02, boxShadow: 'var(--shadow-lg)', borderRadius: 12 }}
              className="relative"
            >
              <TaskItem task={task} hideProject={hideProject} />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    )
  }

  return (
    <div className="flex flex-col">
      <AnimatePresence initial={false}>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <TaskItem task={task} hideProject={hideProject} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
