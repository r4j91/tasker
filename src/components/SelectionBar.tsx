import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, X } from 'lucide-react'
import { useUiStore } from '../stores/useUiStore'
import { useTaskStore } from '../stores/useTaskStore'
import { playCompleteSound } from '../lib/sound'

export function SelectionBar() {
  const selectionMode = useUiStore(s => s.selectionMode)
  const checkedIds = useUiStore(s => s.checkedIds)
  const exitSelection = useUiStore(s => s.exitSelection)
  const soundEnabled = useUiStore(s => s.soundEnabled)
  const completeMany = useTaskStore(s => s.completeMany)
  const deleteMany = useTaskStore(s => s.deleteMany)

  const count = checkedIds.length

  const completeAll = () => {
    if (count > 0 && soundEnabled) playCompleteSound()
    completeMany(checkedIds)
    exitSelection()
  }

  const deleteAll = () => {
    deleteMany(checkedIds)
    exitSelection()
  }

  return (
    <AnimatePresence>
      {selectionMode && (
        <motion.div
          className="fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-40 px-4 md:bottom-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto flex h-14 max-w-md items-center gap-2 rounded-2xl border border-line bg-surface-elevated px-3.5 shadow-[var(--shadow-lg)]">
            <span
              aria-label={`${count} ${count === 1 ? 'tarefa selecionada' : 'tarefas selecionadas'}`}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-ink"
            >
              {count}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={completeAll}
                disabled={count === 0}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-done transition-colors hover:bg-done-bg disabled:opacity-40"
              >
                <Check size={15} /> Concluir
              </button>
              <button
                onClick={deleteAll}
                disabled={count === 0}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-overdue transition-colors hover:bg-overdue-bg disabled:opacity-40"
              >
                <Trash2 size={15} /> Excluir
              </button>
              <button
                onClick={exitSelection}
                aria-label="Cancelar seleção"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
