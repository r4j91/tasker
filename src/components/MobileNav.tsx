import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useUiStore } from '../stores/useUiStore'
import { cn } from '../lib/cn'

/* ── Ícones preenchidos, estilo Todoist iOS ─────────────────────────── */
/* O recorte interno usa a cor do fundo da pílula (surface-elevated)    */

const DETAIL = 'var(--surface-elevated)'

function NavegarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5.5" fill="currentColor" />
      <rect x="7" y="8"    width="10" height="1.9" rx="0.95" fill={DETAIL} />
      <rect x="7" y="11.1" width="10" height="1.9" rx="0.95" fill={DETAIL} />
      <rect x="7" y="14.2" width="10" height="1.9" rx="0.95" fill={DETAIL} />
    </svg>
  )
}

function EmBreveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3.5" width="18" height="17.5" rx="5.5" fill="currentColor" />
      <rect x="6.5" y="8" width="11" height="1.6" rx="0.8" fill={DETAIL} />
      {[8.6, 12, 15.4].map(x => (
        <circle key={`a${x}`} cx={x} cy="13.2" r="1.25" fill={DETAIL} />
      ))}
      {[8.6, 12].map(x => (
        <circle key={`b${x}`} cx={x} cy="16.6" r="1.25" fill={DETAIL} />
      ))}
    </svg>
  )
}

function HojeIcon({ day }: { day: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3.5" width="18" height="17.5" rx="5.5" fill="currentColor" />
      <rect x="6.5" y="7.5" width="11" height="1.6" rx="0.8" fill={DETAIL} />
      <text
        x="12" y="17.6"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="'Inter Variable', system-ui, sans-serif"
        fill={DETAIL}
      >
        {day}
      </text>
    </svg>
  )
}

function FiltrosIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <rect x="3.5"  y="3.5"  width="8" height="8" rx="2.5" fill="currentColor" />
      <rect x="12.5" y="3.5"  width="8" height="8" rx="2.5" fill="currentColor" />
      <rect x="3.5"  y="12.5" width="8" height="8" rx="2.5" fill="currentColor" />
      <rect x="12.5" y="12.5" width="8" height="8" rx="2.5" fill="currentColor" />
    </svg>
  )
}

/* ── Barra ──────────────────────────────────────────────────────────── */

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  to: string
  /** Rotas que mantêm este item ativo */
  match: (path: string) => boolean
}

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const setQuickAddOpen = useUiStore(s => s.setQuickAddOpen)
  const day = new Date().getDate()

  const items: NavItem[] = [
    {
      key: 'navegar', label: 'Navegar', icon: <NavegarIcon />, to: '/navegar',
      match: p => p === '/' || p.startsWith('/navegar') || p.startsWith('/projeto'),
    },
    {
      key: 'embreve', label: 'Em breve', icon: <EmBreveIcon />, to: '/em-breve',
      match: p => p.startsWith('/em-breve'),
    },
    {
      key: 'hoje', label: 'Hoje', icon: <HojeIcon day={day} />, to: '/hoje',
      match: p => p.startsWith('/hoje'),
    },
    {
      key: 'filtros', label: 'Filtros', icon: <FiltrosIcon />, to: '/filtros',
      match: p => p.startsWith('/filtros'),
    },
  ]

  return (
    <div
      className="fixed inset-x-3 z-40 md:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      {/* FAB — sobreposto acima da pílula, à direita */}
      <motion.button
        onClick={() => setQuickAddOpen(true)}
        aria-label="Adicionar tarefa"
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className={cn(
          'absolute -top-[60px] right-0 z-10 flex size-14 items-center justify-center rounded-full',
          'bg-accent-strong text-white dark:bg-accent dark:text-accent-fg',
          'shadow-[0_8px_24px_oklch(0.25_0.05_50/0.35),0_2px_8px_oklch(0.25_0.05_50/0.25)]',
        )}
      >
        <Plus size={28} strokeWidth={2.75} />
      </motion.button>

      {/* Pílula */}
      <nav
        className={cn(
          'grid grid-cols-4 items-stretch rounded-full px-1.5 py-1.5',
          'border border-line/50 bg-surface-elevated/70 backdrop-blur-[20px] backdrop-saturate-[1.8] dark:bg-surface-elevated/60',
          'shadow-[inset_0_1px_0_oklch(1_0_0/0.45),0_10px_32px_oklch(0.2_0.03_262/0.16),0_2px_10px_oklch(0.2_0.03_262/0.10)]',
          'dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.08),0_10px_32px_oklch(0_0_0/0.30),0_2px_10px_oklch(0_0_0/0.20)]',
        )}
      >
        {items.map(item => {
          const active = item.match(location.pathname)
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className={cn(
                'relative flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-colors',
                active ? 'text-primary-ink' : 'text-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-full bg-surface"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{item.icon}</span>
              <span className="relative z-10 max-w-full truncate px-1 text-xs font-medium leading-tight">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
