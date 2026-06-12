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
  /** Tarefa-mãe — presente quando esta é uma sub-tarefa (1 nível) */
  parentId: string | null
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

export interface Label {
  id: string
  name: string
  /** Hex da paleta Todoist */
  color: string
  order: number
}

/** Paleta de cores do Todoist (nome + hex) */
export const LABEL_COLORS: Array<{ name: string; hex: string }> = [
  { name: 'Berry Red',  hex: '#B8256F' },
  { name: 'Red',        hex: '#DB4035' },
  { name: 'Orange',     hex: '#FF9933' },
  { name: 'Yellow',     hex: '#FAD000' },
  { name: 'Olive',      hex: '#AFB83B' },
  { name: 'Lime',       hex: '#7ECC49' },
  { name: 'Green',      hex: '#299438' },
  { name: 'Mint',       hex: '#6ACCBC' },
  { name: 'Teal',       hex: '#158FAD' },
  { name: 'Sky Blue',   hex: '#14AAF5' },
  { name: 'Light Blue', hex: '#96C3EB' },
  { name: 'Blue',       hex: '#4073FF' },
  { name: 'Grape',      hex: '#884DFF' },
  { name: 'Violet',     hex: '#AF38EB' },
  { name: 'Lavender',   hex: '#EB96EB' },
  { name: 'Magenta',    hex: '#E05194' },
  { name: 'Salmon',     hex: '#FF8D85' },
  { name: 'Charcoal',   hex: '#808080' },
  { name: 'Grey',       hex: '#B8B8B8' },
  { name: 'Taupe',      hex: '#CCAC93' },
]

export const PROJECT_COLORS = [
  'oklch(0.78 0.07 262)',  // azul sereno
  'oklch(0.84 0.07 70)',   // pêssego
  'oklch(0.79 0.09 20)',   // rosa
  'oklch(0.80 0.07 155)',  // sálvia
  'oklch(0.78 0.07 300)',  // lavanda
  'oklch(0.82 0.08 110)',  // lima suave
] as const
