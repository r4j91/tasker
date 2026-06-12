import { useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion } from 'framer-motion'
import { Calendar, Check, CalendarClock, ChevronDown } from 'lucide-react'
import { format, addDays } from 'date-fns'
import type { Task, Priority } from './types'
import { useShallow } from 'zustand/react/shallow'
import { useTaskStore } from '../../stores/useTaskStore'
import { useUiStore } from '../../stores/useUiStore'
import { Checkbox } from '../../components/ui/Checkbox'
import { RollingNumber } from '../../components/ui/RollingNumber'
import { TaskContextMenu } from './TaskContextMenu'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { dueLabel, dueColorVar, todayISO } from '../../lib/dates'
import { playCompleteSound } from '../../lib/sound'
import { cn } from '../../lib/cn'

const PRIORITY_META: Record<Priority, { label: string; tint?: string }> = {
  1: { label: 'P1', tint: 'var(--priority-1)' },
  2: { label: 'P2', tint: 'var(--priority-2)' },
  3: { label: 'P3', tint: 'var(--priority-3)' },
  4: { label: 'P4' },
}

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/* Ícone de sub-tarefas: bifurcação limpa legível em tamanhos pequenos */
function SubtaskIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden
    >
      {/* Haste vertical */}
      <line x1="4" y1="2.5" x2="4" y2="11.5" />
      {/* Ramo superior */}
      <path d="M4 7h5" />
      {/* Ramo inferior */}
      <path d="M4 11.5h5" />
      {/* Pontos terminais */}
      <circle cx="11" cy="7"    r="1.3" fill="currentColor" stroke="none" />
      <circle cx="11" cy="11.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

const SWIPE_THRESHOLD = 90

interface TaskItemProps {
  task: Task
  hideProject?: boolean
  /** Desativa o toque longo de seleção (em contextos com drag próprio) */
  disableLongPress?: boolean
  /** Linha de sub-tarefa aninhada (indentada, sem expandir as próprias) */
  nested?: boolean
}

