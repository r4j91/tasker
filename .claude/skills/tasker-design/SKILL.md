---
name: tasker-design
description: Padrões de design e implementação obrigatórios do app TASKER.
  Usar SEMPRE que criar, modificar ou revisar qualquer interface, componente,
  estilo, animação ou interação do projeto TASKER — antes de escrever
  qualquer código de UI, ler esta skill por completo.
---

# Design System e Padrões do TASKER

## Identidade

O TASKER combina a velocidade do Todoist com a calma do Things 3:
entrada rápida, organização clara, tipografia impecável, espaçamento
generoso, animações suaves. Premium significa: tudo responde em menos
de 100ms, microinterações satisfatórias, estados vazios com
personalidade, modo escuro de primeira classe.

Nunca introduzir estilos, cores ou padrões fora dos definidos aqui.
Se uma decisão nova for tomada, atualizar esta skill no mesmo commit.

## Tokens do design system

Fonte da verdade: `src/index.css` (`:root` = claro, `.dark` = escuro).
Todos em OKLCH. Tema escuro é cinza médio, nunca preto. Os tokens são
expostos ao Tailwind via `@theme inline` (`bg-canvas`, `text-ink-muted`,
`border-line` etc.); nunca usar hex cru em componentes.

### Neutros — superfícies

| Token | Claro | Escuro |
|---|---|---|
| `--canvas` (fundo da página) | `oklch(0.988 0.004 250)` | `oklch(0.285 0.008 262)` |
| `--surface` (blocos, hover) | `oklch(0.962 0.006 250)` | `oklch(0.325 0.009 262)` |
| `--surface-elevated` (modais, sheets, popovers) | `oklch(1 0 0)` | `oklch(0.365 0.010 262)` |

### Neutros — texto e linhas

| Token | Claro | Escuro |
|---|---|---|
| `--ink` (texto principal) | `oklch(0.270 0.020 262)` | `oklch(0.950 0.004 262)` |
| `--ink-muted` (secundário) | `oklch(0.490 0.018 262)` | `oklch(0.750 0.008 262)` |
| `--ink-faint` (terciário, placeholders) | `oklch(0.630 0.014 262)` | `oklch(0.590 0.008 262)` |
| `--line` (separadores) | `oklch(0.910 0.008 255)` | `oklch(0.385 0.009 262)` |
| `--line-strong` (bordas de controles) | `oklch(0.840 0.012 255)` | `oklch(0.465 0.011 262)` |

### Marca (azul sereno pastel) e acento (pêssego)

| Token | Claro | Escuro |
|---|---|---|
| `--primary` | `oklch(0.780 0.072 262)` | `oklch(0.780 0.068 262)` |
| `--primary-hover` | `oklch(0.730 0.080 262)` | `oklch(0.825 0.062 262)` |
| `--primary-subtle` (fundos de item ativo) | `oklch(0.945 0.022 262)` | `oklch(0.360 0.030 262)` |
| `--primary-fg` (texto sobre primary) | `oklch(0.270 0.070 262)` | `oklch(0.250 0.060 262)` |
| `--primary-ink` (texto/ícone da marca sobre canvas) | `oklch(0.400 0.085 262)` | `oklch(0.835 0.060 262)` |
| `--accent` | `oklch(0.860 0.065 60)` | `oklch(0.840 0.065 70)` |
| `--accent-fg` | `oklch(0.380 0.075 50)` | `oklch(0.300 0.060 60)` |

### Estado suave (chips, fundos de swipe, ações em massa)

| Token | Claro | Escuro |
|---|---|---|
| `--overdue` / `--overdue-bg` | `oklch(0.545 0.120 20)` / `oklch(0.935 0.032 20)` | `oklch(0.790 0.085 20)` / `oklch(0.350 0.028 20)` |
| `--today` / `--today-bg` | `oklch(0.650 0.120 35)` / `oklch(0.945 0.035 50)` | `oklch(0.825 0.075 70)` / `oklch(0.350 0.026 70)` |
| `--done` / `--done-bg` | `oklch(0.530 0.085 155)` / `oklch(0.935 0.032 152)` | `oklch(0.800 0.065 155)` / `oklch(0.340 0.024 152)` |

