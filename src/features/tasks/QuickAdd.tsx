import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../../stores/useTaskStore'
import { useUiStore } from '../../stores/useUiStore'
import { SmartInput } from './SmartInput'
import { parseTask, type ParseResult } from '../../lib/nlparse'

const isMobile = () => window.matchMedia('(max-width: 767px)').matches

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
  const parsedRef = useRef<ParseResult | null>(null)
  const addTask = useTaskStore(s => s.addTask)
  const openQuickAdd = useUiStore(s => s.openQuickAdd)

  /* Mobile: abre o sheet estilo Todoist com o contexto da tela */
  const openAdd = () => {
    if (isMobile()) openQuickAdd({ projectId, dueDate })
    else setOpen(true)
  }

  /* Tecla Q abre o campo (fora de inputs) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = () => {
    const { projects, labels } = useTaskStore.getState()
    const parsed = parseTask(title, projects, labels)
    if (!parsed.title.trim()) return
    addTask({
      title: parsed.title,
      dueDate: parsed.dueDate ?? dueDate,
      dueTime: parsed.dueTime,
      projectId: parsed.projectId ?? projectId,
      priority: parsed.priority,
      labels: parsed.labelIds,
    })
    setTitle('')
    inputRef.current?.focus()
  }

  return (
    <div className="mb-2">
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="field"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <SmartInput
              ref={inputRef}
              autoFocus
              value={title}
              onChange={setTitle}
              onParse={r => { parsedRef.current = r }}
              onKeyDown={e => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') { setTitle(''); setOpen(false) }
              }}
              onBlur={() => { if (!title.trim()) setOpen(false) }}
              placeholder='Tente: "pagar internet amanhã 9h #casa p2"'
            />
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={openAdd}
            className="group flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg px-1 text-sm text-ink-faint transition-colors hover:text-ink-muted"
          >
            <span className="flex size-[18px] items-center justify-center rounded-full text-primary-ink transition-colors group-hover:bg-primary group-hover:text-primary-fg">
              <Plus size={15} />
            </span>
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
