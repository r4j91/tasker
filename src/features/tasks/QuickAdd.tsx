import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'
import { cn } from '../../lib/cn'

interface QuickAddProps {
  /** Projeto pré-selecionado (na tela de projeto) */
  projectId?: string | null
  /** Data pré-selecionada (na tela Hoje) */
  dueDate?: string | null
}

export function QuickAdd({ projectId = null, dueDate = null }: QuickAddProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useTaskStore(s => s.addTask)

  /* Tecla Q abre o campo (fora de inputs) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      if (typing) return
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = () => {
    if (!title.trim()) return
    addTask({ title, projectId, dueDate })
    setTitle('')
    inputRef.current?.focus()
  }

  return (
    <div className="mb-4">
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="field"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <input
              ref={inputRef}
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') { setTitle(''); setOpen(false) }
              }}
              onBlur={() => { if (!title.trim()) setOpen(false) }}
              placeholder="O que precisa ser feito? (Enter para adicionar)"
              className={cn(
                'h-11 w-full rounded-xl border border-primary bg-surface-elevated px-4 text-sm',
                'placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/20',
                'shadow-[var(--shadow-md)]',
              )}
            />
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={() => setOpen(true)}
            className={cn(
              'flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-line px-4',
              'text-sm text-ink-faint transition-colors hover:border-line-strong hover:text-ink-muted',
            )}
          >
            <Plus size={16} />
            Adicionar tarefa
            <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-faint md:inline">
              Q
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
