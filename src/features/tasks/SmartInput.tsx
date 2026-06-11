import { forwardRef, useMemo, type InputHTMLAttributes } from 'react'
import { Calendar, Clock, Flag, FolderOpen } from 'lucide-react'
import { parseTask, type ParseResult, type SegmentType } from '../../lib/nlparse'
import { useTaskStore } from '../../stores/useTaskStore'
import { dueLabel } from '../../lib/dates'
import { cn } from '../../lib/cn'

interface SmartInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  onParse?: (result: ParseResult) => void
}

const SEGMENT_STYLE: Record<SegmentType, string> = {
  date:     'bg-today-bg text-today rounded',
  time:     'bg-accent/25 text-accent-fg rounded',
  project:  'bg-primary-subtle text-primary-ink rounded',
  priority: 'bg-overdue-bg text-overdue rounded',
}

/* Tipografia idêntica entre input e overlay — qualquer divergência desalinha o destaque */
const TEXT_CLS = 'text-sm font-sans tracking-normal whitespace-pre'

export const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(
  ({ value, onChange, onParse, className, ...props }, ref) => {
    const projects = useTaskStore(s => s.projects)

    const parsed = useMemo(() => {
      const r = parseTask(value, projects)
      onParse?.(r)
      return r
    }, [value, projects]) // eslint-disable-line react-hooks/exhaustive-deps

    /* Fatias do texto com os destaques */
    const pieces = useMemo(() => {
      const out: Array<{ text: string; type: SegmentType | null }> = []
      let cursor = 0
      for (const seg of parsed.segments) {
        if (seg.start > cursor) out.push({ text: value.slice(cursor, seg.start), type: null })
        out.push({ text: value.slice(seg.start, seg.end), type: seg.type })
        cursor = seg.end
      }
      if (cursor < value.length) out.push({ text: value.slice(cursor), type: null })
      return out
    }, [value, parsed.segments])

    const project = projects.find(p => p.id === parsed.projectId)

    return (
      <div>
        <div className="relative">
          {/* Overlay com os destaques — alinhado 1:1 com o input */}
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center overflow-hidden px-4',
              TEXT_CLS,
            )}
          >
            {pieces.map((p, i) => (
              <span key={i} className={cn(p.type && SEGMENT_STYLE[p.type])}>
                {p.text}
              </span>
            ))}
          </div>

          <input
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={cn(
              'h-11 w-full rounded-xl border border-primary bg-surface-elevated px-4',
              TEXT_CLS,
              'text-transparent caret-ink placeholder:text-ink-faint',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'shadow-[var(--shadow-md)]',
              className,
            )}
            {...props}
          />
        </div>

        {/* Prévia da interpretação */}
        {(parsed.dueDate || parsed.priority < 4 || project) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 px-1 text-xs text-ink-muted">
            {parsed.dueDate && (
              <span className="flex items-center gap-1 text-today">
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
