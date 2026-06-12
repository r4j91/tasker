import {
  format, parseISO, isToday, isTomorrow, isPast, startOfDay,
  addDays, isSameMonth, isThisYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

export const parseDue = (iso: string) => startOfDay(parseISO(iso))

export const isOverdue = (iso: string) =>
  isPast(parseDue(iso)) && !isToday(parseDue(iso))

export const isDueToday = (iso: string) => isToday(parseDue(iso))

/** Rótulo curto e humano para chips de data */
export function dueLabel(iso: string): string {
  const d = parseDue(iso)
  if (isToday(d)) return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  if (isThisYear(d)) return format(d, "d 'de' MMM", { locale: ptBR })
  return format(d, "d MMM yyyy", { locale: ptBR })
}

/** Cor semântica da data (tokens --date-*): hoje verde, atrasada
    vermelha, amanhã âmbar, futuro roxo. */
export function dueColorVar(iso: string): string {
  const d = parseDue(iso)
  if (isOverdue(iso)) return 'var(--date-overdue)'
  if (isToday(d)) return 'var(--date-today)'
  if (isTomorrow(d)) return 'var(--date-tomorrow)'
  return 'var(--date-future)'
}

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Cabeçalho de grupo na tela Em breve */
export function upcomingGroupLabel(d: Date): string {
  if (isToday(d)) return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  return capitalizeFirst(format(d, "EEEE, d 'de' MMMM", { locale: ptBR }))
}

export function monthLabel(d: Date): string {
  return capitalizeFirst(format(d, "MMMM 'de' yyyy", { locale: ptBR }))
}

/** Agrupa datas: próximos 7 dias individualmente, depois por mês */
export function isWithinNext7Days(d: Date): boolean {
  const limit = addDays(startOfDay(new Date()), 7)
  return d < limit
}

export { isSameMonth }
