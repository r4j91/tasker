import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Calendar, Flag, Inbox, ChevronDown, Check } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useUiStore } from '../stores/useUiStore'
import { useTaskStore } from '../stores/useTaskStore'
import { SmartInput } from '../features/tasks/SmartInput'
import { Popover } from './ui/Popover'
import { parseTask, type ParseResult } from '../lib/nlparse'
import type { Priority } from '../features/tasks/types'
import { todayISO, dueLabel, dueColorVar } from '../lib/dates'
import { useKeyboardInset } from '../lib/useKeyboardInset'
import { cn } from '../lib/cn'

const PRIORITY_TINTS: Record<Priority, string> = {
  1: 'var(--priority-1)', 2: 'var(--priority-2)', 3: 'var(--priority-3)', 4: 'var(--ink-faint)',
}

/** Sheet de adição rápida estilo Todoist — título com NL, descrição, chips. */
export function QuickAddSheet() {
  const open = useUiStore(s => s.quickAddOpen)
  const context = useUiStore(s => s.quickAddContext)
  const setOpen = useUiStore(s => s.setQuickAddOpen)
  const projects = useTaskStore(s => s.projects)

  const location = useLocation()
  const keyboardInset = useKeyboardInset()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  /* Overrides escolhidos por chip (vencem o contexto, perdem para o texto) */
  const [chipDue, setChipDue] = useState<string | null>(null)
  const [chipPriority, setChipPriority] = useState<Priority | null>(null)
  const [chipProject, setChipProject] = useState<string | null | undefined>(undefined)
  const [dueMenu, setDueMenu] = useState(false)
  const [prioMenu, setPrioMenu] = useState(false)

  /* Contexto da tela atual (fallback) */
  const routeDue = location.pathname.startsWith('/hoje') ? todayISO() : null
  const routeProject = location.pathname.match(/^\/projeto\/(.+)$/)?.[1] ?? null

  const ctxDue = context?.dueDate ?? routeDue
  const ctxProject = context?.projectId ?? routeProject
  const ctxSection = context?.sectionId ?? null

  const effDue = parsed?.dueDate ?? chipDue ?? ctxDue
  const effPriority = (parsed && parsed.priority < 4 ? parsed.priority : null) ?? chipPriority ?? 4
  const effProject = parsed?.projectId ?? (chipProject !== undefined ? chipProject : ctxProject)

  const reset = () => {
    setTitle(''); setNotes(''); setParsed(null); setChipDue(null); setChipPriority(null)
    setChipProject(undefined); setDueMenu(false); setPrioMenu(false)
  }
  const close = () => { reset(); setOpen(false) }

  /* Esc fecha o sheet mesmo com o foco fora do input (ex.: após enviar) */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const submit = () => {
    /* Parse na hora — o estado via efeito pode estar um tick atrasado */
    const { projects: projs, labels } = useTaskStore.getState()
    const p = parseTask(title, projs, labels)
    if (!p.title.trim()) return
    const store = useTaskStore.getState()
    store.addTask({
      title: p.title,
      dueDate: p.dueDate ?? chipDue ?? ctxDue,
      dueTime: p.dueTime,
      projectId: p.projectId ?? (chipProject !== undefined ? chipProject : ctxProject),
      sectionId: p.projectId || chipProject !== undefined ? null : ctxSection,
      priority: p.priority < 4 ? p.priority : (chipPriority ?? 4),
      labels: p.labelIds,
    })
    /* Notas entram na tarefa recém-criada */
    if (notes.trim()) {
      const created = useTaskStore.getState().tasks[0]
      if (created) store.updateTask(created.id, { notes: notes.trim() })
    }
    setTitle(''); setNotes('')
  }

  const dueOptions = [
    { label: 'Hoje', value: todayISO() },
    { label: 'Amanhã', value: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: 'Próxima semana', value: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
    { label: 'Sem data', value: null },
  ]

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            className="relative rounded-t-2xl bg-surface-elevated px-4 pt-4 shadow-[var(--shadow-lg)]"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
              /* Sobe junto com o teclado virtual (iOS/Android) */
              transform: keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : undefined,
            }}
          >
            {/* Título com linguagem natural */}
            <SmartInput
              autoFocus
              bare
              value={title}
              onChange={setTitle}
              onParse={setParsed}
              onKeyDown={e => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') close()
              }}
              placeholder="Nome da tarefa"
            />

            {/* Descrição */}
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Descrição"
              className="mt-0.5 h-9 w-full border-0 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />

            {/* Chips de atributos */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Vencimento */}
              <Popover
                open={dueMenu}
                onClose={() => setDueMenu(false)}
                width={176}
                trigger={ref => (
                  <button
                    ref={ref}
                    onClick={() => { setDueMenu(o => !o); setPrioMenu(false) }}
                    className={cn(
                      'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium transition-colors',
                      !effDue && 'text-ink-muted',
                    )}
                    style={effDue ? { color: dueColorVar(effDue) } : undefined}
                  >
                    <Calendar size={14} />
                    {effDue ? dueLabel(effDue) : 'Vencimento'}
                  </button>
                )}
              >
                {dueOptions.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => { setChipDue(opt.value); setDueMenu(false) }}
                    className="flex min-h-10 w-full cursor-pointer items-center px-3 text-left text-sm hover:bg-surface"
                  >
                    {opt.label}
                  </button>
                ))}
              </Popover>

              {/* Prioridade */}
              <Popover
                open={prioMenu}
                onClose={() => setPrioMenu(false)}
                width={176}
                trigger={ref => (
                  <button
                    ref={ref}
                    onClick={() => { setPrioMenu(o => !o); setDueMenu(false) }}
                    className={cn(
                      'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium transition-colors',
                      effPriority < 4 ? '' : 'text-ink-muted',
                    )}
                    style={effPriority < 4 ? { color: `var(--priority-${effPriority}-text)` } : undefined}
                  >
                    <Flag
                      size={14}
                      fill={effPriority < 4 ? PRIORITY_TINTS[effPriority] : 'none'}
                      style={effPriority < 4 ? { color: PRIORITY_TINTS[effPriority] } : undefined}
                    />
                    {effPriority < 4 ? `P${effPriority}` : 'Prioridade'}
                  </button>
                )}
              >
                {([1, 2, 3, 4] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => { setChipPriority(p); setPrioMenu(false) }}
                    className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm hover:bg-surface"
                  >
                    <Flag size={15} fill={PRIORITY_TINTS[p]} style={{ color: PRIORITY_TINTS[p] }} />
                    Prioridade {p}
                    {effPriority === p && <Check size={14} className="ml-auto text-primary-ink" />}
                  </button>
                ))}
              </Popover>
            </div>

            {/* Rodapé: projeto + enviar */}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
              <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-1 text-sm text-ink-muted">
                <Inbox size={16} />
                <select
                  value={effProject ?? ''}
                  aria-label="Projeto"
                  onChange={e => setChipProject(e.target.value || null)}
                  className="max-w-40 cursor-pointer truncate bg-transparent text-sm font-medium text-ink outline-none"
                >
                  <option value="">Entrada</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} />
              </label>

              <motion.button
                onClick={submit}
                disabled={!title.trim()}
                aria-label="Adicionar tarefa"
                whileTap={{ scale: 0.95 }}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary-ink text-white transition-opacity disabled:opacity-35 dark:bg-primary dark:text-primary-fg"
              >
                <ArrowUp size={22} strokeWidth={2.5} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
