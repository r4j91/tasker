import { useMemo, useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
  closestCorners, useDroppable, type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MoreHorizontal, Plus, Pencil, ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-react'
import type { Task, Section } from './types'
import { TaskItem } from './TaskItem'
import { useTaskStore } from '../../stores/useTaskStore'
import { useUiStore } from '../../stores/useUiStore'
import { parseTask } from '../../lib/nlparse'
import { cn } from '../../lib/cn'

const NO_SECTION = 'none'

interface SectionedTasksProps {
  projectId: string
}

export function SectionedTasks({ projectId }: SectionedTasksProps) {
  const tasks = useTaskStore(s => s.tasks)
  const sections = useTaskStore(s => s.sections)
  const updateTask = useTaskStore(s => s.updateTask)
  const reorderTasks = useTaskStore(s => s.reorderTasks)
  const reorderSections = useTaskStore(s => s.reorderSections)

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const projectSections = useMemo(
    () => sections.filter(s => s.projectId === projectId).sort((a, b) => a.order - b.order),
    [sections, projectId],
  )

  const tasksOf = (sectionId: string | null) =>
    tasks
      .filter(t => !t.completed && !t.parentId && t.projectId === projectId && (t.sectionId ?? null) === sectionId)
      .sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 8 } }),
  )

  const containerOf = (id: string): string | null => {
    if (id.startsWith('container:')) {
      const c = id.slice('container:'.length)
      return c === NO_SECTION ? null : c
    }
    const t = tasks.find(t => t.id === id)
    return t ? (t.sectionId ?? null) : null
  }

  const onDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.type === 'task') {
      setActiveTask(tasks.find(t => t.id === e.active.id) ?? null)
    }
  }

  /* Move otimista entre contêineres enquanto arrasta */
  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over || active.data.current?.type !== 'task') return
    if (String(over.id).startsWith('sec:')) return
    const from = containerOf(String(active.id))
    const to = containerOf(String(over.id))
    if (from !== to) updateTask(String(active.id), { sectionId: to })
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveTask(null)
    if (!over) return

    /* Reordenar seções */
    if (active.data.current?.type === 'section') {
      const activeId = String(active.id).replace('sec:', '')
      const overId = String(over.id).replace('sec:', '')
      if (activeId === overId) return
      const ids = projectSections.map(s => s.id)
      const reordered = arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId))
      reorderSections(projectId, reordered)
      return
    }

    /* Reordenar tarefas dentro do contêiner de destino */
    const container = containerOf(String(active.id))
    const list = tasksOf(container).map(t => t.id)
    const overId = String(over.id)
    if (!list.includes(String(active.id))) return
    const fromIdx = list.indexOf(String(active.id))
    const toIdx = list.includes(overId) ? list.indexOf(overId) : list.length - 1
    reorderTasks(arrayMove(list, fromIdx, toIdx))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Grupo sem seção — topo, sem cabeçalho */}
      <TaskContainer sectionId={null} tasks={tasksOf(null)} />

      {/* Seções */}
      <SortableContext items={projectSections.map(s => `sec:${s.id}`)} strategy={verticalListSortingStrategy}>
        {projectSections.map((section, i) => (
          <div key={section.id}>
            <AddSectionDivider projectId={projectId} index={i} />
            <SectionBlock section={section} tasks={tasksOf(section.id)} canMoveUp={i > 0} canMoveDown={i < projectSections.length - 1} />
          </div>
        ))}
      </SortableContext>

      <AddSectionEnd projectId={projectId} />

      <DragOverlay>
        {activeTask && (
          <div className="rounded-xl border border-line bg-surface-elevated shadow-[var(--shadow-lg)]">
            <TaskItem task={activeTask} hideProject disableLongPress />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

/* ── Contêiner de tarefas (droppable + sortable) ── */

function TaskContainer({ sectionId, tasks }: { sectionId: string | null; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${sectionId ?? NO_SECTION}` })

  return (
    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-2 rounded-xl transition-colors',
          isOver && tasks.length === 0 && 'bg-primary-subtle/50',
        )}
      >
        {tasks.map(task => (
          <SortableTaskRow key={task.id} task={task} />
        ))}
      </div>
    </SortableContext>
  )
}

function SortableTaskRow({ task }: { task: Task }) {
  /* Expandida: desativa o drag da linha para não conflitar com o reorder das sub-tarefas */
  const expanded = useUiStore(s => s.expandedId === task.id)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' },
    disabled: expanded,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <TaskItem task={task} hideProject disableLongPress />
    </div>
  )
}

/* ── Bloco de seção ── */

function SectionBlock({ section, tasks, canMoveUp, canMoveDown }: {
  section: Section
  tasks: Task[]
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const updateSection = useTaskStore(s => s.updateSection)
  const deleteSection = useTaskStore(s => s.deleteSection)
  const moveSection = useTaskStore(s => s.moveSection)
  const addTask = useTaskStore(s => s.addTask)

  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(section.name)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `sec:${section.id}`,
    data: { type: 'section' },
  })

  const saveRename = () => {
    if (name.trim()) updateSection(section.id, { name: name.trim() })
    setRenaming(false)
  }

  const projects = useTaskStore(s => s.projects)

  const submitTask = () => {
    const parsed = parseTask(newTitle, projects, useTaskStore.getState().labels)
    if (!parsed.title.trim()) return
    addTask({
      title: parsed.title,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      priority: parsed.priority,
      projectId: section.projectId,
      sectionId: section.id,
      labels: parsed.labelIds,
    })
    setNewTitle('')
  }

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('mt-5', isDragging && 'opacity-40')}
    >
      {/* Cabeçalho */}
      <div className="group/header flex min-h-11 items-center gap-1 border-b border-line pb-1">
        <button
          aria-label="Arrastar seção"
          className="hidden cursor-grab touch-none text-ink-faint opacity-0 transition-opacity group-hover/header:opacity-100 md:block"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>

        <button
          onClick={() => updateSection(section.id, { collapsed: !section.collapsed })}
          aria-label={section.collapsed ? 'Expandir seção' : 'Recolher seção'}
          className="flex size-11 cursor-pointer items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface hover:text-ink md:size-6"
        >
          <motion.span
            animate={{ rotate: section.collapsed ? -90 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex"
          >
            <ChevronDown size={15} />
          </motion.span>
        </button>

        {renaming ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(false) }}
            onBlur={saveRename}
            autoFocus
            className="border-b border-primary bg-transparent text-sm font-semibold outline-none"
          />
        ) : (
          <span className="text-sm font-semibold">{section.name}</span>
        )}

        <span className="text-xs text-ink-faint">{tasks.length}</span>

        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={`Opções da seção ${section.name}`}
            className="flex size-11 cursor-pointer items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface hover:text-ink md:size-8"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-line bg-surface-elevated py-1 shadow-[var(--shadow-md)]">
                <MenuItem icon={Pencil} label="Renomear" onClick={() => { setName(section.name); setRenaming(true); setMenuOpen(false) }} />
                {canMoveUp && <MenuItem icon={ArrowUp} label="Mover para cima" onClick={() => { moveSection(section.id, -1); setMenuOpen(false) }} />}
                {canMoveDown && <MenuItem icon={ArrowDown} label="Mover para baixo" onClick={() => { moveSection(section.id, 1); setMenuOpen(false) }} />}
                <MenuItem
                  icon={Trash2}
                  label="Excluir seção"
                  destructive
                  onClick={() => { deleteSection(section.id); setMenuOpen(false) }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tarefas (recolhível) */}
      <AnimatePresence initial={false}>
        {!section.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <TaskContainer sectionId={section.id} tasks={tasks} />

              {/* Adicionar tarefa na seção */}
              {adding ? (
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitTask()
                    if (e.key === 'Escape') { setNewTitle(''); setAdding(false) }
                  }}
                  onBlur={() => { if (!newTitle.trim()) setAdding(false) }}
                  autoFocus
                  placeholder="Nome da tarefa (Enter para adicionar)"
                  className="mt-1 h-10 w-full rounded-lg border border-primary bg-surface-elevated px-3 text-sm placeholder:text-ink-faint focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    if (window.matchMedia('(max-width: 767px)').matches) {
                      useUiStore.getState().openQuickAdd({ projectId: section.projectId, sectionId: section.id })
                    } else {
                      setAdding(true)
                    }
                  }}
                  className="group flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg px-1 text-sm text-ink-faint transition-colors hover:text-ink-muted md:h-10 md:text-[13px]"
                >
                  <span className="flex size-[16px] items-center justify-center rounded-full text-primary-ink transition-colors group-hover:bg-primary group-hover:text-primary-fg">
                    <Plus size={13} />
                  </span>
                  Adicionar tarefa
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function MenuItem({ icon: Icon, label, onClick, destructive }: {
  icon: typeof Pencil
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm transition-colors md:min-h-9',
        destructive ? 'text-overdue hover:bg-overdue-bg' : 'hover:bg-surface',
      )}
    >
      <Icon size={13} /> {label}
    </button>
  )
}

/* ── Adicionar seção ── */

function useAddSection(projectId: string) {
  const addSection = useTaskStore(s => s.addSection)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    if (name.trim()) addSection(projectId, name)
    setName('')
    setOpen(false)
  }

  const input = open && (
    <div className="my-2">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') { setName(''); setOpen(false) }
        }}
        onBlur={() => { if (!name.trim()) setOpen(false) }}
        autoFocus
        placeholder="Nome da seção (Enter para criar)"
        className="h-10 w-full rounded-lg border border-primary bg-surface-elevated px-3 text-sm placeholder:text-ink-faint focus:outline-none"
      />
    </div>
  )

  return { open, setOpen, input }
}

/** Divisor que revela "Adicionar seção" no hover — desktop */
function AddSectionDivider({ projectId, index }: { projectId: string; index: number }) {
  const { open, setOpen, input } = useAddSection(projectId)

  if (open) return <>{input}</>

  return (
    <div className="group/divider relative hidden h-4 items-center md:flex" data-divider={index}>
      <button
        onClick={() => setOpen(true)}
        className="absolute inset-x-0 flex cursor-pointer items-center gap-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/divider:opacity-100"
      >
        <span className="h-px flex-1 bg-primary/40" />
        <span className="text-xs font-medium text-primary-ink">Adicionar seção</span>
        <span className="h-px flex-1 bg-primary/40" />
      </button>
    </div>
  )
}

/** Botão no fim da lista — sempre visível no mobile, sutil no desktop */
function AddSectionEnd({ projectId }: { projectId: string }) {
  const { open, setOpen, input } = useAddSection(projectId)

  if (open) return <>{input}</>

  return (
    <button
      onClick={() => setOpen(true)}
      className="mt-5 flex h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-ink-faint transition-colors hover:text-ink-muted md:h-10 md:text-[13px]"
    >
      <Plus size={14} />
      Adicionar seção
    </button>
  )
}
