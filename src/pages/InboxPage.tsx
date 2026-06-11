import { Inbox } from 'lucide-react'
import { useTaskStore } from '../stores/useTaskStore'
import { TaskList } from '../features/tasks/TaskList'
import { QuickAdd } from '../features/tasks/QuickAdd'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { useRegisterVisible } from '../lib/useRegisterVisible'
import { CompletedSection } from '../features/tasks/CompletedSection'

export function InboxPage() {
  const tasks = useTaskStore(s => s.tasks)
  const inbox = tasks
    .filter(t => !t.completed && !t.projectId)
    .sort((a, b) => a.order - b.order)
  const completed = tasks.filter(t => t.completed && !t.projectId)

  useRegisterVisible(inbox.map(t => t.id))

  return (
    <div className="page-wrap pt-8 md:pt-10">
      <PageHeader
        title="Caixa de entrada"
        subtitle={inbox.length > 0 ? `${inbox.length} ${inbox.length === 1 ? 'tarefa' : 'tarefas'}` : undefined}
      />
      <QuickAdd />
      {inbox.length > 0 ? (
        <TaskList tasks={inbox} />
      ) : (
        <EmptyState
          icon={Inbox}
          title="Tudo limpo por aqui"
          message="Aperte Q ou toque em adicionar para capturar o que vier à cabeça."
        />
      )}
      <CompletedSection tasks={completed} />
    </div>
  )
}
