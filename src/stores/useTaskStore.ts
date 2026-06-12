import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { Task, Project, Section, Label, Priority } from '../features/tasks/types'
import { LABEL_COLORS } from '../features/tasks/types'

/* Persistência em IndexedDB via idb-keyval */
const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet<string>(name)) ?? null,
  setItem: async (name, value) => idbSet(name, value),
  removeItem: async (name) => idbDel(name),
}

interface PendingDelete {
  tasks: Task[]
  timeoutId: ReturnType<typeof setTimeout>
}

interface TaskStore {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  labels: Label[]
  /** Tarefa recém-excluída aguardando undo (não persiste) */
  pendingDelete: PendingDelete | null

  addTask: (input: { title: string; dueDate?: string | null; dueTime?: string | null; projectId?: string | null; sectionId?: string | null; parentId?: string | null; priority?: Priority; labels?: string[] }) => void
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void
  toggleComplete: (id: string) => void
  completeMany: (ids: string[]) => void
  deleteTask: (id: string) => void
  deleteMany: (ids: string[]) => void
  undoDelete: () => void
  reorderTasks: (ids: string[]) => void

  addProject: (name: string, color: string) => Project
  updateProject: (id: string, patch: Partial<Omit<Project, 'id'>>) => void
  deleteProject: (id: string) => void

  addLabel: (name: string, color?: string) => Label
  updateLabel: (id: string, patch: Partial<Omit<Label, 'id'>>) => void
  deleteLabel: (id: string) => void

  addSection: (projectId: string, name: string) => Section
  updateSection: (id: string, patch: Partial<Omit<Section, 'id' | 'projectId'>>) => void
  deleteSection: (id: string) => void
  moveSection: (id: string, dir: 1 | -1) => void
  reorderSections: (projectId: string, ids: string[]) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      sections: [],
      labels: [],
      pendingDelete: null,

