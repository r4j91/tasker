import { useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Calendar, Flag, Trash2, FolderOpen, Check, CalendarClock } from 'lucide-react'
import { format, addDays } from 'date-fns'
import type { Task, Priority } from './types'
import { useTaskStore } from '../../stores/useTaskStore'
import { useUiStore } from '../../stores/useUiStore'
import { Checkbox } from '../../components/ui/Checkbox'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { dueLabel, isOverdue, isDueToday, todayISO } from '../../lib/dates'
import { playCompleteSound } from '../../lib/sound'
import { cn } from '../../lib/cn'

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  1: { label: 'P1', cls: 'text-overdue' },
  2: { label: 'P2', cls: 'text-today' },
  3: { label: 'P3', cls: 'text-primary-ink' },
  4: { label: 'P4', cls: 'text-ink-faint' },
}

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const SWIPE_THRESHOLD = 90

interface TaskItemProps {
  task: Task
  hideProject?: boolean
  /** Desativa o toque longo de seleção (em contextos com drag próprio) */
  disableLongPress?: boolean
}

export function TaskItem({ task, hideProject, disableLongPress }: TaskItemProps) {
  const toggleComplete = useTaskStore(s => s.toggleComplete)
  const updateTask = useTaskStore(s => s.updateTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const projects = useTaskStore(s => s.projects)

  const expanded = useUiStore(s => s.expandedId === task.id)
  const selected = useUiStore(s => s.selectedId === task.id)
  const toggleExpanded = useUiStore(s => s.toggleExpanded)
  const setSelected = useUiStore(s => s.setSelected)
  const soundEnabled = useUiStore(s => s.soundEnabled)
  const selectionMode = useUiStore(s => s.selectionMode)
  const isChecked = useUiStore(s => s.checkedIds.includes(task.id))
  const enterSelection = useUiStore(s => s.enterSelection)
  const toggleChecked = useUiStore(s => s.toggleChecked)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)
  const longPressFired = useRef(false)

  /* Toque longo (450ms) entra em modo seleção — apenas touch, tarefas ativas */
  const startLongPress = (e: React.PointerEvent) => {
    if (!isTouch || disableLongPress || selectionMode || task.completed) return
    pressOrigin.current = { x: e.clientX, y: e.clientY }
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      enterSelection(task.id)
      navigator.vibrate?.(10)
    }, 450)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = null
    pressOrigin.current = null
  }
  /* Só cancela se o dedo realmente se moveu (jitter de touch dispara pointermove) */
  const maybeCancelLongPress = (e: React.PointerEvent) => {
    if (!pressOrigin.current) return
    const dx = e.clientX - pressOrigin.current.x
    const dy = e.clientY - pressOrigin.current.y
    if (Math.hypot(dx, dy) > 8) cancelLongPress()
  }

  const x = useMotionValue(0)
  const rightHint = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const leftHint = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  const project = projects.find(p => p.id === task.projectId)
  const due = task.dueDate
  const dueTone = due
    ? isOverdue(due) ? 'text-overdue' : isDueToday(due) ? 'text-today' : 'text-ink-muted'
    : ''

  const complete = () => {
    if (!task.completed && soundEnabled) playCompleteSound()
    toggleComplete(task.id)
  }

  const onDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > SWIPE_THRESHOLD) complete()
    else if (info.offset.x < -SWIPE_THRESHOLD) setScheduleOpen(true)
  }

  const scheduleOptions: Array<{ label: string; date: string | null }> = [
    { label: 'Hoje', date: todayISO() },
    { label: 'Amanhã', date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: 'Próxima semana', date: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
    { label: 'Remover data', date: null },
  ]

  return (
    <div
      className={cn(
        'relative rounded-xl border border-transparent transition-colors',
        expanded && 'border-line bg-surface-elevated shadow-[var(--shadow-md)]',
        selected && !expanded && 'border-line-strong bg-surface',
      )}
    >
      {/* Fundos revelados pelo swipe (apenas touch) */}
      {isTouch && !expanded && (
        <>
          <motion.div
            style={{ opacity: rightHint }}
            className="absolute inset-y-0 left-0 flex w-24 items-center justify-start rounded-l-xl bg-done-bg pl-4 text-done"
          >
            <Check size={18} />
          </motion.div>
          <motion.div
            style={{ opacity: leftHint }}
            className="absolute inset-y-0 right-0 flex w-24 items-center justify-end rounded-r-xl bg-today-bg pr-4 text-today"
          >
            <CalendarClock size={18} />
          </motion.div>
        </>
      )}

      {/* Linha principal (arrastável no touch) */}
      <motion.div
        drag={isTouch && !expanded && !selectionMode ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        dragDirectionLock
        style={{ x }}
        onDragEnd={onDragEnd}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerMove={maybeCancelLongPress}
        onPointerLeave={cancelLongPress}
        className={cn('relative flex items-center gap-1 pl-2 pr-1', isTouch && 'touch-pan-y')}
      >
        {selectionMode ? (
          <span
            className={cn(
              'mx-1 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              isChecked ? 'border-primary bg-primary text-primary-fg' : 'border-line-strong',
            )}
          >
            {isChecked && <Check size={11} strokeWidth={3} />}
          </span>
        ) : (
          <Checkbox
            checked={task.completed}
            onChange={complete}
            className="w-auto shrink-0"
          />
        )}
        <button
          onClick={() => {
            /* Ignora o clique gerado ao soltar o dedo do toque longo */
            if (longPressFired.current) { longPressFired.current = false; return }
            if (selectionMode) { toggleChecked(task.id); return }
            setSelected(task.id)
            toggleExpanded(task.id)
          }}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 text-left"
        >
          <span className={cn('truncate text-sm', task.completed && 'text-ink-faint line-through')}>
            {task.title}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {task.priority < 4 && (
              <Flag size={12} className={PRIORITY_META[task.priority].cls} fill="currentColor" />
            )}
            {due && (
              <span className={cn('text-xs', dueTone)}>
                {dueLabel(due)}{task.dueTime && ` · ${task.dueTime}`}
              </span>
            )}
            {project && !hideProject && (
              <span className="size-2 rounded-full" style={{ background: project.color }} />
            )}
          </span>
        </button>
      </motion.div>

      {/* Edição inline */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pb-3 pt-1">
              <textarea
                value={task.notes}
                onChange={e => updateTask(task.id, { notes: e.target.value })}
                placeholder="Notas..."
                rows={2}
                className="w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-sm placeholder:text-ink-faint focus:border-primary focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-ink-muted transition-colors hover:border-line-strong">
                  <Calendar size={13} />
                  <input
                    type="date"
                    value={task.dueDate ?? ''}
                    onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                    className="cursor-pointer bg-transparent text-xs text-ink outline-none"
                  />
                </label>

                <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-ink-muted transition-colors hover:border-line-strong">
                  <CalendarClock size={13} />
                  <input
                    type="time"
                    value={task.dueTime ?? ''}
                    onChange={e => updateTask(task.id, { dueTime: e.target.value || null })}
                    className="cursor-pointer bg-transparent text-xs text-ink outline-none"
                  />
                </label>

                <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-ink-muted transition-colors hover:border-line-strong">
                  <FolderOpen size={13} />
                  <select
                    value={task.projectId ?? ''}
                    onChange={e => updateTask(task.id, { projectId: e.target.value || null })}
                    className="cursor-pointer bg-transparent text-xs text-ink outline-none"
                  >
                    <option value="">Entrada</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <div className="flex h-8 items-center gap-0.5 rounded-lg border border-line px-1">
                  {([1, 2, 3, 4] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => updateTask(task.id, { priority: p })}
                      aria-label={`Prioridade ${p}`}
                      className={cn(
                        'flex size-6 cursor-pointer items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                        task.priority === p
                          ? cn('bg-surface', PRIORITY_META[p].cls)
                          : 'text-ink-faint hover:bg-surface',
                      )}
                    >
                      {PRIORITY_META[p].label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                  className="ml-auto text-overdue hover:text-overdue hover:bg-overdue-bg"
                >
                  <Trash2 size={14} />
                  Excluir
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheet de agendamento (swipe para a esquerda) */}
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Agendar para">
        <div className="flex flex-col gap-1">
          {scheduleOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => { updateTask(task.id, { dueDate: opt.date }); setScheduleOpen(false) }}
              className="flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-left text-sm transition-colors hover:bg-surface"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
