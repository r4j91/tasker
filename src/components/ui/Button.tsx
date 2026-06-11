import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap ' +
  'rounded-lg select-none cursor-pointer transition-colors duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ' +
  'disabled:opacity-45 disabled:pointer-events-none ' +
  /* Toque mínimo de 44px no mobile, independente do tamanho visual */
  'max-md:min-h-11'

const variants: Record<Variant, string> = {
  primary:     'bg-primary text-primary-fg hover:bg-primary-hover',
  secondary:   'bg-canvas text-ink border border-line hover:bg-surface hover:border-line-strong',
  ghost:       'text-ink-muted hover:text-ink hover:bg-surface',
  destructive: 'bg-overdue text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-4 text-[15px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