Atenção: `--today` é um tom quente legado usado em fundos (swipe de
agendar). A COR DE DATA "hoje" é sempre `--date-today` (verde), abaixo.

### Datas (texto pequeno, ≥4.5:1 sobre canvas)

| Token | Claro | Escuro |
|---|---|---|
| `--date-today` (verde) | `oklch(0.520 0.130 150)` | `oklch(0.780 0.130 152)` |
| `--date-tomorrow` (âmbar) | `oklch(0.550 0.120 70)` | `oklch(0.800 0.120 75)` |
| `--date-future` (roxo) | `oklch(0.520 0.120 295)` | `oklch(0.780 0.100 295)` |
| `--date-overdue` (vermelho) | `oklch(0.540 0.180 27)` | `oklch(0.720 0.170 25)` |

Usar via `dueColorVar()` em `src/lib/dates.ts`, nunca escolher a cor
manualmente.

### Prioridades (vivas = gráficos; `-text` = texto pequeno)

| Token | Claro | Escuro |
|---|---|---|
| `--priority-1` | `oklch(0.600 0.190 28)` | `oklch(0.660 0.195 28)` |
| `--priority-2` | `oklch(0.700 0.165 55)` | `oklch(0.750 0.160 58)` |
| `--priority-3` | `oklch(0.540 0.170 262)` | `oklch(0.640 0.155 262)` |
| `--priority-1-text` | `oklch(0.540 0.190 28)` | `oklch(0.720 0.190 28)` |
| `--priority-2-text` | `oklch(0.550 0.150 55)` | `oklch(0.800 0.150 60)` |
| `--priority-3-text` | `oklch(0.500 0.170 262)` | `oklch(0.700 0.150 262)` |

P4 não tem token próprio: usa os neutros (checkbox com borda
`--line-strong`, preenchimento transparente).

### Tipografia

- Família única: `'Inter Variable', system-ui, sans-serif`
  (token `--font-sans`); corpo com `line-height: 1.5` e
  `-webkit-font-smoothing: antialiased`.
- Escala em uso: 12px (`text-xs`, mínimo absoluto), 13px (metadados
  desktop), 14px (`text-sm`, padrão de UI), 15px, 16px (`text-base`,
  corpo no mobile), 18px (`text-lg`), 24px (`text-2xl`, títulos de
  página desktop), 28px (títulos de página mobile).
- Inputs no mobile: mínimo 16px (regra global em `index.css`, evita o
  zoom automático do iOS — não rebaixar com utilities).
- Números dinâmicos (contadores, "1/4"): `tabular-nums`.
- Pesos: 400 corpo, 500 rótulos/medium, 600-700 títulos.

### Espaçamento e layout

- Escala Tailwind de 4 em 4px; valores recorrentes: 2, 4, 6, 8, 12,
  16, 24px. Nenhum espaçamento arbitrário fora da escala.
- Container central: `.page-wrap` — `max-width: 640px`,
  `padding-inline: 24px`, centrado.
- Sidebar desktop: 240px (`w-60`); breakpoint desktop: `md` (768px).
- Alturas de linha: tarefas com `min-h-11` (44px) no mobile;
  sub-tarefas compactas `min-h-9` (36px).

### Raios de borda

- `rounded-full` — pílula da tab bar, FAB, checkboxes, chips, avatares.
- `rounded-lg` (8px) — botões, itens de navegação, inputs.
- `rounded-md` (6px) — controles pequenos/internos.
- `rounded-xl` (12px) — popovers, toasts, cartões.
- `rounded-t-2xl` (16px no topo) — bottom sheets.

### Sombras

