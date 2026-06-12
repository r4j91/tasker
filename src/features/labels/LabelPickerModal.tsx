import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { useTaskStore } from '../../stores/useTaskStore'
import { cn } from '../../lib/cn'

interface LabelPickerModalProps {
  open: boolean
  onClose: () => void
  taskId: string
}

/** Seleção múltipla de etiquetas para uma tarefa, com busca e criação. */
export function LabelPickerModal({ open, onClose, taskId }: LabelPickerModalProps) {
  const labels = useTaskStore(s => s.labels)
  const task = useTaskStore(s => s.tasks.find(t => t.id === taskId))
  const updateTask = useTaskStore(s => s.updateTask)
  const addLabel = useTaskStore(s => s.addLabel)

  const [query, setQuery] = useState('')

  if (!task) return null

  const q = query.trim().toLowerCase()
  const filtered = labels
    .filter(l => !q || l.name.toLowerCase().includes(q))
    .sort((a, b) => a.order - b.order)
  const exactExists = labels.some(l => l.name.toLowerCase() === q)

  const toggle = (id: string) => {
    const next = task.labels.includes(id)
      ? task.labels.filter(x => x !== id)
      : [...task.labels, id]
    updateTask(task.id, { labels: next })
  }

  const create = () => {
    if (!q || exactExists) return
    const label = addLabel(query.trim())
    updateTask(task.id, { labels: [...task.labels, label.id] })
    setQuery('')
  }

  return (
    <Modal open={open} onClose={() => { setQuery(''); onClose() }} title="Etiquetas">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !exactExists && q) create() }}
        placeholder="Buscar ou criar etiqueta..."
        autoFocus
        className="mb-2 h-11 w-full rounded-lg border border-line bg-canvas px-3 text-base placeholder:text-ink-faint focus:border-primary focus:outline-none md:h-10 md:text-sm"
      />

      <div className="max-h-64 overflow-y-auto">
        {filtered.map(l => {
          const checked = task.labels.includes(l.id)
          return (
            <button
              key={l.id}
              onClick={() => toggle(l.id)}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-2 text-left text-sm transition-colors hover:bg-surface"
            >
              <span className="size-3 shrink-0 rounded-full" style={{ background: l.color }} />
              <span className="flex-1 truncate">{l.name}</span>
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded border-2 transition-colors',
                  checked ? 'border-primary bg-primary text-primary-fg' : 'border-line-strong',
                )}
              >
                {checked && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          )
        })}

        {filtered.length === 0 && !q && (
          <p className="px-2 py-4 text-sm text-ink-faint">
            Nenhuma etiqueta ainda — digite um nome para criar.
          </p>
        )}

        {q && !exactExists && (
          <button
            onClick={create}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-sm text-primary-ink transition-colors hover:bg-surface"
          >
            <Plus size={15} />
            Criar etiqueta “{query.trim()}”
          </button>
        )}
      </div>
    </Modal>
  )
}
