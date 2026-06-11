import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Text, Hash, Calendar, Flag, Trash2, CalendarClock, Check,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useUiStore } from '../stores/useUiStore'
import { useTaskStore } from '../stores/useTaskStore'
import { Checkbox } from './ui/Checkbox'
import { SubtaskList } from '../features/tasks/SubtaskList'
import { playCompleteSound } from '../lib/sound'
import type { Priority } from '../features/tasks/types'
import { cn } from '../lib/cn'

const PRIORITY_TINTS: Record<Priority, string> = {
  1: 'var(--priority-1)', 2: 'var(--priority-2)', 3: 'var(--priority-3)', 4: 'var(--ink-faint)',
}

/** Detalhe da tarefa em bottom sheet (mobile) — padrão Todoist iOS. */
export function TaskDetailSheet() {
  const taskId = useUiStore(s => s.detailTaskId)
  const setDetailTask = useUiStore(s => s.setDetailTask)
  const soundEnabled = useUiStore(s => s.soundEnabled)

  const task = useTaskStore(s => s.tasks.find(t => t.id === taskId))
  const projects = useTaskStore(s => s.projects)
  const sections = useTaskStore(s => s.sections)
  const updateTask = useTaskStore(s => s.updateTask)
  const toggleComplete = useTaskStore(s => s.toggleComplete)
  const completeMany = useTaskStore(s => s.completeMany)
  const deleteTask = useTaskStore(s => s.deleteTask)

  const close = () => setDetailTask(null)

  const project = projects.find(p => p.id === task?.projectId)
  const section = sections.find(s => s.id === task?.sectionId)
  const taskSections = task?.projectId
    ? sections.filter(s => s.projectId === task.projectId).sort((a, b) => a.order - b.order)
    : []

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

  const Row = ({ icon, children, className }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) => (
    <div className={cn('flex min-h-[52px] items-center gap-3.5 border-b border-line', className)}>
      <span className="flex w-6 shrink-0 justify-center text-ink-muted">{icon}</span>
      <div className="min-w-0 flex-1 py-2">{children}</div>
    </div>
  )

  return createPortal(
    <AnimatePresence>
      {task && (
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
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120) close() }}
            className="relative flex max-h-[94dvh] flex-col rounded-t-2xl bg-canvas shadow-[var(--shadow-lg)]"
            style={{ height: '94dvh' }}
          >
            {/* Alça + fechar */}
            <div className="shrink-0 px-4 pt-2.5">
              <div className="mx-auto h-1 w-9 rounded-full bg-line-strong" />
              <div className="flex items-center justify-between pt-1.5">
                <button
                  onClick={close}
                  aria-label="Fechar"
                  className="flex size-11 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors active:bg-surface"
                >
                  <X size={22} />
                </button>
                <button
                  onClick={() => { deleteTask(task.id); close() }}
                  aria-label="Excluir tarefa"
                  className="flex size-11 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors active:bg-overdue-bg active:text-overdue"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo rolável */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">

              {/* Checkbox + título */}
              <div className="flex items-start gap-3 pb-2 pt-1">
                <span className="mt-[7px]">
                  <Checkbox
                    checked={task.completed}
                    onChange={complete}
                    tint={PRIORITY_TINTS[task.priority] === 'var(--ink-faint)' ? undefined : PRIORITY_TINTS[task.priority]}
                    className="relative z-10 -m-3 w-auto min-h-0 p-3"
                  />
                </span>
                <input
                  value={task.title}
                  onChange={e => updateTask(task.id, { title: e.target.value })}
                  className={cn(
                    'w-full border-0 bg-transparent text-xl font-semibold leading-7 focus:outline-none',
                    task.completed && 'text-ink-faint line-through',
                  )}
                />
              </div>

              {/* Descrição */}
              <Row icon={<Text size={18} />}>
                <textarea
                  value={task.notes}
                  onChange={e => updateTask(task.id, { notes: e.target.value })}
                  placeholder="Descrição"
                  rows={Math.min(6, Math.max(1, task.notes.split('\n').length))}
                  className="w-full resize-none border-0 bg-transparent text-[15px] leading-6 text-ink placeholder:text-ink-faint focus:outline-none"
                />
              </Row>

              {/* Projeto / Seção */}
              <Row icon={<Hash size={18} />}>
                <div className="flex flex-wrap items-center gap-1 text-[15px]">
                  <select
                    value={task.projectId ?? ''}
                    onChange={e => updateTask(task.id, { projectId: e.target.value || null, sectionId: null })}
                    className="max-w-44 cursor-pointer truncate bg-transparent font-medium outline-none"
                  >
                    <option value="">Entrada</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {project && taskSections.length > 0 && (
                    <>
                      <span className="text-ink-faint">/</span>
                      <select
                        value={task.sectionId ?? ''}
                        onChange={e => updateTask(task.id, { sectionId: e.target.value || null })}
                        className="max-w-40 cursor-pointer truncate bg-transparent font-medium outline-none"
                      >
                        <option value="">Sem seção</option>
                        {taskSections.map(sec => (
                          <option key={sec.id} value={sec.id}>{sec.name}</option>
                        ))}
                      </select>
                    </>
                  )}
                  {section && taskSections.length === 0 && (
                    <span className="text-ink-muted">/ {section.name}</span>
                  )}
                </div>
              </Row>

              {/* Vencimento */}
              <Row icon={<Calendar size={18} />}>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    lang="pt-BR"
                    value={task.dueDate ?? ''}
                    onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                    className={cn(
                      'cursor-pointer bg-transparent text-[15px] outline-none',
                      task.dueDate ? 'text-ink' : 'text-ink-faint',
                    )}
                  />
                  <span className="flex items-center gap-1 text-ink-faint">
                    <CalendarClock size={15} />
                    <input
                      type="time"
                      lang="pt-BR"
                      value={task.dueTime ?? ''}
                      onChange={e => updateTask(task.id, { dueTime: e.target.value || null })}
                      className="cursor-pointer bg-transparent text-[15px] text-ink outline-none"
                    />
                  </span>
                </div>
              </Row>

              {/* Prioridade */}
              <Row icon={<Flag size={18} />}>
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3, 4] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => updateTask(task.id, { priority: p })}
                      aria-label={`Prioridade ${p}`}
                      className={cn(
                        'flex h-10 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-sm font-semibold transition-colors',
                        task.priority === p ? 'bg-surface' : 'text-ink-faint',
                      )}
                      style={task.priority === p ? { color: PRIORITY_TINTS[p] } : undefined}
                    >
                      <Flag
                        size={15}
                        fill={PRIORITY_TINTS[p]}
                        style={{ color: PRIORITY_TINTS[p] }}
                      />
                      {p}
                      {task.priority === p && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </Row>

              {/* Sub-tarefas */}
              <div className="pt-4">
                <p className="mb-1 text-[15px] font-semibold">Subtarefas</p>
                <SubtaskList parentId={task.id} />
              </div>

              {/* Rodapé */}
              <p className="pt-6 text-center text-xs text-ink-faint">
                Criada em {format(parseISO(task.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
