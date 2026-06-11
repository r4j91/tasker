/* Verificação: seção de concluídas + seleção múltipla por toque longo. */
import { chromium, devices } from 'playwright'

const BASE = process.env.SHOT_URL ?? 'http://localhost:5173'
const browser = await chromium.launch()

/* ── 1. Desktop: seção de concluídas ── */
const ctx = await browser.newContext({ viewport: { width: 1280, height: 880 } })
const page = await ctx.newPage()
await page.addInitScript(() => localStorage.setItem('theme', 'light'))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })

await page.getByText('Adicionar tarefa').click()
await page.keyboard.type('Tarefa ativa')
await page.keyboard.press('Enter')
await page.keyboard.type('Tarefa que vou concluir')
await page.keyboard.press('Enter')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* Concluir a primeira da lista */
await page.locator('[role="checkbox"]').first().click()
await page.waitForTimeout(600)

const toggle = page.getByText('1 concluída')
console.log('completed-toggle-visible:', await toggle.isVisible())
await toggle.click()
await page.waitForTimeout(400)
await page.screenshot({ path: '/tmp/f3b-01-concluidas.png' })

/* Restaurar: desmarcar a concluída */
await page.locator('[role="checkbox"][aria-checked="true"]').first().click()
await page.waitForTimeout(600)
const restored = await page.locator('[role="checkbox"][aria-checked="false"]').count()
console.log('restored-active-count:', restored) // deve ser 2
await ctx.close()

/* ── 2. Mobile: toque longo → seleção múltipla → concluir em lote ── */
const mobile = await browser.newContext({
  ...devices['iPhone 13'],
  defaultBrowserType: undefined,
} as Parameters<typeof browser.newContext>[0])
const mp = await mobile.newPage()
await mp.addInitScript(() => localStorage.setItem('theme', 'light'))
await mp.goto(`${BASE}/`, { waitUntil: 'networkidle' })

/* criar 3 tarefas */
await mp.getByText('Adicionar tarefa').tap()
await mp.locator('input').first().fill('Lavar o carro')
await mp.keyboard.press('Enter')
await mp.locator('input').first().fill('Regar as plantas')
await mp.keyboard.press('Enter')
await mp.locator('input').first().fill('Arrumar a estante')
await mp.keyboard.press('Enter')
await mp.keyboard.press('Escape')
await mp.waitForTimeout(300)

/* toque longo na primeira linha via CDP */
const row = mp.getByText('Arrumar a estante')
const box = await row.boundingBox()
if (!box) throw new Error('linha não encontrada')
const cdp = await mobile.newCDPSession(mp)
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
})
await mp.waitForTimeout(700)
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await mp.waitForTimeout(400)

const barVisible = await mp.getByLabel('1 tarefa selecionada').isVisible().catch(() => false)
console.log('longpress-selection-bar:', barVisible)

/* marcar mais uma e concluir em lote */
await mp.getByText('Regar as plantas').tap()
await mp.waitForTimeout(300)
console.log('two-selected:', await mp.getByLabel('2 tarefas selecionadas').isVisible().catch(() => false))
await mp.screenshot({ path: '/tmp/f3b-02-selecao.png' })

await mp.getByText('Concluir', { exact: true }).tap()
await mp.waitForTimeout(600)
console.log('bulk-completed-toggle:', await mp.getByText('2 concluídas').isVisible().catch(() => false))
await mp.screenshot({ path: '/tmp/f3b-03-apos-lote.png' })

await browser.close()
console.log('ok')
