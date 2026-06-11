import { useState, type ReactNode } from 'react'
import { Sun, Moon, Search, Mail } from 'lucide-react'
import { Button, Input, Checkbox, Modal, Tooltip, Tag } from '../components/ui'

import { useUiStore } from '../stores/useUiStore'

export function DesignSystem() {
  const dark = useUiStore(s => s.dark)
  const onToggle = useUiStore(s => s.toggleDark)
  const [checks, setChecks] = useState({ a: false, b: true, c: false })
  const [modalOpen, setModalOpen] = useState(false)

  const toggle = (k: 'a' | 'b' | 'c') => setChecks(s => ({ ...s, [k]: !s[k] }))

  return (
    <div className="min-h-screen bg-canvas text-ink">

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="page-wrap flex h-14 items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">
            TASKER <span className="font-normal text-ink-faint">· design system</span>
          </span>
          <Tooltip content={dark ? 'Tema claro' : 'Tema escuro'} side="left">
            <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Alternar tema">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </Button>
          </Tooltip>
        </div>
      </header>

      <main className="page-wrap pt-10 pb-16">

        <Section title="Cores">
          <div className="grid grid-cols-4 gap-x-3 gap-y-4 max-[480px]:grid-cols-2">
            {[
              { name: 'Primary',   bg: 'var(--primary)' },
              { name: 'Accent',    bg: 'var(--accent)' },
              { name: 'Hoje',      bg: 'var(--today)' },
              { name: 'Atrasado',  bg: 'var(--overdue)' },
              { name: 'Concluído', bg: 'var(--done)' },
              { name: 'Canvas',    bg: 'var(--canvas)',  border: true },
              { name: 'Surface',   bg: 'var(--surface)', border: true },
              { name: 'Ink',       bg: 'var(--ink)' },
            ].map(s => (
              <div key={s.name}>
                <div
                  className="h-12 rounded-lg"
                  style={{
                    background: s.bg,
                    border: s.border ? '1px solid var(--line)' : undefined,
                  }}
                />
                <p className="mt-1.5 text-xs text-ink-muted">{s.name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tipografia">
          <div className="space-y-3.5">
            {([
              ['Display', 'text-3xl font-bold tracking-[-0.025em]',     'Organização com calma.'],
              ['H1',      'text-2xl font-bold tracking-[-0.02em]',      'Tarefas de hoje'],
              ['H2',      'text-xl font-semibold tracking-[-0.015em]',  'Em breve'],
              ['H3',      'text-base font-semibold',                    'Projeto pessoal'],
              ['Body',    'text-[15px]',                                'Nada escapa. Cada tarefa tem seu lugar.'],
              ['Small',   'text-sm text-ink-muted',                     'Atualizado agora há pouco'],
              ['Caption', 'text-xs text-ink-faint',                     'seg, 9 de jun · 14:30'],
            ] as const).map(([lbl, cls, txt]) => (
              <div key={lbl} className="flex items-baseline gap-4">
                <span className="w-14 shrink-0 text-[11px] uppercase tracking-wide text-ink-faint">{lbl}</span>
                <span className={cls}>{txt}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Botões">
          <div className="space-y-3">
            <Row label="Variantes">
              <Button>Adicionar tarefa</Button>
              <Button variant="secondary">Cancelar</Button>
              <Button variant="ghost">Ignorar</Button>
              <Button variant="destructive">Excluir</Button>
            </Row>
            <Row label="Tamanhos">
              <Button size="sm">Salvar</Button>
              <Button size="md">Salvar alterações</Button>
              <Button size="lg">Criar projeto</Button>
            </Row>
            <Row label="Estados">
              <Button loading>Salvando</Button>
              <Button variant="secondary" disabled>Desativado</Button>
            </Row>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="max-w-sm space-y-4">
            <Input label="Nome da tarefa" placeholder="Ex.: revisar proposta" />
            <Input label="Buscar" placeholder="Buscar tarefas..." icon={<Search size={14} />} />
            <Input label="E-mail" placeholder="nome@email.com" icon={<Mail size={14} />} hint="Usado para login" />
            <Input label="Data" placeholder="amanhã" error="Data inválida" />
          </div>
        </Section>

        <Section title="Checkbox" subtitle="A alma do app — clique para ver a animação.">
          <div className="max-w-sm">
            <Checkbox checked={checks.a} onChange={() => toggle('a')} label="Revisar mockups do onboarding" />
            <Checkbox checked={checks.b} onChange={() => toggle('b')} label="Responder e-mail do cliente" />
            <Checkbox checked={checks.c} onChange={() => toggle('c')} label="Fazer backup do projeto" />
            <Checkbox checked={false} onChange={() => {}} label="Tarefa desativada" disabled />
          </div>
        </Section>

        <Section title="Tags">
          <div className="flex flex-wrap gap-2">
            <Tag>Padrão</Tag>
            <Tag variant="primary">Principal</Tag>
            <Tag variant="today" dot>Hoje</Tag>
            <Tag variant="overdue" dot>Atrasado</Tag>
            <Tag variant="done" dot>Concluído</Tag>
            <Tag variant="accent">Acento</Tag>
          </div>
        </Section>

        <Section title="Tooltip">
          <div className="flex flex-wrap gap-3">
            <Tooltip content="Cima"><Button variant="secondary" size="sm">Cima</Button></Tooltip>
            <Tooltip content="Baixo" side="bottom"><Button variant="secondary" size="sm">Baixo</Button></Tooltip>
            <Tooltip content="Esquerda" side="left"><Button variant="secondary" size="sm">Esquerda</Button></Tooltip>
            <Tooltip content="Direita" side="right"><Button variant="secondary" size="sm">Direita</Button></Tooltip>
          </div>
        </Section>

        <Section title="Modal">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Abrir modal</Button>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova tarefa">
            <div className="space-y-4">
              <Input label="Título" placeholder="O que precisa ser feito?" />
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => setModalOpen(false)}>Adicionar</Button>
              </div>
            </div>
          </Modal>
        </Section>

        <Section title="Sombras">
          <div className="flex flex-wrap gap-5">
            {(['sm', 'md', 'lg'] as const).map(s => (
              <div
                key={s}
                className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface-elevated text-sm text-ink-muted"
                style={{ boxShadow: `var(--shadow-${s})` }}
              >
                {s}
              </div>
            ))}
          </div>
        </Section>

      </main>

      <footer className="border-t border-line">
        <div className="page-wrap py-6">
          <p className="text-center text-xs text-ink-faint">TASKER · Design System · Fase 1</p>
        </div>
      </footer>

    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        {title}
      </h2>
      {subtitle && <p className="mb-4 text-sm text-ink-muted">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-ink-faint">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
