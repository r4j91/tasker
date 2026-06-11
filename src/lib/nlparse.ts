import { addDays, format, setDate, addMonths, startOfDay } from 'date-fns'
import type { Priority, Project } from '../features/tasks/types'

export type SegmentType = 'date' | 'time' | 'project' | 'priority'

export interface Segment {
  start: number
  end: number
  type: SegmentType
}

export interface ParseResult {
  /** Título limpo, sem os trechos reconhecidos */
  title: string
  dueDate: string | null
  dueTime: string | null
  priority: Priority
  /** Projeto resolvido por #nome (se existir) */
  projectId: string | null
  /** Trechos reconhecidos no texto original, para destacar */
  segments: Segment[]
}

const WEEKDAYS: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, 'terça': 2, quarta: 3,
  quinta: 4, sexta: 5, sabado: 6, 'sábado': 6,
}

function nextWeekday(target: number, forceNext: boolean): Date {
  const today = startOfDay(new Date())
  let diff = (target - today.getDay() + 7) % 7
  if (diff === 0) diff = 7
  if (forceNext && diff < 7) diff += 0 // "próxima segunda" = próxima ocorrência
  return addDays(today, diff)
}

/**
 * Interpreta linguagem natural pt-BR num título de tarefa.
 * Ex.: "reunião segunda 14h #trabalho p1"
 */
export function parseTask(input: string, projects: Project[]): ParseResult {
  const segments: Segment[] = []
  let dueDate: string | null = null
  let dueTime: string | null = null
  let priority: Priority = 4
  let projectId: string | null = null

  const lower = input.toLowerCase()
  const taken: Array<[number, number]> = []
  const overlaps = (s: number, e: number) => taken.some(([ts, te]) => s < te && e > ts)
  const claim = (s: number, e: number, type: SegmentType) => {
    taken.push([s, e])
    segments.push({ start: s, end: e, type })
  }

  /* ── Prioridade: p1–p4 ── */
  for (const m of lower.matchAll(/(?<=^|\s)p([1-4])(?=\s|$)/g)) {
    const s = m.index!, e = s + m[0].length
    if (overlaps(s, e)) continue
    priority = Number(m[1]) as Priority
    claim(s, e, 'priority')
    break
  }

  /* ── Projeto: #nome ── */
  for (const m of lower.matchAll(/(?<=^|\s)#([\wà-ú-]+)/g)) {
    const s = m.index!, e = s + m[0].length
    if (overlaps(s, e)) continue
    const name = m[1]
    const match = projects.find(p =>
      p.name.toLowerCase() === name || p.name.toLowerCase().startsWith(name),
    )
    if (match) projectId = match.id
    claim(s, e, 'project')
    break
  }

  /* ── Datas relativas ── */
  const datePatterns: Array<[RegExp, (m: RegExpMatchArray) => Date | null]> = [
    [/(?<=^|\s)depois de amanh[ãa](?=\s|$)/g, () => addDays(startOfDay(new Date()), 2)],
    [/(?<=^|\s)amanh[ãa](?=\s|$)/g, () => addDays(startOfDay(new Date()), 1)],
    [/(?<=^|\s)hoje(?=\s|$)/g, () => startOfDay(new Date())],
    [
      /(?<=^|\s)(pr[óo]xima\s+)?(segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)(-feira)?(?=\s|$)/g,
      m => nextWeekday(WEEKDAYS[m[2].normalize('NFC')] ?? WEEKDAYS[m[2]], !!m[1]),
    ],
    [
      /(?<=^|\s)([0-3]?\d)\/([01]?\d)(?:\/(\d{4}))?(?=\s|$)/g,
      m => {
        const day = Number(m[1]), month = Number(m[2]) - 1
        const year = m[3] ? Number(m[3]) : new Date().getFullYear()
        const d = new Date(year, month, day)
        if (d.getDate() !== day || d.getMonth() !== month) return null
        /* Sem ano e já passou → ano que vem */
        if (!m[3] && d < startOfDay(new Date())) d.setFullYear(year + 1)
        return d
      },
    ],
    [
      /(?<=^|\s)dia ([0-3]?\d)(?=\s|$)/g,
      m => {
        const day = Number(m[1])
        if (day < 1 || day > 31) return null
        const today = startOfDay(new Date())
        let d = setDate(today, day)
        if (d <= today) d = setDate(addMonths(today, 1), day)
        return d
      },
    ],
  ]

  for (const [re, resolve] of datePatterns) {
    if (dueDate) break
    for (const m of lower.matchAll(re)) {
      const s = m.index!, e = s + m[0].length
      if (overlaps(s, e)) continue
      const d = resolve(m)
      if (!d) continue
      dueDate = format(d, 'yyyy-MM-dd')
      claim(s, e, 'date')
      break
    }
  }

  /* ── Hora: 14h, 14h30, 9:30, às 9h ── */
  for (const m of lower.matchAll(/(?<=^|\s)([àa]s\s+)?([01]?\d|2[0-3])(?:h([0-5]\d)?|:([0-5]\d))(?=\s|$)/g)) {
    const s = m.index!, e = s + m[0].length
    if (overlaps(s, e)) continue
    const hour = Number(m[2])
    const minute = Number(m[3] ?? m[4] ?? 0)
    dueTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    /* Hora sem data implica hoje */
    if (!dueDate) dueDate = format(new Date(), 'yyyy-MM-dd')
    claim(s, e, 'time')
    break
  }

  /* ── Título: remove os trechos reconhecidos ── */
  const sorted = [...taken].sort((a, b) => a[0] - b[0])
  let title = ''
  let cursor = 0
  for (const [s, e] of sorted) {
    title += input.slice(cursor, s)
    cursor = e
  }
  title += input.slice(cursor)
  title = title.replace(/\s{2,}/g, ' ').trim()

  segments.sort((a, b) => a.start - b.start)
  return { title, dueDate, dueTime, priority, projectId, segments }
}
