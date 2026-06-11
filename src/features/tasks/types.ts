export type Priority = 1 | 2 | 3 | 4

export interface Task {
  id: string
  title: string
  notes: string
  completed: boolean
  completedAt: string | null
  /** Data de vencimento em ISO (yyyy-MM-dd), sem hora */
  dueDate: string | null
  /** Hora opcional (HH:mm) */
  dueTime: string | null
  projectId: string | null
  /** Seção dentro do projeto (opcional) */
  sectionId: string | null
  labels: string[]
  priority: Priority
  order: number
  createdAt: string
}

export interface Project {
  id: string
  name: string
  color: string
  order: number
}

export interface Section {
  id: string
  projectId: string
  name: string
  order: number
  collapsed: boolean
}

export const PROJECT_COLORS = [
  'oklch(0.78 0.07 262)',  // azul sereno
  'oklch(0.84 0.07 70)',   // pêssego
  'oklch(0.79 0.09 20)',   // rosa
  'oklch(0.80 0.07 155)',  // sálvia
  'oklch(0.78 0.07 300)',  // lavanda
  'oklch(0.82 0.08 110)',  // lima suave
] as const
