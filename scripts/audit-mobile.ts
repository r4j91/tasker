/* Auditoria mobile: screenshots + scan de alvos de toque < 44px. */
import { chromium, devices } from 'playwright'

const BASE = 'http://localhost:5173'
const browser = await chromium.launch()

const scan = `(() => {
  const els = [...document.querySelectorAll('button, a, input, select, textarea, [role=checkbox], [role=button]')]
  return els
    .filter(el => el.checkVisibility?.() ?? true)
    .map(el => {
      const r = el.getBoundingClientRect()
      const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName).trim().replace(/\\s+/g, ' ').slice(0, 30)
      return { label, w: Math.round(r.width), h: Math.round(r.height) }
    })
    .filter(e => e.w > 0 && e.h > 0 && (e.w < 44 || e.h < 44))
})()`

async function audit(page: import('playwright').Page, name: string) {
  const small = await page.evaluate(scan) as Array<{ label: string; w: number; h: number }>
  console.log(`\n## ${name}`)
  for (const s of small) console.log(`  [toque] ${s.label} — ${s.w}x${s.h}`)
  await page.screenshot({ path: `/tmp/audit-${name}.png`, fullPage: false })
}

const ctx = await browser.newContext({ ...devices['iPhone 13'] })
const p = await ctx.newPage()
await p.addInitScript(() => localStorage.setItem('theme', 'light'))

/* ── Seed ── */
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.getByText('Adicionar tarefa').first().tap()
const type = async (s: string) => { await p.keyboard.type(s); await p.keyboard.press('Enter') }
await type('Cobrar cliente Patrícia hoje p1')
await type('Revisar pedido EMBALA-BLU amanhã 14h p2')
await type('Organizar arquivos do drive p3')
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
/* descrição na primeira */
await p.getByText('Organizar arquivos').tap()
await p.waitForTimeout(250)
await p.getByPlaceholder('Notas...').fill('Separar por ano e cliente, apagar duplicados.')
await p.mouse.click(195, 60)
await p.waitForTimeout(250)

/* ── 390px: telas ── */
await audit(p, '390-inbox')

await p.getByText('Organizar arquivos').tap()
await p.waitForTimeout(300)
await audit(p, '390-editor-expandido')
await p.mouse.click(195, 60)
await p.waitForTimeout(200)

await p.getByText('Adicionar tarefa').first().tap()
await p.keyboard.type('dentista sexta 15h p2')
await p.waitForTimeout(300)
await audit(p, '390-quickadd-nl')
await p.keyboard.press('Escape')

await p.goto(`${BASE}/hoje`, { waitUntil: 'networkidle' })
await audit(p, '390-hoje')

await p.goto(`${BASE}/em-breve`, { waitUntil: 'networkidle' })
await audit(p, '390-embreve')

await p.goto(`${BASE}/projetos`, { waitUntil: 'networkidle' })
await audit(p, '390-projetos-vazio')

/* criar projeto + seções */
await p.getByRole('button', { name: 'Novo' }).tap()
await p.waitForTimeout(300)
await p.keyboard.type('Tarefas Empresa')
await p.getByRole('button', { name: 'Criar projeto' }).tap()
await p.waitForTimeout(200)
await audit(p, '390-modal-projeto-pos') // após fechar
await p.goto(`${BASE}/projetos`, { waitUntil: 'networkidle' })
await p.getByText('Tarefas Empresa').tap()
await p.waitForTimeout(300)
await p.getByText('Adicionar seção').last().tap()
await p.keyboard.type('Em andamento')
await p.keyboard.press('Enter')
await p.waitForTimeout(200)
await p.locator('section').getByText('Adicionar tarefa').tap()
await p.keyboard.type('Edson / Chefware p2')
await p.keyboard.press('Enter')
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
await audit(p, '390-projeto-secoes')

/* menu da seção */
await p.getByLabel('Opções da seção Em andamento').tap()
await p.waitForTimeout(200)
await audit(p, '390-menu-secao')
await p.mouse.click(195, 700)
await p.waitForTimeout(200)

/* seleção múltipla via long-press (inbox) */
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
const row = p.getByText('Organizar arquivos')
const box = await row.boundingBox()
if (box) {
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 60, y: box.y + 8 }] })
  await p.waitForTimeout(650)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await p.waitForTimeout(300)
}
await audit(p, '390-selecao')

/* ── 320px ── */
await p.setViewportSize({ width: 320, height: 700 })
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await audit(p, '320-inbox')
await p.getByText('Revisar pedido').tap()
await p.waitForTimeout(300)
await audit(p, '320-editor-expandido')

/* ── dark ── */
await p.setViewportSize({ width: 390, height: 844 })
await p.evaluate(() => localStorage.setItem('theme', 'dark'))
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await p.screenshot({ path: '/tmp/audit-390-inbox-dark.png' })
await p.goto(`${BASE}/hoje`, { waitUntil: 'networkidle' })
await p.screenshot({ path: '/tmp/audit-390-hoje-dark.png' })

await browser.close()
console.log('\nok')