export function TaskItem({ task, hideProject, disableLongPress, nested }: TaskItemProps) {
  const toggleComplete = useTaskStore(s => s.toggleComplete)
  const completeMany = useTaskStore(s => s.completeMany)
  const updateTask = useTaskStore(s => s.updateTask)
  const projects = useTaskStore(s => s.projects)
  const allLabels = useTaskStore(s => s.labels)
  /* Contagens primitivas — evita re-render por identidade de array */
  const subtaskTotal = useTaskStore(s => s.tasks.reduce((n, t) => (t.parentId === task.id ? n + 1 : n), 0))
  const subtaskDone = useTaskStore(s => s.tasks.reduce((n, t) => (t.parentId === task.id && t.completed ? n + 1 : n), 0))

  const selected = useUiStore(s => s.selectedId === task.id)
  const setDetailTask = useUiStore(s => s.setDetailTask)
  const soundEnabled = useUiStore(s => s.soundEnabled)
  const selectionMode = useUiStore(s => s.selectionMode)
  const isChecked = useUiStore(s => s.checkedIds.includes(task.id))
  const enterSelection = useUiStore(s => s.enterSelection)
  const toggleChecked = useUiStore(s => s.toggleChecked)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  /* Menu de contexto (botão direito, desktop) */
  const [ctxPoint, setCtxPoint] = useState<{ x: number; y: number } | null>(null)
  const [confirmSubtasks, setConfirmSubtasks] = useState(false)
  /* Sub-tarefas aninhadas na lista (estilo Todoist) — expandidas por padrão */
  const [subsOpen, setSubsOpen] = useState(true)
  const subtasks = useTaskStore(
    useShallow(s =>
      nested ? [] : s.tasks.filter(t => t.parentId === task.id).sort((a, b) => a.order - b.order),
    ),
  )
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)
  const longPressFired = useRef(false)

  const taskLabels = task.labels
    .map(id => allLabels.find(l => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l)

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

  /* Conclusão otimista local: o check anima antes de a linha sair da lista */
  const [justCompleted, setJustCompleted] = useState(false)
  const reducedMotion = useReducedMotion()

  const complete = () => {
    /* Concluir a mãe com sub-tarefas pendentes pergunta antes */
    if (!task.completed && subtaskTotal - subtaskDone > 0) {
      setConfirmSubtasks(true)
      return
    }
    if (!task.completed) {
      if (justCompleted) return
      if (soundEnabled) playCompleteSound()
      if (reducedMotion) { toggleComplete(task.id); return }
      setJustCompleted(true)
      setTimeout(() => { toggleComplete(task.id); setJustCompleted(false) }, 350)
      return
    }
    toggleComplete(task.id)
  }

  const completeWithSubtasks = (includeSubtasks: boolean) => {
    if (soundEnabled) playCompleteSound()
    if (includeSubtasks) {
      const pending = useTaskStore.getState().tasks
        .filter(t => t.parentId === task.id && !t.completed)
        .map(t => t.id)
      completeMany([task.id, ...pending])
    } else {
      toggleComplete(task.id)
    }
    setConfirmSubtasks(false)
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
        /* Divisória inset: começa na coluna do conteúdo da linha (Todoist) */
        'relative after:absolute after:bottom-0 after:right-0 after:h-px after:bg-line',
        nested
          ? 'after:left-[62px] before:absolute before:left-[33px] before:top-[22px] before:h-px before:w-[30px] before:bg-line-strong before:opacity-60'
          : subtasks.length > 0 ? 'after:left-9' : 'after:left-1',
        /* Borda sempre presente (transparent sem projeto) para alinhar todas as linhas */
        !nested && 'transition-[border-left-color] duration-200',
      )}
      style={{ borderLeft: `3px solid ${project && !nested ? project.color : 'transparent'}` }}
    >
      {/* Fundos revelados pelo swipe (apenas touch) */}
      {isTouch && (
        <>
          <motion.div
            style={{ opacity: rightHint }}
            className="absolute inset-y-0 left-0 flex w-24 items-center justify-start bg-done-bg pl-4 text-done"
          >
            <Check size={18} />
          </motion.div>
          <motion.div
            style={{ opacity: leftHint }}
            className="absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-today-bg pr-4 text-today"
          >
            <CalendarClock size={18} />
          </motion.div>
        </>
      )}

      {/* Linha principal (arrastável no touch) */}
      <motion.div
        drag={isTouch && !selectionMode ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        dragDirectionLock
        style={{ x }}
        onDragEnd={onDragEnd}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerMove={maybeCancelLongPress}
        onPointerLeave={cancelLongPress}
        onContextMenu={e => {
          if (isTouch || task.completed) return
          e.preventDefault()
          e.stopPropagation()
          setCtxPoint({ x: e.clientX, y: e.clientY })
        }}
        className={cn(
          'relative flex items-start gap-2 px-1 transition-[background-color]',
          'md:hover:bg-surface/50',
          /* Feedback transitório de toque — só enquanto o dedo pressiona a linha */
          'has-[[data-row-main]:active]:bg-surface/60',
          selected && 'bg-surface',
          isTouch && 'touch-pan-y',
          /* Sub-tarefa alinha o checkbox sob o TÍTULO da mãe (estilo Todoist) */
          nested && 'pl-[62px]',
        )}
      >
        {/* Chevron de sub-tarefas — só no pai, estilo Todoist */}
        {subtasks.length > 0 && (
          <button
            onClick={() => setSubsOpen(o => !o)}
            aria-expanded={subsOpen}
            aria-label={subsOpen ? 'Recolher sub-tarefas' : 'Expandir sub-tarefas'}
            className={cn(
              'relative mt-[10px] md:mt-2 flex size-7 shrink-0 -ml-1 cursor-pointer items-center justify-center rounded-md text-ink-faint',
              'transition-[background-color,color,scale] duration-150',
              'active:scale-[0.96] active:bg-surface md:hover:bg-surface md:hover:text-ink',
              /* Área de toque 44px na vertical; à direita para, para não invadir o checkbox */
              'after:absolute after:-inset-y-2 after:-left-2 after:right-0',
            )}
          >
            <motion.span
              animate={{ rotate: subsOpen ? 0 : -90 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              <ChevronDown size={15} />
            </motion.span>
          </button>
        )}
        {/* Centro óptico da 1ª linha do título: 24px (mobile, leading-6) / 22px (desktop, leading-5) */}
        <span className="mt-[15px] md:mt-[13px] shrink-0">
          {selectionMode ? (
            <span
              className={cn(
                'flex size-[18px] items-center justify-center rounded-full border-2 transition-colors',
                isChecked ? 'border-primary bg-primary text-primary-fg' : 'border-line-strong',
              )}
              style={!isChecked && PRIORITY_META[task.priority].tint
                ? { borderColor: PRIORITY_META[task.priority].tint }
                : undefined}
            >
              {isChecked && <Check size={11} strokeWidth={3} />}
            </span>
          ) : (
            <Checkbox
              checked={task.completed || justCompleted}
              onChange={complete}
              tint={PRIORITY_META[task.priority].tint}
              /* Toque de 44px com visual de 18px */
              className="relative z-10 -m-[13px] w-auto min-h-0 p-[13px]"
            />
          )}
        </span>
        <button
          onClick={() => {
            /* Ignora o clique gerado ao soltar o dedo do toque longo */
            if (longPressFired.current) { longPressFired.current = false; return }
            if (selectionMode) { toggleChecked(task.id); return }
            setDetailTask(task.id)
          }}
          data-row-main
          className="flex min-h-12 min-w-0 flex-1 cursor-pointer flex-col justify-center gap-0.5 py-3 text-left"
        >
          <span className={cn('truncate text-base leading-6 transition-colors duration-200 md:text-sm md:leading-5', (task.completed || justCompleted) && 'text-ink-faint line-through')}>
            {task.title}
          </span>

          {/* Prévia da descrição (primeira linha) */}
          {task.notes.trim() && (
            <span className="truncate text-[13px] text-ink-muted md:text-xs">
              {task.notes.trim().split('\n')[0]}
            </span>
          )}

          {/* Metadados — abaixo do título, estilo Todoist */}
          {(due || subtaskTotal > 0 || taskLabels.length > 0 || (project && !hideProject)) && (
            <span className="flex w-full flex-wrap items-center gap-2 text-[13px] md:text-xs">
              {subtaskTotal > 0 && (
                <span className="flex items-center gap-1 text-ink-faint">
                  <SubtaskIcon />
                  <span className="tabular-nums">
                    <RollingNumber value={subtaskDone} />/{subtaskTotal}
                  </span>
                </span>
              )}
              {due && (
                <span className="flex items-center gap-1 tabular-nums" style={{ color: dueColorVar(due) }}>
                  <Calendar size={12} />
                  {dueLabel(due)}{task.dueTime && ` ${task.dueTime}`}
                </span>
              )}
              {taskLabels.map(l => (
                <span
                  key={l.id}
                  className="inline-flex items-center rounded-[4px] border px-[5px] py-[1px] text-[11px] font-medium leading-4"
                  style={{ borderColor: l.color, color: l.color }}
                >
                  {l.name}
                </span>
              ))}
              {project && !hideProject && (
                <span className="ml-auto flex items-center gap-1.5 text-ink-faint">
                  {project.name}
                  <span className="size-2 rounded-full" style={{ background: project.color }} />
                </span>
              )}
            </span>
          )}
        </button>
      </motion.div>

      {/* Sub-tarefas aninhadas na lista */}
      <AnimatePresence initial={false}>
        {subtasks.length > 0 && subsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="relative [&>div:last-child]:after:hidden">
              {/* Linha vertical da ramificação — alinhada ao checkbox do pai */}
              <div className="pointer-events-none absolute bottom-5 left-[36px] top-0 w-px bg-line-strong opacity-60" aria-hidden />
              {subtasks.map(sub => (
                <TaskItem key={sub.id} task={sub} hideProject nested disableLongPress={disableLongPress} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concluir a mãe com sub-tarefas pendentes */}
      <Modal
        open={confirmSubtasks}
        onClose={() => setConfirmSubtasks(false)}
        title="Concluir tarefa"
      >
        <p className="mb-4 text-sm text-ink-muted">
          <strong className="text-ink">{task.title}</strong> tem{' '}
          {subtaskTotal - subtaskDone}{' '}
          {subtaskTotal - subtaskDone === 1 ? 'sub-tarefa pendente' : 'sub-tarefas pendentes'}.
          Concluir junto?
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmSubtasks(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={() => completeWithSubtasks(false)}>Só esta tarefa</Button>
          <Button onClick={() => completeWithSubtasks(true)}>Concluir tudo</Button>
        </div>
      </Modal>

      {/* Menu de contexto (botão direito) */}
      <TaskContextMenu task={task} point={ctxPoint} onClose={() => setCtxPoint(null)} />

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
