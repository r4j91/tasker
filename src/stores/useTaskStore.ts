import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { Task, Project, Priority } from '../features/tasks/types'

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
  /** Tarefa recém-excluída aguardando undo (não persiste) */
  pendingDelete: PendingDelete | null

  addTask: (input: { title: string; dueDate?: string | null; dueTime?: string | null; projectId?: string | null; priority?: Priority }) => void
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
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      pendingDelete: null,

      addTask: ({ title, dueDate = null, dueTime = null, projectId = null, priority = 4 }) => {
        const trimmed = title.trim()
        if (!trimmed) return
        const task: Task = {
          id: crypto.randomUUID(),
          title: trimmed,
          notes: '',
          completed: false,
          completedAt: null,
          dueDate,
          dueTime,
          projectId,
          labels: [],
          priority,
          order: Math.min(0, ...get().tasks.map(t => t.order)) - 1,
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
        const removed = tasks.filter(t => ids.includes(t.id))
        if (removed.length === 0) return
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
          /* Tarefas do projeto voltam para a caixa de entrada */
          tasks: s.tasks.map(t => (t.projectId === id ? { ...t, projectId: null } : t)),
        })),
    }),
    {
      name: 'tasker-data',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ tasks: s.tasks, projects: s.projects }),
    },
  ),
)
