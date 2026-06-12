import { forwardRef, useEffect, useMemo, useRef, useState, type InputHTMLAttributes } from 'react'
import { Calendar, Clock, Flag, FolderOpen, Tag, Plus } from 'lucide-react'
import { parseTask, type ParseResult, type SegmentType } from '../../lib/nlparse'
import { useTaskStore } from '../../stores/useTaskStore'
import { dueLabel, dueColorVar } from '../../lib/dates'
import { cn } from '../../lib/cn'

interface SmartInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  onParse?: (result: ParseResult) => void
  /** Sem borda/sombra, texto maior — para sheets estilo Todoist */
  bare?: boolean
}

const SEGMENT_STYLE: Record<Exclude<SegmentType, 'label'>, string> = {
  date:     'bg-today-bg text-today rounded',
  time:     'bg-accent/25 text-accent-fg rounded',
  project:  'bg-primary-subtle text-primary-ink rounded',
  priority: 'bg-overdue-bg text-overdue rounded',
}

/* Tipografia idêntica entre input e overlay — qualquer divergência desalinha o destaque */
const TEXT_CLS = 'text-base md:text-sm font-sans tracking-normal whitespace-pre'

export const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(
  ({ value, onChange, onParse, className, bare, ...props }, ref) => {
    const projects = useTaskStore(s => s.projects)
    const labels = useTaskStore(s => s.labels)
    const addLabel = useTaskStore(s => s.addLabel)

    /* bare: campo de título de sheet (Todoist) — sem caixa, texto maior.
       16px no mobile: a regra global anti-zoom força inputs a 16px e o
       overlay precisa do mesmo tamanho para alinhar. */
    const sizeCls = bare ? 'text-[16px] font-medium md:text-lg' : TEXT_CLS
    const padCls = bare ? 'px-0' : 'px-4'

    const parsed = useMemo(() => parseTask(value, projects, labels), [value, projects, labels])

    /* Notifica fora do render — permite que o pai guarde em estado */
    useEffect(() => {
      onParse?.(parsed)
    }, [parsed]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Autocomplete de @etiqueta (token no fim do texto) ── */
    const tokenMatch = value.match(/(?:^|\s)@([\wà-ú-]*)$/)
    const token = tokenMatch ? tokenMatch[1].toLowerCase() : null
    const [highlight, setHighlight] = useState(0)

    const suggestions = useMemo(() => {
      if (token === null) return []
      return labels
        .filter(l => l.name.toLowerCase().startsWith(token))
        .slice(0, 5)
    }, [token, labels])

    const exactExists = token !== null && labels.some(l => l.name.toLowerCase() === token)
    const canCreate = token !== null && token.length > 0 && !exactExists
    const optionCount = suggestions.length + (canCreate ? 1 : 0)
    const dropdownOpen = token !== null && optionCount > 0

    useEffect(() => setHighlight(0), [token])

    const innerRef = useRef<HTMLInputElement | null>(null)

    const applyLabel = (name: string) => {
      onChange(value.replace(/@([\wà-ú-]*)$/, `@${name} `))
      /* Escolha por clique tira o foco do campo — devolve para continuar digitando */
      requestAnimationFrame(() => innerRef.current?.focus())
    }

    const pick = (index: number) => {
      if (index < suggestions.length) {
        applyLabel(suggestions[index].name)
      } else if (canCreate && token) {
        const label = addLabel(token)
        applyLabel(label.name)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (dropdownOpen) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, optionCount - 1)); return }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); return }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); pick(highlight); return }
        if (e.key === 'Escape') { e.stopPropagation(); onChange(value); return }
      }
      props.onKeyDown?.(e)
    }

    /* Fatias do texto com os destaques */
    const pieces = useMemo(() => {
      const out: Array<{ text: string; type: SegmentType | null; color?: string }> = []
      let cursor = 0
      for (const seg of parsed.segments) {
        if (seg.start > cursor) out.push({ text: value.slice(cursor, seg.start), type: null })
        out.push({ text: value.slice(seg.start, seg.end), type: seg.type, color: seg.color })
        cursor = seg.end
      }
      if (cursor < value.length) out.push({ text: value.slice(cursor), type: null })
      return out
    }, [value, parsed.segments])

    const project = projects.find(p => p.id === parsed.projectId)
    const parsedLabels = parsed.labelIds
      .map(id => labels.find(l => l.id === id))
      .filter((l): l is NonNullable<typeof l> => !!l)

    return (
      <div className="relative">
        <div className="relative">
          {/* Overlay com os destaques — alinhado 1:1 com o input */}
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center overflow-hidden',
              padCls,
              bare ? 'font-sans tracking-normal whitespace-pre' : '',
              sizeCls,
            )}
          >
            {pieces.map((p, i) => (
              <span
                key={i}
                className={cn(p.type && p.type !== 'label' && SEGMENT_STYLE[p.type], p.type === 'label' && 'rounded text-ink')}
                style={p.type === 'label' && p.color ? { backgroundColor: `${p.color}33` } : undefined}
              >
                {p.text}
              </span>
            ))}
          </div>

          <input
            ref={el => {
              innerRef.current = el
              if (typeof ref === 'function') ref(el)
              else if (ref) ref.current = el
            }}
            value={value}
            onChange={e => onChange(e.target.value)}
            {...props}
            onKeyDown={handleKeyDown}
            className={cn(
              'h-11 w-full',
              bare
                ? 'border-0 bg-transparent shadow-none focus:outline-none focus-visible:outline-none'
                : 'rounded-xl border border-primary bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-[var(--shadow-md)]',
              padCls,
              bare ? 'font-sans tracking-normal whitespace-pre' : '',
              sizeCls,
              'text-transparent caret-ink placeholder:text-ink-faint',
              className,
            )}
          />
        </div>

        {/* Autocomplete de etiquetas */}
        {dropdownOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-line bg-surface-elevated py-1 shadow-[var(--shadow-lg)]">
            {suggestions.map((l, i) => (
              <button
                key={l.id}
                onClick={() => pick(i)}
                onMouseMove={() => setHighlight(i)}
                className={cn(
                  'flex min-h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm',
                  highlight === i && 'bg-surface',
                )}
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
                {l.name}
              </button>
            ))}
            {canCreate && (
              <button
                onClick={() => pick(suggestions.length)}
                onMouseMove={() => setHighlight(suggestions.length)}
                className={cn(
                  'flex min-h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm text-primary-ink',
                  highlight === suggestions.length && 'bg-surface',
                )}
              >
                <Plus size={14} />
                Criar etiqueta “{token}”
              </button>
            )}
          </div>
        )}

        {/* Prévia da interpretação */}
        {(parsed.dueDate || parsed.priority < 4 || project || parsedLabels.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 px-1 text-xs text-ink-muted">
            {parsed.dueDate && (
              <span className="flex items-center gap-1" style={{ color: dueColorVar(parsed.dueDate) }}>
                <Calendar size={12} /> {dueLabel(parsed.dueDate)}
              </span>
            )}
            {parsed.dueTime && (
              <span className="flex items-center gap-1 text-accent-fg">
                <Clock size={12} /> {parsed.dueTime}
              </span>
            )}
            {project && (
              <span className="flex items-center gap-1 text-primary-ink">
                <FolderOpen size={12} /> {project.name}
              </span>
            )}
            {parsedLabels.map(l => (
              <span key={l.id} className="flex items-center gap-1">
                <Tag size={12} style={{ color: l.color }} />
                {l.name}
              </span>
            ))}
            {parsed.priority < 4 && (
              <span
                className="flex items-center gap-1"
                style={{ color: `var(--priority-${parsed.priority})` }}
              >
                <Flag size={12} fill="currentColor" /> P{parsed.priority}
              </span>
            )}
          </div>
        )}
      </div>
    )
  },
)

SmartInput.displayName = 'SmartInput'
