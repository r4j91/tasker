import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, Flag, Tag, Check, MoreHorizontal, Copy, Trash2, CalendarClock, Plus, Inbox,
} from 'lucide-react'
import { format, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useUiStore } from '../stores/useUiStore'
import { useTaskStore } from '../stores/useTaskStore'
import { Checkbox } from './ui/Checkbox'
import { Popover } from './ui/Popover'
import { SubtaskList } from '../features/tasks/SubtaskList'
import { playCompleteSound } from '../lib/sound'
import { todayISO, dueLabel, dueColorVar } from '../lib/dates'
import { useFocusTrap } from '../lib/useFocusTrap'
import type { Priority } from '../features/tasks/types'
import { cn } from '../lib/cn'

const PRIORITY_TINTS: Record<Priority, string> = {
  1: 'var(--priority-1)', 2: 'var(--priority-2)', 3: 'var(--priority-3)', 4: 'var(--ink-faint)',
}

type PopoverKind = 'date' | 'priority' | 'labels' | 'project' | 'menu' | null

/** Detalhe da tarefa no desktop — painel em duas colunas, estilo Todoist. */
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

  const panelRef = useRef<HTMLDivElement>(null)
  const [popover, setPopover] = useState<PopoverKind>(null)
  const [labelQuery, setLabelQuery] = useState('')
  /* Esc/clique-fora que fecharam um popover não podem fechar o modal junto */
  const popGuard = useRef(0)

  const closePopover = () => { popGuard.current = Date.now(); setPopover(null) }
  const close = () => { setPopover(null); setDetailTask(null) }
  const closeUnlessPopover = () => {
    if (Date.now() - popGuard.current < 250) return
    close()
  }

  useFocusTrap(panelRef, !!task)

  /* Esc fecha popover primeiro, depois o painel */
  useEffect(() => {
    if (!task) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      if (Date.now() - popGuard.current < 250) return
      setPopover(p => {
        if (p) { popGuard.current = Date.now(); return null }
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
            onClick={closeUnlessPopover}
          />

          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-label={task.title}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[80vh] max-h-[640px] w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-canvas shadow-[var(--shadow-lg)]"
          >
            {/* ── Coluna principal ── */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Breadcrumb */}
              <div className="shrink-0 border-b border-line px-6 py-2.5">
                <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                  {project ? (
                    <>
                      <span className="size-2 rounded-full" style={{ background: project.color }} />
                      {project.name}{section && <span className="text-ink-faint"> / {section.name}</span>}
                    </>
                  ) : (
                    <>
                      <Inbox size={12} />
                      Caixa de entrada
                    </>
                  )}
                </span>
              </div>

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

                {/* Descrição — tom suave */}
                <textarea
                  value={task.notes}
                  onChange={e => updateTask(task.id, { notes: e.target.value })}
                  placeholder="Adicionar descrição..."
                  rows={Math.min(8, Math.max(2, task.notes.split('\n').length))}
                  className="mt-1.5 w-full resize-none border-0 bg-transparent pl-[34px] text-sm leading-6 text-ink-muted placeholder:text-ink-faint focus:outline-none focus-visible:outline-none"
                />

                {/* Sub-tarefas */}
                <div className="mt-4 pl-[34px]">
                  <SubtaskList parentId={task.id} header />
                </div>
              </div>
            </div>

            {/* ── Sidebar de atributos ── */}
            <aside className="flex w-60 shrink-0 flex-col border-l border-line bg-surface/70">
              {/* Ações */}
              <div className="flex shrink-0 items-center justify-end gap-0.5 px-2 py-2">
                <Popover
                  open={popover === 'menu'}
                  onClose={closePopover}
                  width={176}
                  trigger={ref => (
                    <button
                      ref={ref}
                      onClick={() => setPopover(p => (p === 'menu' ? null : 'menu'))}
                      aria-label="Mais opções"
                      className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                >
                  <PopoverItem onClick={() => { duplicateTask(task.id); closePopover(); close() }}>
                    <Copy size={14} /> Duplicar
                  </PopoverItem>
                  <PopoverItem destructive onClick={() => { deleteTask(task.id); closePopover(); close() }}>
                    <Trash2 size={14} /> Excluir
                  </PopoverItem>
                </Popover>
                <button
                  onClick={close}
                  aria-label="Fechar"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
                {/* PROJETO */}
                <Field
                  label="Projeto"
                  open={popover === 'project'}
                  onToggle={() => setPopover(p => (p === 'project' ? null : 'project'))}
                  onClose={closePopover}
                  value={
                    <span className="flex items-center gap-1.5 truncate">
                      {project ? (
                        <>
                          <span className="size-2.5 shrink-0 rounded-full" style={{ background: project.color }} />
                          <span className="truncate">{project.name}{section && ` / ${section.name}`}</span>
                        </>
                      ) : (
                        <>
                          <Inbox size={14} className="shrink-0 text-ink-muted" />
                          Caixa de entrada
                        </>
                      )}
                    </span>
                  }
                >
                  <PopoverItem onClick={() => { updateTask(task.id, { projectId: null, sectionId: null }); closePopover() }}>
                    Caixa de entrada
                    {!task.projectId && <Check size={14} className="ml-auto text-primary-ink" />}
                  </PopoverItem>
                  {projects.map(p => (
                    <PopoverItem
                      key={p.id}
                      onClick={() => { updateTask(task.id, { projectId: p.id, sectionId: null }); closePopover() }}
                    >
                      <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="flex-1 truncate">{p.name}</span>
                      {task.projectId === p.id && <Check size={14} className="text-primary-ink" />}
                    </PopoverItem>
                  ))}
                  {taskSections.length > 0 && (
                    <>
                      <p className="border-t border-line px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Seção
                      </p>
                      <PopoverItem onClick={() => { updateTask(task.id, { sectionId: null }); closePopover() }}>
                        Sem seção
                        {!task.sectionId && <Check size={14} className="ml-auto text-primary-ink" />}
                      </PopoverItem>
                      {taskSections.map(sec => (
                        <PopoverItem
                          key={sec.id}
                          onClick={() => { updateTask(task.id, { sectionId: sec.id }); closePopover() }}
                        >
                          <span className="flex-1 truncate">{sec.name}</span>
                          {task.sectionId === sec.id && <Check size={14} className="text-primary-ink" />}
                        </PopoverItem>
                      ))}
                    </>
                  )}
                </Field>

                {/* DATA */}
                <Field
                  label="Data"
                  open={popover === 'date'}
                  onToggle={() => setPopover(p => (p === 'date' ? null : 'date'))}
                  onClose={closePopover}
                  value={
                    task.dueDate ? (
                      <span className="flex items-center gap-1.5" style={{ color: dueColorVar(task.dueDate) }}>
                        <Calendar size={14} />
                        {dueLabel(task.dueDate)}{task.dueTime && ` ${task.dueTime}`}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <Calendar size={14} />
                        Adicionar data
                      </span>
                    )
                  }
                >
                  {dueOptions.map(opt => (
                    <PopoverItem
                      key={opt.label}
                      onClick={() => { updateTask(task.id, { dueDate: opt.value }); closePopover() }}
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
                        aria-label="Data de vencimento"
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
                        aria-label="Hora"
                        value={task.dueTime ?? ''}
                        onChange={e => updateTask(task.id, { dueTime: e.target.value || null })}
                        className="cursor-pointer bg-transparent text-sm text-ink outline-none"
                      />
                    </label>
                  </div>
                </Field>

                {/* PRIORIDADE */}
                <Field
                  label="Prioridade"
                  open={popover === 'priority'}
                  onToggle={() => setPopover(p => (p === 'priority' ? null : 'priority'))}
                  onClose={closePopover}
                  value={
                    <span
                      className={cn('flex items-center gap-1.5', task.priority === 4 && 'text-ink-muted')}
                      style={task.priority < 4 ? { color: `var(--priority-${task.priority}-text)` } : undefined}
                    >
                      <Flag
                        size={14}
                        fill={task.priority < 4 ? PRIORITY_TINTS[task.priority] : 'none'}
                        style={task.priority < 4 ? { color: PRIORITY_TINTS[task.priority] } : undefined}
                      />
                      P{task.priority}
                    </span>
                  }
                >
                  {([1, 2, 3, 4] as Priority[]).map(p => (
                    <PopoverItem
                      key={p}
                      onClick={() => { updateTask(task.id, { priority: p }); closePopover() }}
                    >
                      <Flag size={15} fill={PRIORITY_TINTS[p]} style={{ color: PRIORITY_TINTS[p] }} />
                      Prioridade {p}
                      {task.priority === p && <Check size={14} className="ml-auto text-primary-ink" />}
                    </PopoverItem>
                  ))}
                </Field>

                {/* ETIQUETAS */}
                <Field
                  label="Etiquetas"
                  open={popover === 'labels'}
                  onToggle={() => { setLabelQuery(''); setPopover(p => (p === 'labels' ? null : 'labels')) }}
                  onClose={closePopover}
                  wide
                  value={
                    taskLabels.length > 0 ? (
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {taskLabels.map(l => (
                          <span key={l.id} className="flex items-center gap-1">
                            <span className="size-2 rounded-full" style={{ background: l.color }} />
                            {l.name}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <Tag size={14} />
                        Adicionar etiqueta
                      </span>
                    )
                  }
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
                </Field>
              </div>

              <p className="shrink-0 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
                Criada em {format(parseISO(task.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </aside>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ── Blocos de UI ── */

/** Campo da sidebar: rótulo pequeno + valor clicável que abre popover. */
function Field({ label, value, open, onToggle, onClose, children, wide }: {
  label: string
  value: ReactNode
  open: boolean
  onToggle: () => void
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="border-b border-line/70 py-1">
      <Popover
        open={open}
        onClose={onClose}
        width={wide ? 256 : 224}
        trigger={ref => (
          <button
            ref={ref}
            onClick={onToggle}
            className="w-full cursor-pointer rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface"
          >
            <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {label}
            </span>
            <span className="mt-1 block text-sm">{value}</span>
          </button>
        )}
      >
        {children}
      </Popover>
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
