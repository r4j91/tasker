/* Auditoria impeccable: telas, estados e fluxos em 4 larguras × 2 temas. */
import { chromium, devices } from 'playwright'

const BASE = 'http://localhost:5173'
const browser = await chromium.launch()
const shot = async (p: import('playwright').Page, name: string) =>
  p.screenshot({ path: `/tmp/imp-${name}.png` })

/* ───────────────────────── seed (desktop) ───────────────────────── */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
p.on('pageerror', e => console.log('PAGE-ERR:', String(e).slice(0, 200)))
await p.addInitScript(() => localStorage.setItem('theme', 'light'))
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })

// etiqueta + projeto com seção
await p.getByLabel('Nova etiqueta').click()
await p.waitForTimeout(200)
await p.keyboard.type('urgente')
await p.getByLabel('Cor Red').click()
await p.getByRole('button', { name: 'Criar etiqueta' }).click()
await p.waitForTimeout(200)
await p.getByLabel('Novo projeto').click()
await p.waitForTimeout(200)
await p.keyboard.type('Tarefas Empresa')
await p.getByRole('button', { name: 'Criar projeto' }).click()
await p.waitForTimeout(300)
await p.getByText('Adicionar seção').last().click()
await p.keyboard.type('Em andamento')
await p.keyboard.press('Enter')
await p.waitForTimeout(150)
await p.locator('section').getByText('Adicionar tarefa').click()
await p.keyboard.type('Edson / Chefware p2 @urgente')
await p.keyboard.press('Enter')
await p.keyboard.press('Escape')
await p.waitForTimeout(150)

// inbox: variedade
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.getByText('Adicionar tarefa').first().click()
await p.keyboard.type('Cobrar cliente Patrícia hoje p1')
await p.keyboard.press('Enter')
await p.keyboard.type('Revisar pedido EMBALA amanhã 14h p2')
await p.keyboard.press('Enter')
await p.keyboard.type('Planejar trimestre p3')
await p.keyboard.press('Enter')
await p.keyboard.type('Sem nada definido')
await p.keyboard.press('Enter')
await p.keyboard.press('Escape')
await p.waitForTimeout(200)

// atrasada (ontem) + descrição + sub-tarefas
await p.getByText('Planejar trimestre').click()
await p.waitForTimeout(300)
const dlg = p.getByRole('dialog')
await dlg.getByPlaceholder('Adicionar descrição...').fill('Separar metas por área e revisar orçamento.')
await dlg.getByText('Adicionar sub-tarefa').click()
await p.keyboard.type('Mapear metas')
await p.keyboard.press('Enter')
await p.keyboard.type('Reunir números')
await p.keyboard.press('Enter')
await p.keyboard.press('Escape')
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
await p.getByText('Cobrar cliente').click()
await p.waitForTimeout(300)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
await p.getByRole('dialog').getByRole('button', { name: /Hoje/ }).click()
await p.waitForTimeout(150)
await p.locator('input[type="date"]').fill(yesterday)
await p.keyboard.press('Escape')
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
// concluir uma
await p.locator('[role="checkbox"]').last().click()
await p.waitForTimeout(400)

/* ── hidratação: recarrega e fotografa cedo ── */
await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(40)
await shot(p, 'hydration-40ms')
const flashEmpty = await p.getByText('Tudo limpo por aqui').isVisible().catch(() => false)
console.log('FLASH-vazio-na-hidratacao:', flashEmpty)
await p.waitForTimeout(400)

/* ── desktop 1440 light ── */
await shot(p, '1440-light-inbox')
await p.goto(`${BASE}/hoje`, { waitUntil: 'networkidle' })
await shot(p, '1440-light-hoje')
await p.goto(`${BASE}/em-breve`, { waitUntil: 'networkidle' })
await shot(p, '1440-light-embreve')
await p.locator('aside').getByText('Tarefas Empresa').click()
await p.waitForTimeout(300)
await shot(p, '1440-light-projeto')
await p.locator('aside').getByText('urgente').click()
await p.waitForTimeout(300)
await shot(p, '1440-light-etiqueta')

