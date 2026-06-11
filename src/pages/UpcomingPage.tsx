import { CalendarRange } from 'lucide-react'
import { startOfMonth } from 'date-fns'
import { useTaskStore } from '../stores/useTaskStore'
import { TaskList } from '../features/tasks/TaskList'
import { QuickAdd } from '../features/tasks/QuickAdd'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import {
  parseDue, isOverdue, isWithinNext7Days, upcomingGroupLabel, monthLabel,
} from '../lib/dates'
import type { Task } from '../features/tasks/types'
import { useRegisterVisible } from '../lib/useRegisterVisible'

interface Group {
  key: string
  label: string
  tasks: Task[]
}

export function UpcomingPage() {
  const tasks = useTaskStore(s => s.tasks)
  const upcoming = tasks
    .filter(t => !t.completed && t.dueDate && !isOverdue(t.dueDate))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))

  /* Próximos 7 dias: um grupo por dia. Depois: um grupo por mês. */
  const groups: Group[] = []
  for (const task of upcoming) {
    const d = parseDue(task.dueDate!)
    const key = isWithinNext7Days(d)
      ? task.dueDate!
      : `m-${startOfMonth(d).toISOString().slice(0, 7)}`
    const label = isWithinNext7Days(d) ? upcomingGroupLabel(d) : monthLabel(d)
    const existing = groups.find(g => g.key === key)
    if (existing) existing.tasks.push(task)
    else groups.push({ key, label, tasks: [task] })
  }

  useRegisterVisible(upcoming.map(t => t.id))

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <PageHeader
        title="Em breve"
        subtitle={upcoming.length > 0 ? `${upcoming.length} ${upcoming.length === 1 ? 'tarefa agendada' : 'tarefas agendadas'}` : undefined}
      />
      <QuickAdd />

      {groups.length > 0 ? (
        groups.map(g => (
          <section key={g.key} className="mb-6">
            <h2 className="mb-2 text-[13px] font-semibold text-ink-muted">
              {g.label}
            </h2>
            <TaskList tasks={g.tasks} reorderable={false} />
          </section>
        ))
      ) : (
        <EmptyState
          icon={CalendarRange}
          title="Horizonte limpo"
          message="Nenhuma tarefa agendada. Dê uma data às tarefas para vê-las aqui."
        />
      )}
    </div>
  )
}
