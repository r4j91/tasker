import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil, Calendar, CalendarClock, Tag, FolderInput, Copy, Trash2, Flag,
  ChevronRight, ArrowLeft, Inbox, CircleSlash,
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import type { Task, Priority } from './types'
import { useTaskStore } from '../../stores/useTaskStore'
import { useUiStore } from '../../stores/useUiStore'
import { todayISO } from '../../lib/dates'
import { LabelPickerModal } from '../labels/LabelPickerModal'
import { cn } from '../../lib/cn'

const PRIORITY_TINTS: Record<Priority, string> = {
  1: 'var(--priority-1)', 2: 'var(--priority-2)', 3: 'var(--priority-3)', 4: 'var(--ink-faint)',
}

const MENU_W = 232

interface TaskContextMenuProps {
  task: Task
  /** Ponto do clique (clientX/clientY); null = fechado */
  point: { x: number; y: number } | null
  onClose: () => void
}

/** Menu de contexto da tarefa (botão direito, desktop) — estilo Todoist. */
export function TaskContextMenu({ task, point, onClose }: TaskContextMenuProps) {
  const updateTask = useTaskStore(s => s.updateTask)
  const duplicateTask = useTaskStore(s => s.duplicateTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const projects = useTaskStore(s => s.projects)
  const sections = useTaskStore(s => s.sections)
  const setDetailTask = useUiStore(s => s.setDetailTask)

  const [view, setView] = useState<'main' | 'schedule' | 'move'>('main')
  const [labelsOpen, setLabelsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  /* Reabre sempre na raiz */
  useEffect(() => { if (point) setView('main') }, [point])

  /* Esc fecha */
  useEffect(() => {
    if (!point) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [point, onClose])

  const projectSections = sections
    .filter(s => s.projectId === task.projectId)
    .sort((a, b) => a.order - b.order)

  const scheduleOptions: Array<{ label: string; date: string | null; icon: typeof Calendar }> = [
    { label: 'Hoje', date: todayISO(), icon: Calendar },
    { label: 'Amanhã', date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), icon: CalendarClock },
    { label: 'Próxima semana', date: format(addDays(new Date(), 7), 'yyyy-MM-dd'), icon: CalendarClock },
    { label: 'Remover data', date: null, icon: CircleSlash },
  ]

  /* Posição: ancorado no clique, sem sair da janela */
  const pos = point
    ? {
        left: Math.min(point.x, window.innerWidth - MENU_W - 8),
        top: Math.min(point.y, window.innerHeight - 320),
      }
    : { left: 0, top: 0 }

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {point && (
            <div className="fixed inset-0 z-50" onContextMenu={e => { e.preventDefault(); onClose() }}>
              <div className="absolute inset-0" onClick={onClose} />
              <motion.div
                ref={panelRef}
                role="menu"
                aria-label={`Ações de ${task.title}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.13, ease: 'easeOut' }}
                style={{ ...pos, width: MENU_W, transformOrigin: 'top left' }}
                className="absolute max-h-80 overflow-y-auto rounded-xl border border-line bg-surface-elevated py-1 shadow-[var(--shadow-lg)]"
              >
                {view === 'main' && (
                  <>
                    <Item icon={Pencil} label="Editar tarefa" onClick={() => { onClose(); setDetailTask(task.id) }} />

                    <Divider />

                    {/* Prioridade — bandeiras inline */}
                    <div className="flex items-center gap-1 px-3 py-1.5">
                      <span className="mr-auto text-xs text-ink-muted">Prioridade</span>
                      {([1, 2, 3, 4] as Priority[]).map(p => (
                        <button
                          key={p}
                          aria-label={`Prioridade ${p}`}
                          onClick={() => { updateTask(task.id, { priority: p }); onClose() }}
                          className={cn(
                            'flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-surface',
                            task.priority === p && 'bg-surface',
                          )}
                        >
                          <Flag
                            size={14}
                            style={{ color: PRIORITY_TINTS[p] }}
                            fill={p < 4 ? PRIORITY_TINTS[p] : 'none'}
                          />
                        </button>
                      ))}
                    </div>

                    <Divider />

                    <Item icon={Calendar} label="Agendar" chevron onClick={() => setView('schedule')} />
                    <Item icon={Tag} label="Etiquetas" onClick={() => { setLabelsOpen(true); onClose() }} />
                    <Item icon={FolderInput} label="Mover para" chevron onClick={() => setView('move')} />

                    <Divider />

                    <Item icon={Copy} label="Duplicar" onClick={() => { duplicateTask(task.id); onClose() }} />
                    <Item icon={Trash2} label="Excluir" destructive onClick={() => { deleteTask(task.id); onClose() }} />
                  </>
                )}

                {view === 'schedule' && (
                  <>
                    <BackRow label="Agendar" onBack={() => setView('main')} />
                    {scheduleOptions.map(opt => (
                      <Item
                        key={opt.label}
                        icon={opt.icon}
                        label={opt.label}
                        onClick={() => { updateTask(task.id, { dueDate: opt.date }); onClose() }}
                      />
                    ))}
                  </>
                )}

                {view === 'move' && (
                  <>
                    <BackRow label="Mover para" onBack={() => setView('main')} />

                    {projectSections.length > 0 && (
                      <>
                        <GroupLabel>Seções</GroupLabel>
                        <Item
                          icon={CircleSlash}
                          label="Sem seção"
                          active={!task.sectionId}
                          onClick={() => { updateTask(task.id, { sectionId: null }); onClose() }}
                        />
                        {projectSections.map(s => (
                          <Item
                            key={s.id}
                            icon={FolderInput}
                            label={s.name}
                            active={task.sectionId === s.id}
                            onClick={() => { updateTask(task.id, { sectionId: s.id }); onClose() }}
                          />
                        ))}
                      </>
                    )}

                    <GroupLabel>Projetos</GroupLabel>
                    <Item
                      icon={Inbox}
                      label="Caixa de entrada"
                      active={!task.projectId}
                      onClick={() => { updateTask(task.id, { projectId: null, sectionId: null }); onClose() }}
                    />
                    {projects.map(p => (
                      <Item
                        key={p.id}
                        dot={p.color}
                        label={p.name}
                        active={task.projectId === p.id}
                        onClick={() => {
                          if (task.projectId !== p.id) updateTask(task.id, { projectId: p.id, sectionId: null })
                          onClose()
                        }}
                      />
                    ))}
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <LabelPickerModal
        open={labelsOpen}
        onClose={() => setLabelsOpen(false)}
        taskId={task.id}
      />
    </>
  )
}

/* ── Peças ── */

function Item({ icon: Icon, dot, label, onClick, chevron, destructive, active }: {
  icon?: typeof Pencil
  /** Bolinha colorida no lugar do ícone (projetos) */
  dot?: string
  label: string
  onClick: () => void
  chevron?: boolean
  destructive?: boolean
  active?: boolean
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex min-h-9 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm transition-colors',
        destructive ? 'text-overdue hover:bg-overdue-bg' : 'hover:bg-surface',
        active && 'bg-surface',
      )}
    >
      {Icon && <Icon size={14} className={cn('shrink-0', !destructive && 'text-ink-muted')} />}
      {dot && <span className="size-2.5 shrink-0 rounded-full" style={{ background: dot }} />}
      <span className="truncate">{label}</span>
      {chevron && <ChevronRight size={14} className="ml-auto shrink-0 text-ink-faint" />}
    </button>
  )
}

function BackRow({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex min-h-9 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm font-medium transition-colors hover:bg-surface"
    >
      <ArrowLeft size={14} className="text-ink-muted" />
      {label}
    </button>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-0.5 pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-line" />
}
