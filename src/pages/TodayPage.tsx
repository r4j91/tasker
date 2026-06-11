import { CalendarDays, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTaskStore } from '../stores/useTaskStore'
import { TaskList } from '../features/tasks/TaskList'
import { QuickAdd } from '../features/tasks/QuickAdd'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { isDueToday, isOverdue, todayISO } from '../lib/dates'

export function TodayPage() {
  const tasks = useTaskStore(s => s.tasks)
  const active = tasks.filter(t => !t.completed && t.dueDate)
  const overdue = active.filter(t => isOverdue(t.dueDate!)).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  const today = active.filter(t => isDueToday(t.dueDate!)).sort((a, b) => a.order - b.order)

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <PageHeader
        title="Hoje"
        subtitle={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
      />
      <QuickAdd dueDate={todayISO()} />

      {overdue.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-overdue">
            <AlertCircle size={14} />
            Atrasadas
          </h2>
          <TaskList tasks={overdue} reorderable={false} />
        </section>
      )}

      {today.length > 0 ? (
        <section>
          {overdue.length > 0 && (
            <h2 className="mb-2 text-[13px] font-semibold text-ink-muted">Hoje</h2>
          )}
          <TaskList tasks={today} />
        </section>
      ) : overdue.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Dia livre"
          message="Nada vence hoje. Aproveite o espaço — ou adiante algo de Em breve."
        />
      ) : null}
    </div>
  )
}
