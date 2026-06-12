import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useTaskStore } from '../../stores/useTaskStore'
import { LABEL_COLORS, type Label } from '../tasks/types'
import { cn } from '../../lib/cn'

interface LabelEditModalProps {
  open: boolean
  onClose: () => void
  /** Presente = edição; ausente = criação */
  label?: Label | null
}

export function LabelEditModal({ open, onClose, label }: LabelEditModalProps) {
  const addLabel = useTaskStore(s => s.addLabel)
  const updateLabel = useTaskStore(s => s.updateLabel)

  const [name, setName] = useState('')
  const [color, setColor] = useState(LABEL_COLORS[0].hex)

  useEffect(() => {
    if (open) {
      setName(label?.name ?? '')
      setColor(label?.color ?? LABEL_COLORS[0].hex)
    }
  }, [open, label])

  const save = () => {
    if (!name.trim()) return
    if (label) updateLabel(label.id, { name: name.trim(), color })
    else addLabel(name, color)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={label ? 'Editar etiqueta' : 'Nova etiqueta'}>
      <div className="space-y-4">
        <Input
          label="Nome"
          placeholder="Ex.: urgente, casa, leitura..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          autoFocus
        />

        <div>
          <p className="mb-2 text-[13px] font-medium">Cor</p>
          <div className="grid grid-cols-10 gap-1 max-[420px]:grid-cols-5">
            {LABEL_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                aria-label={`Cor ${c.name}`}
                title={c.name}
                className="flex size-11 cursor-pointer items-center justify-center md:size-9"
              >
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-white transition-transform hover:scale-110 md:size-6',
                  )}
                  style={{ background: c.hex }}
                >
                  {color === c.hex && <Check size={14} strokeWidth={3} />}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={!name.trim()}>
            {label ? 'Salvar' : 'Criar etiqueta'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
