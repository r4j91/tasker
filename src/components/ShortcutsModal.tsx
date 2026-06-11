import { Modal } from './ui/Modal'
import { useUiStore } from '../stores/useUiStore'

const SHORTCUTS: Array<[string, string]> = [
  ['Q', 'Nova tarefa'],
  ['⌘/Ctrl + K', 'Busca global'],
  ['↑ ↓', 'Navegar na lista'],
  ['Enter', 'Editar tarefa selecionada'],
  ['E', 'Concluir tarefa selecionada'],
  ['1 – 4', 'Prioridade da selecionada'],
  ['T', 'Ir para Hoje'],
  ['?', 'Esta lista de atalhos'],
]

export function ShortcutsModal() {
  const open = useUiStore(s => s.shortcutsOpen)
  const setOpen = useUiStore(s => s.setShortcutsOpen)

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Atalhos de teclado">
      <div className="flex flex-col gap-1">
        {SHORTCUTS.map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between rounded-lg px-2 py-1.5">
            <span className="text-sm text-ink-muted">{desc}</span>
            <kbd className="rounded border border-line bg-surface px-2 py-0.5 text-xs font-medium">
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  )
}
