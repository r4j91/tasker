import { motion, AnimatePresence } from 'framer-motion'
import { useTaskStore } from '../stores/useTaskStore'

export function UndoToast() {
  const pendingDelete = useTaskStore(s => s.pendingDelete)
  const undoDelete = useTaskStore(s => s.undoDelete)

  return (
    <AnimatePresence>
      {pendingDelete && (
        <motion.div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 flex items-center gap-4 rounded-xl bg-ink px-4 py-3 text-sm text-canvas shadow-[var(--shadow-lg)] md:bottom-6"
          initial={{ opacity: 0, y: 16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 16, x: '-50%' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span>
            {pendingDelete.tasks.length === 1
              ? 'Tarefa excluída'
              : `${pendingDelete.tasks.length} tarefas excluídas`}
          </span>
          <button
            onClick={undoDelete}
            className="-my-2 min-h-11 cursor-pointer px-2 font-semibold text-canvas underline-offset-2 hover:underline"
          >
            Desfazer
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
