import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, Flag, Tag, Hash, Check, MoreHorizontal, Copy, Trash2, CalendarClock, Plus,
} from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useUiStore } from '../stores/useUiStore'
import { useTaskStore } from '../stores/useTaskStore'
import { Checkbox } from './ui/Checkbox'
import { SubtaskList } from '../features/tasks/SubtaskList'
import { playCompleteSound } from '../lib/sound'
import { todayISO, dueLabel } from '../lib/dates'
import type { Priority } from '../features/tasks/types'
import { cn } from '../lib/cn'

const PRIORITY_TINTS: Record<Priority, string> = {
  1: 'var(--priority-1)', 2: 'var(--priority-2)', 3: 'var(--priority-3)', 4: 'var(--ink-faint)',
}

type PopoverKind = 'date' | 'priority' | 'labels' | 'project' | 'menu' | null

/** Detalhe da tarefa no desktop — painel modal amplo com chips e popovers. */
export function TaskDetailModal() {
  const taskId = useUiStore(s => s.detailTaskId)
  const setDetailTask = useUiStore(s => s.setDetailTask)
  const soundEnabled = useUiStore(s => s.soundEnabled)

  const task = useTaskStore(s => s.tasks.find(t => t.id === taskId))
  const projects = useTaskStore(s => s.projects)
  const sections = useTaskStore(s => s.sections)
  const allLabels = useTaskStore(s => s.labels)
  const updateTask = useTaskStore(s => s.updateTask)
  const toggleComplete = useTaskStore(s => s.toggleComplete)
  const completeMany = useTaskStore(s => s.completeMany)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const duplicateTask = useTaskStore(s => s.duplicateTask)
  const addLabel = useTaskStore(s => s.addLabel)

  const [popover, setPopover] = useState<PopoverKind>(null)
  const [labelQuery, setLabelQuery] = useState('')

  const close = () => { setPopover(null); setDetailTask(null) }

  /* Esc fecha popover primeiro, depois o painel */
  useEffect(() => {
    if (!task) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setPopover(p => {
        if (p) return null
        close()
        return null
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!task])

  const project = projects.find(p => p.id === task?.projectId)
  const section = sections.find(s => s.id === task?.sectionId)
  const taskSections = task?.projectId
    ? sections.filter(s => s.projectId === task.projectId).sort((a, b) => a.order - b.order)
    : []
  const taskLabels = (task?.labels ?? [])
    .map(id => allLabels.find(l => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l)

  const complete = () => {
    if (!task) return
    if (!task.completed) {
      const pending = useTaskStore.getState().tasks.filter(t => t.parentId === task.id && !t.completed)
      if (soundEnabled) playCompleteSound()
      if (pending.length > 0) {
        completeMany([task.id, ...pending.map(t => t.id)])
        close()
        return
      }
    }
    toggleComplete(task.id)
  }

  const dueOptions = [
    { label: 'Hoje', value: todayISO() },
    { label: 'Amanhã', value: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: 'Próxima semana', value: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
    { label: 'Sem data', value: null },
  ]

  const q = labelQuery.trim().toLowerCase()
  const filteredLabels = allLabels.filter(l => !q || l.name.toLowerCase().includes(q))
  const exactLabel = allLabels.some(l => l.name.toLowerCase() === q)

  const toggleLabel = (id: string) => {
    if (!task) return
    const next = task.labels.includes(id)
      ? task.labels.filter(x => x !== id)
      : [...task.labels, id]
    updateTask(task.id, { labels: next })
  }

  return createPortal(
    <AnimatePresence>
      {task && (
        <div className="fixed inset-0 z-50 hidden place-items-center p-6 md:grid">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />

          <motion.div
            role="dialog" aria-modal="true" aria-label={task.title}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-[var(--shadow-lg)]"
          >
            {/* Cabeçalho */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2">
              <span className="text-xs text-ink-faint">
                {project ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: project.color }} />
                    {project.name}{section && ` / ${section.name}`}
                  </span>
                ) : 'Caixa de entrada'}
              </span>
              <button
                onClick={close}
                aria-label="Fechar"
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {/* Checkbox grande + título */}
              <div className="flex items-start gap-3.5">
                <span className="mt-[7px]">
                  <Checkbox
                    checked={task.completed}
                    onChange={complete}
                    tint={task.priority < 4 ? PRIORITY_TINTS[task.priority] : undefined}
                    className="relative z-10 -m-3 w-auto min-h-0 p-3"
                  />
                </span>
                <input
                  value={task.title}
                  onChange={e => updateTask(task.id, { title: e.target.value })}
                  className={cn(
                    'w-full border-0 bg-transparent text-xl font-semibold leading-7 focus:outline-none focus-visible:outline-none',
                    task.completed && 'text-ink-faint line-through',
                  )}
                />
              </div>

              {/* Descrição */}
              <textarea
                value={task.notes}
                onChange={e => updateTask(task.id, { notes: e.target.value })}
                placeholder="Adicionar descrição..."
                rows={Math.min(8, Math.max(2, task.notes.split('\n').length))}
                className="mt-2 w-full resize-none border-0 bg-transparent pl-[34px] text-[15px] leading-6 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:outline-none"
              />

              {/* Sub-tarefas */}
              <div className="mt-3 pl-[34px]">
                <SubtaskList parentId={task.id} />
              </div>

              {/* Chips de atributos */}
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">

                {/* DATA */}
                <Chip
                  open={popover === 'date'}
                  onToggle={() => setPopover(p => (p === 'date' ? null : 'date'))}
                  active={!!task.dueDate}
                  activeCls="text-today"
                  icon={<Calendar size={14} />}
                  label={task.dueDate ? `${dueLabel(task.dueDate)}${task.dueTime ? ` ${task.dueTime}` : ''}` : 'Data'}
                >
                  {dueOptions.map(opt => (
                    <PopoverItem
                      key={opt.label}
                      onClick={() => { updateTask(task.id, { dueDate: opt.value }); setPopover(null) }}
                    >
                      {opt.label}
                      {task.dueDate === opt.value && <Check size={14} className="ml-auto text-primary-ink" />}
                    </PopoverItem>
                  ))}
                  <div className="mt-1 space-y-2 border-t border-line px-3 py-2.5">
                    <label className="flex items-center gap-2 text-xs text-ink-muted">
                      <Calendar size={13} />
                      <input
                        type="date"
                        lang="pt-BR"
                        value={task.dueDate ?? ''}
                        onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                        className="cursor-pointer bg-transparent text-sm text-ink outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-ink-muted">
                      <CalendarClock size={13} />
                      <input
                        type="time"
                        lang="pt-BR"
                        value={task.dueTime ?? ''}
                        onChange={e => updateTask(task.id, { dueTime: e.target.value || null })}
                        className="cursor-pointer bg-transparent text-sm text-ink outline-none"
                      />
                    </label>
                  </div>
                </Chip>

                {/* PRIORIDADE */}
                <Chip
                  open={popover === 'priority'}
                  onToggle={() => setPopover(p => (p === 'priority' ? null : 'priority'))}
                  active={task.priority < 4}
                  activeStyle={task.priority < 4 ? { color: PRIORITY_TINTS[task.priority] } : undefined}
                  icon={<Flag size={14} fill={task.priority < 4 ? 'currentColor' : 'none'} />}
                  label={task.priority < 4 ? `P${task.priority}` : 'Prioridade'}
                >
                  {([1, 2, 3, 4] as Priority[]).map(p => (
                    <PopoverItem
                      key={p}
                      onClick={() => { updateTask(task.id, { priority: p }); setPopover(null) }}
                    >
                      <Flag size={15} fill={PRIORITY_TINTS[p]} style={{ color: PRIORITY_TINTS[p] }} />
                      Prioridade {p}
                      {task.priority === p && <Check size={14} className="ml-auto text-primary-ink" />}
                    </PopoverItem>
                  ))}
                </Chip>

                {/* ETIQUETAS */}
                <Chip
                  open={popover === 'labels'}
                  onToggle={() => { setLabelQuery(''); setPopover(p => (p === 'labels' ? null : 'labels')) }}
                  active={taskLabels.length > 0}
                  icon={<Tag size={14} />}
                  label={
                    taskLabels.length > 0 ? (
                      <span className="flex items-center gap-1.5">
                        {taskLabels.slice(0, 2).map(l => (
                          <span key={l.id} className="flex items-center gap-1">
                            <span className="size-2 rounded-full" style={{ background: l.color }} />
                            {l.name}
                          </span>
                        ))}
                        {taskLabels.length > 2 && <span className="text-ink-faint">+{taskLabels.length - 2}</span>}
                      </span>
                    ) : 'Etiquetas'
                  }
                  wide
                >
                  <div className="px-2 pb-1">
                    <input
                      value={labelQuery}
                      onChange={e => setLabelQuery(e.target.value)}
                      placeholder="Buscar etiqueta..."
                      autoFocus
                      className="h-9 w-full rounded-lg border border-line bg-canvas px-2.5 text-sm placeholder:text-ink-faint focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredLabels.map(l => {
                      const checked = task.labels.includes(l.id)
                      return (
                        <PopoverItem key={l.id} onClick={() => toggleLabel(l.id)}>
                          <span className="size-2.5 rounded-full" style={{ background: l.color }} />
                          <span className="flex-1 truncate">{l.name}</span>
                          <span
                            className={cn(
                              'flex size-4.5 items-center justify-center rounded border-2',
                              checked ? 'border-primary bg-primary text-primary-fg' : 'border-line-strong',
                            )}
                          >
                            {checked && <Check size={11} strokeWidth={3} />}
                          </span>
                        </PopoverItem>
                      )
                    })}
                    {q && !exactLabel && (
                      <PopoverItem
                        onClick={() => {
                          const l = addLabel(labelQuery.trim())
                          toggleLabel(l.id)
                          setLabelQuery('')
                        }}
                      >
                        <Plus size={14} className="text-primary-ink" />
                        <span className="text-primary-ink">Criar etiqueta “{labelQuery.trim()}”</span>
                      </PopoverItem>
                    )}
                  </div>
                </Chip>

                {/* PROJETO / SEÇÃO */}
                <Chip
                  open={popover === 'project'}
                  onToggle={() => setPopover(p => (p === 'project' ? null : 'project'))}
                  active={!!project}
                  icon={<Hash size={14} />}
                  label={project ? `${project.name}${section ? ` / ${section.name}` : ''}` : 'Projeto'}
                  wide
                >
                  <PopoverItem onClick={() => { updateTask(task.id, { projectId: null, sectionId: null }); setPopover(null) }}>
                    Caixa de entrada
                    {!task.projectId && <Check size={14} className="ml-auto text-primary-ink" />}
                  </PopoverItem>
                  {projects.map(p => (
                    <PopoverItem
                      key={p.id}
                      onClick={() => { updateTask(task.id, { projectId: p.id, sectionId: null }); setPopover(null) }}
                    >
                      <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="flex-1 truncate">{p.name}</span>
                      {task.projectId === p.id && <Check size={14} className="text-primary-ink" />}
                    </PopoverItem>
                  ))}
                  {taskSections.length > 0 && (
                    <>
                      <p className="border-t border-line px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        Seção
                      </p>
                      <PopoverItem onClick={() => { updateTask(task.id, { sectionId: null }); setPopover(null) }}>
                        Sem seção
                        {!task.sectionId && <Check size={14} className="ml-auto text-primary-ink" />}
                      </PopoverItem>
                      {taskSections.map(sec => (
                        <PopoverItem
                          key={sec.id}
                          onClick={() => { updateTask(task.id, { sectionId: sec.id }); setPopover(null) }}
                        >
                          <span className="flex-1 truncate">{sec.name}</span>
                          {task.sectionId === sec.id && <Check size={14} className="text-primary-ink" />}
                        </PopoverItem>
                      ))}
                    </>
                  )}
                </Chip>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex shrink-0 items-center justify-between border-t border-line px-4 py-2">
              <span className="text-xs text-ink-faint">
                Criada em {format(parseISO(task.createdAt), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
              </span>
              <div className="relative">
                <button
                  onClick={() => setPopover(p => (p === 'menu' ? null : 'menu'))}
                  aria-label="Mais opções"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-ink"
                >
                  <MoreHorizontal size={16} />
                </button>
                {popover === 'menu' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPopover(null)} />
                    <div className="absolute bottom-full right-0 z-20 mb-1 w-44 rounded-xl border border-line bg-surface-elevated py-1 shadow-[var(--shadow-lg)]">
                      <PopoverItem onClick={() => { duplicateTask(task.id); setPopover(null); close() }}>
                        <Copy size={14} /> Duplicar
                      </PopoverItem>
                      <PopoverItem
                        destructive
                        onClick={() => { deleteTask(task.id); setPopover(null); close() }}
                      >
                        <Trash2 size={14} /> Excluir
                      </PopoverItem>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ── Blocos de UI ── */

function Chip({ open, onToggle, active, activeCls, activeStyle, icon, label, children, wide }: {
  open: boolean
  onToggle: () => void
  active: boolean
  activeCls?: string
  activeStyle?: React.CSSProperties
  icon: ReactNode
  label: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium transition-colors hover:border-line-strong',
          active ? (activeCls ?? 'text-ink') : 'text-ink-muted',
        )}
        style={activeStyle}
      >
        {icon}
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div
            className={cn(
              'absolute left-0 top-full z-20 mt-1 rounded-xl border border-line bg-surface-elevated py-1 shadow-[var(--shadow-lg)]',
              wide ? 'w-64' : 'w-52',
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  )
}

function PopoverItem({ children, onClick, destructive }: {
  children: ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-h-9 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm transition-colors',
        destructive ? 'text-overdue hover:bg-overdue-bg' : 'hover:bg-surface',
      )}
    >
      {children}
    </button>
  )
}