| Token | Claro | Escuro |
|---|---|---|
| `--shadow-sm` | `0 1px 2px oklch(0.2 0.02 262 / 0.06)` | `0 1px 2px oklch(0 0 0 / 0.20)` |
| `--shadow-md` | `0 2px 8px oklch(0.2 0.02 262 / 0.08), 0 1px 2px oklch(0.2 0.02 262 / 0.05)` | `0 2px 8px oklch(0 0 0 / 0.25), 0 1px 2px oklch(0 0 0 / 0.18)` |
| `--shadow-lg` (modais, sheets, popovers) | `0 8px 28px oklch(0.2 0.02 262 / 0.12), 0 2px 8px oklch(0.2 0.02 262 / 0.06)` | `0 8px 28px oklch(0 0 0 / 0.32), 0 2px 8px oklch(0 0 0 / 0.22)` |

## Cores semânticas (obrigatórias e idênticas em todas as telas)

### Prioridades — VIVAS, nunca pastéis
- P1: vermelho vivo (~#DC4C3E)
- P2: laranja vivo (~#EB8909)
- P3: azul vivo (~#246FE0)
- P4: cinza neutro

Regra de contraste: elementos GRÁFICOS (bandeiras, ícones,
preenchimentos, contorno do checkbox) usam a versão viva/saturada.
TEXTO pequeno colorido (rótulos P1/P2, datas em 12-16px) usa uma
variante mais escura do mesmo matiz com contraste ≥4.5:1 sobre o
fundo. Nunca "resolver" contraste apagando as cores gráficas.

O checkbox circular da tarefa ganha a cor da prioridade (P1 contorno
vermelho com leve preenchimento translúcido, P2 laranja, P3 azul,
P4 cinza), como no Todoist.

### Datas
- Hoje: verde (nunca laranja)
- Atrasada: vermelho
- Amanhã/próximos dias: tom âmbar ou roxo discreto

### Paleta de etiquetas (a mesma do Todoist)
Berry Red #B8256F, Red #DB4035, Orange #FF9933, Yellow #FAD000,
Olive #AFB83B, Lime #7ECC49, Green #299438, Mint #6ACCBC,
Teal #158FAD, Sky Blue #14AAF5, Light Blue #96C3EB, Blue #4073FF,
Grape #884DFF, Violet #AF38EB, Lavender #EB96EB, Magenta #E05194,
Salmon #FF8D85, Charcoal #808080, Grey #B8B8B8, Taupe #CCAC93.
Garantir contraste legível dos chips nos dois temas.

## Padrões obrigatórios de implementação

### Popovers e menus
- SEMPRE renderizar em portal (direto no body), nunca dentro de
  modais ou containers com overflow.
- Posicionar com @floating-ui/react, ancorado ao elemento que abriu,
  com flip automático quando faltar espaço.
- Uma rolagem só: max-height (~320px) com scroll interno; nunca criar
  scrollbar dupla no modal.
- Fechar com Esc, clique fora e seleção — e DESMONTAR o elemento
  (nunca deixar resíduos visuais). Entrada/saída com scale+fade
  ~150ms.
- No mobile, popovers viram bottom sheets menores.

### Toque e acessibilidade
- Todo elemento interativo: área de toque mínima de 44x44px (o visual
  pode ser menor; a área, não).
- Texto de corpo no mobile: nunca abaixo de 15-16px. Nenhum texto
  abaixo de 12px (incluindo hints de teclado).
- Placeholders e textos funcionais: contraste ≥4.5:1 nos dois temas
  (inclusive sobre superfícies elevadas).
- Modais com focus trap real: Tab não escapa para a página atrás;
  Esc fecha.
- Respeitar prefers-reduced-motion também no framer-motion
  (MotionConfig/useReducedMotion), não só em transições CSS.
- Selects e controles sem rótulo visível: aria-label obrigatório.

### Animação e performance
- Animar apenas transform e opacity; nunca top/left/height diretos.
- Animações sutis e rápidas; nada pode atrasar a interação.
- Reordenações de lista com framer-motion layout.

### Dados e interação
- Atualizações otimistas SEMPRE: a interface muda na hora; o
  servidor/persistência confirma em segundo plano; erro reverte com
  toast.
- Exclusões com undo (toast por ~5s).
- Atalhos desktop: Q (nova tarefa), Cmd/Ctrl+K (busca), setas
  navegam, Enter edita, E conclui, 1-4 prioridade, T hoje, ? lista
  de atalhos.

### Mobile
- Safe areas do iPhone (env(safe-area-inset-*)) em todas as telas,
  modais e sheets.
- Listas com padding-bottom suficiente para a tab bar não cobrir o
  último item.
- Swipe na tarefa: direita conclui, esquerda agenda.

## Decisões de layout aprovadas

### Tab bar mobile (estilo Todoist iOS + Liquid Glass)
- Pílula flutuante descolada das bordas (~12-16px de margem),
  cantos totalmente arredondados, FIXA sobre o conteúdo.
- Liquid Glass: backdrop-filter blur(20px) saturate(180%), fundo
  semitransparente (claro ~70% branco; escuro ~60% superfície),
  borda 1px quase invisível + highlight interno no topo, sombra
  difusa. Fallback digno sem backdrop-filter. Mesmo tratamento no
  FAB e nos bottom sheets.
- 4 itens: Navegar, Em breve, Hoje (ícone com o número do dia
  dinâmico), Filtros e Etiquetas. Ícones preenchidos/sólidos,
  não outline fino.
- Item ativo: pílula de fundo que DESLIZA entre itens
  (framer-motion layoutId).
- FAB "+" circular (~56-60px) na cor de acento escura, sobreposto
  acima da barra à direita, com escala spring ao tocar.
- Desktop mantém a sidebar (com paridade: Filtros e Etiquetas
  também existem lá).

### Detalhe da tarefa
- Desktop: modal em DUAS COLUNAS — principal (~65%): breadcrumb do
  projeto, checkbox + título grande editável, descrição em texto
  menor e tom suave (nunca caixa alta, nunca em destaque),
  sub-tarefas, adicionar sub-tarefa; sidebar (~35%, fundo levemente
  diferenciado): campos Projeto, Data, Prioridade, Etiquetas, cada
  um abrindo seu popover ancorado.
- Mobile: bottom sheet de coluna única, arrastável para fechar,
  atributos como chips.
- Rodapé: data de criação sutil + menu "..." (duplicar, excluir
  com undo). Formato de data idêntico em todas as superfícies.

### Sub-tarefas
- 1 nível de profundidade. Compactas: linhas de 36-40px, checkbox
  ~16px, separador fino, bloco colado à descrição, contador
  "Sub-tarefas 1/4" no topo, alça de arrastar no hover,
  "Adicionar sub-tarefa" como linha discreta no fim.
- Na lista, a mãe mostra indicador discreto (ex.: 2/5); sub-tarefas
  não aparecem soltas em Hoje/Em breve.

### Linhas de tarefa nas listas
- Estados permitidos: normal (transparente), hover (tom sutil só
  com o mouse em cima), selecionada (só durante navegação por
  teclado). Nenhum estado persiste após a interação.
- Descrição: UMA linha truncada, fonte menor, tom suave.
- Metadados (sub-tarefas, data, etiquetas) alinhados, ícones do
  mesmo tamanho, espaçamento uniforme.
- Escala fixa de espaçamentos verticais da tela (header → add task
  → seções → tarefas), idêntica em todas as visões.

### Seções e projetos
- Seções recolhíveis com animação suave de altura, contador e menu
  "..." (renomear, mover, excluir). Tarefas sem seção ficam num
  grupo no topo sem cabeçalho. Arrastar tarefas entre seções e
  reordenar seções.

## Checklist antes de declarar qualquer trabalho de UI concluído
1. Testado em 1440px, 1024px, 390px e 320px.
2. Testado nos temas claro E escuro (visualmente, não só na teoria).
3. Nenhum popover cortado, nenhuma scrollbar dupla, nenhum resíduo
   visual após fechar.
4. Alvos de toque ≥44px; textos ≥12px; contrastes ≥4.5:1.
5. Operável por teclado; focus trap nos modais.
6. Estados vazio, carregando e erro desenhados.
7. Comparado visualmente com a referência (Todoist/Things 3) quando
   houver.