// detalhe + popover
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.getByText('Planejar trimestre').click()
await p.waitForTimeout(350)
await p.getByRole('dialog').getByRole('button', { name: 'Data' }).click()
await p.waitForTimeout(200)
await shot(p, '1440-light-detalhe-popover')

/* foco: Tab escapa do modal? */
let escaped = false
for (let i = 0; i < 25; i++) {
  await p.keyboard.press('Tab')
  const inside = await p.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))
  if (!inside) { escaped = true; break }
}
console.log('FOCUS-TRAP-modal-vaza:', escaped)
await p.keyboard.press('Escape')
await p.keyboard.press('Escape')
await p.waitForTimeout(200)

/* paleta */
await p.keyboard.press('Meta+k')
await p.waitForTimeout(250)
await shot(p, '1440-light-paleta')
await p.keyboard.press('Escape')

/* dark 1440 */
await p.evaluate(() => localStorage.setItem('theme', 'dark'))
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await shot(p, '1440-dark-inbox')
await p.getByText('Planejar trimestre').click()
await p.waitForTimeout(350)
await shot(p, '1440-dark-detalhe')
await p.keyboard.press('Escape')

/* 1024 */
await p.setViewportSize({ width: 1024, height: 768 })
await p.evaluate(() => localStorage.setItem('theme', 'light'))
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await shot(p, '1024-light-inbox')
await ctx.close()

/* ───────────────────────── mobile 390 ───────────────────────── */
const mctx = await browser.newContext(devices['iPhone 13'])
const m = await mctx.newPage()
m.on('pageerror', e => console.log('PAGE-ERR-M:', String(e).slice(0, 200)))
await m.addInitScript(() => localStorage.setItem('theme', 'light'))
await m.goto(`${BASE}/`, { waitUntil: 'networkidle' })
// seed mínimo mobile (contexto separado)
await m.getByText('Adicionar tarefa').first().tap()
await m.waitForTimeout(350)
await m.keyboard.type('Cobrar cliente hoje p1')
await m.getByLabel('Adicionar tarefa').last().tap()
await m.waitForTimeout(200)
await m.keyboard.type('Revisar pedido amanhã p2')
await m.getByLabel('Adicionar tarefa').last().tap()
await m.waitForTimeout(200)
await m.locator('div.fixed.inset-0 > div').first().click({ position: { x: 50, y: 50 } }).catch(() => {})
await m.keyboard.press('Escape')
await m.waitForTimeout(300)
await shot(m, '390-light-inbox')
await m.goto(`${BASE}/hoje`, { waitUntil: 'networkidle' })
await shot(m, '390-light-hoje')
await m.goto(`${BASE}/navegar`, { waitUntil: 'networkidle' })
await shot(m, '390-light-navegar')
await m.goto(`${BASE}/filtros`, { waitUntil: 'networkidle' })
await shot(m, '390-light-filtros')
await m.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await m.getByText('Cobrar cliente').tap()
await m.waitForTimeout(450)
await shot(m, '390-light-detalhe')
await m.getByLabel('Fechar').tap()
await m.waitForTimeout(250)
/* dark */
await m.evaluate(() => localStorage.setItem('theme', 'dark'))
await m.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await shot(m, '390-dark-inbox')
/* 320 */
await m.setViewportSize({ width: 320, height: 700 })
await m.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await shot(m, '320-dark-inbox')
await m.getByText('Cobrar cliente').tap()
await m.waitForTimeout(450)
await shot(m, '320-dark-detalhe')
await mctx.close()

/* ── estados vazios (contexto limpo) ── */
const ectx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const e = await ectx.newPage()
await e.addInitScript(() => localStorage.setItem('theme', 'light'))
await e.goto(`${BASE}/em-breve`, { waitUntil: 'networkidle' })
await shot(e, 'vazio-embreve')
await e.keyboard.press('Meta+k')
await e.waitForTimeout(200)
await e.keyboard.type('zzzz')
await e.waitForTimeout(200)
await shot(e, 'vazio-busca')
await ectx.close()

await browser.close()
console.log('ok')