      addTask: ({ title, dueDate = null, dueTime = null, projectId = null, sectionId = null, parentId = null, priority = 4, labels = [] }) => {
        const trimmed = title.trim()
        if (!trimmed) return
        const { tasks } = get()
        /* Sub-tarefas entram no fim da lista de irmãs; tarefas normais no topo */
        const order = parentId
          ? Math.max(-1, ...tasks.filter(t => t.parentId === parentId).map(t => t.order)) + 1
          : Math.min(0, ...tasks.map(t => t.order)) - 1
        const task: Task = {
          id: crypto.randomUUID(),
          title: trimmed,
          notes: '',
          completed: false,
          completedAt: null,
          dueDate,
          dueTime,
          projectId,
          sectionId,
          parentId,
          labels,
          priority,
          order,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ tasks: [task, ...s.tasks] }))
      },

      updateTask: (id, patch) =>
        set(s => ({
          tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)),
        })),

      toggleComplete: (id) =>
        set(s => ({
          tasks: s.tasks.map(t =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : null,
                }
              : t,
          ),
        })),

      completeMany: (ids) => {
        const now = new Date().toISOString()
        set(s => ({
          tasks: s.tasks.map(t =>
            ids.includes(t.id) && !t.completed
              ? { ...t, completed: true, completedAt: now }
              : t,
          ),
        }))
      },

      deleteTask: (id) => get().deleteMany([id]),

      deleteMany: (ids) => {
        const { tasks, pendingDelete } = get()
        /* Excluir uma tarefa-mãe leva as sub-tarefas junto (undo restaura tudo) */
        const removed = tasks.filter(
          t => ids.includes(t.id) || (t.parentId !== null && ids.includes(t.parentId)),
        )
        if (removed.length === 0) return
        const removedIds = removed.map(t => t.id)
        ids = removedIds
        /* Se já havia uma exclusão pendente, confirma ela imediatamente */
        if (pendingDelete) clearTimeout(pendingDelete.timeoutId)
        const timeoutId = setTimeout(() => {
          set(s => (s.pendingDelete?.timeoutId === timeoutId ? { pendingDelete: null } : s))
        }, 5000)
        set(s => ({
          tasks: s.tasks.filter(t => !ids.includes(t.id)),
          pendingDelete: { tasks: removed, timeoutId },
        }))
      },

      undoDelete: () => {
        const { pendingDelete } = get()
        if (!pendingDelete) return
        clearTimeout(pendingDelete.timeoutId)
        set(s => ({
          tasks: [...pendingDelete.tasks, ...s.tasks],
          pendingDelete: null,
        }))
      },

      reorderTasks: (ids) =>
        set(s => {
          const orderMap = new Map(ids.map((id, i) => [id, i]))
          return {
            tasks: s.tasks.map(t =>
              orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t,
            ),
          }
        }),

      addProject: (name, color) => {
        const project: Project = {
          id: crypto.randomUUID(),
          name: name.trim(),
          color,
          order: get().projects.length,
        }
        set(s => ({ projects: [...s.projects, project] }))
        return project
      },

      updateProject: (id, patch) =>
        set(s => ({
          projects: s.projects.map(p => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProject: (id) =>
        set(s => ({
          projects: s.projects.filter(p => p.id !== id),
          sections: s.sections.filter(sec => sec.projectId !== id),
          /* Tarefas do projeto voltam para a caixa de entrada */
          tasks: s.tasks.map(t =>
            t.projectId === id ? { ...t, projectId: null, sectionId: null } : t,
          ),
        })),

      addLabel: (name, color) => {
        const { labels } = get()
        /* Sem cor definida: a próxima cor livre da paleta */
        const used = new Set(labels.map(l => l.color))
        const free = LABEL_COLORS.find(c => !used.has(c.hex))?.hex ?? LABEL_COLORS[0].hex
        const label: Label = {
          id: crypto.randomUUID(),
          name: name.trim(),
          color: color ?? free,
          order: labels.length,
        }
        set(s => ({ labels: [...s.labels, label] }))
        return label
      },

      updateLabel: (id, patch) =>
        set(s => ({
          labels: s.labels.map(l => (l.id === id ? { ...l, ...patch } : l)),
        })),

      deleteLabel: (id) =>
        set(s => ({
          labels: s.labels.filter(l => l.id !== id),
          tasks: s.tasks.map(t =>
            t.labels.includes(id) ? { ...t, labels: t.labels.filter(x => x !== id) } : t,
          ),
        })),

      addSection: (projectId, name) => {
        const section: Section = {
          id: crypto.randomUUID(),
          projectId,
          name: name.trim(),
          order: Math.max(-1, ...get().sections.filter(s => s.projectId === projectId).map(s => s.order)) + 1,
          collapsed: false,
        }
        set(s => ({ sections: [...s.sections, section] }))
        return section
      },

      updateSection: (id, patch) =>
        set(s => ({
          sections: s.sections.map(sec => (sec.id === id ? { ...sec, ...patch } : sec)),
        })),

      deleteSection: (id) =>
        set(s => ({
          sections: s.sections.filter(sec => sec.id !== id),
          /* Tarefas da seção sobem para o grupo sem seção do projeto */
          tasks: s.tasks.map(t => (t.sectionId === id ? { ...t, sectionId: null } : t)),
        })),

      moveSection: (id, dir) =>
        set(s => {
          const section = s.sections.find(sec => sec.id === id)
          if (!section) return s
          const siblings = s.sections
            .filter(sec => sec.projectId === section.projectId)
            .sort((a, b) => a.order - b.order)
          const idx = siblings.findIndex(sec => sec.id === id)
          const swap = siblings[idx + dir]
          if (!swap) return s
          return {
            sections: s.sections.map(sec =>
              sec.id === section.id ? { ...sec, order: swap.order }
              : sec.id === swap.id ? { ...sec, order: section.order }
              : sec,
            ),
          }
        }),

      reorderSections: (projectId, ids) =>
        set(s => {
          const orderMap = new Map(ids.map((id, i) => [id, i]))
          return {
            sections: s.sections.map(sec =>
              sec.projectId === projectId && orderMap.has(sec.id)
                ? { ...sec, order: orderMap.get(sec.id)! }
                : sec,
            ),
          }
        }),
    }),
    {
      name: 'tasker-data',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ tasks: s.tasks, projects: s.projects, sections: s.sections, labels: s.labels }),
    },
  ),
)
