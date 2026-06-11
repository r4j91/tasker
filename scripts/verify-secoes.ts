/* Verificação: seções dentro de projetos. */
import { chromium } from 'playwright'

const BASE = process.env.SHOT_URL ?? 'http://localhost:5173'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 880 } })
const page = await ctx.newPage()
page.on('pageerror', e => console.log('PAGE-ERR:', String(e).slice(0, 200)))
await page.addInitScript(() => localStorage.setItem('theme', 'light'))

/* Criar projeto */
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.getByLabel('Novo projeto').click()
await page.waitForTimeout(300)
await page.keyboard.type('Reforma da casa')
await page.getByRole('button', { name: 'Criar projeto' }).click()
await page.waitForTimeout(400)

/* Tarefa sem seção via QuickAdd */
await page.getByText('Adicionar tarefa').click()
await page.keyboard.type('Definir orçamento')
await page.keyboard.press('Enter')
await page.keyboard.press('Escape')
await page.waitForTimeout(200)

/* Criar duas seções */
await page.getByText('Adicionar seção').last().click()
await page.keyboard.type('Em andamento')
await page.keyboard.press('Enter')
await page.waitForTimeout(200)
await page.getByText('Adicionar seção').last().click()
await page.keyboard.type('Aguardando')
await page.keyboard.press('Enter')
await page.waitForTimeout(300)
console.log('sections-created:',
  await page.getByText('Em andamento').isVisible() &&
  await page.getByText('Aguardando').isVisible())

/* Tarefa dentro da seção "Em andamento" */
await page.locator('section', { hasText: 'Em andamento' }).getByText('Tarefa', { exact: true }).click()
await page.keyboard.type('Pintar a sala')
await page.keyboard.press('Enter')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/sec-01-estrutura.png' })

/* Arrastar "Pintar a sala" para "Aguardando" */
const task = page.getByText('Pintar a sala')
const target = page.locator('section', { hasText: 'Aguardando' })
const tb = await task.boundingBox()
const sb = await target.boundingBox()
if (!tb || !sb) throw new Error('elementos não encontrados')
await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2)
await page.mouse.down()
await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2 + 20, { steps: 5 })
await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height - 10, { steps: 15 })
await page.waitForTimeout(300)
await page.mouse.up()
await page.waitForTimeout(500)

const inTarget = await page
  .locator('section', { hasText: 'Aguardando' })
  .getByText('Pintar a sala')
  .isVisible()
  .catch(() => false)
console.log('drag-between-sections:', inTarget)
await page.screenshot({ path: '/tmp/sec-02-apos-drag.png' })

/* Recolher seção */
await page.getByLabel('Recolher seção').last().click()
await page.waitForTimeout(400)
const hidden = !(await page.getByText('Pintar a sala').isVisible().catch(() => false))
console.log('collapse-hides-tasks:', hidden)

/* Renomear via menu */
await page.getByLabel('Opções da seção Em andamento').click()
await page.getByText('Renomear').click()
await page.keyboard.press('Meta+a')
await page.keyboard.type('Fazendo agora')
await page.keyboard.press('Enter')
await page.waitForTimeout(300)
console.log('rename-works:', await page.getByText('Fazendo agora').isVisible())

/* Excluir seção — tarefas sobem para sem-seção */
await page.getByLabel('Recolher seção').last().click() // reexpande Aguardando? na verdade é expandir
await page.waitForTimeout(200)
await page.getByLabel('Opções da seção Aguardando').click()
await page.getByText('Excluir seção').click()
await page.waitForTimeout(400)
const taskStillThere = await page.getByText('Pintar a sala').isVisible().catch(() => false)
console.log('delete-section-keeps-tasks:', taskStillThere)
await page.screenshot({ path: '/tmp/sec-03-final.png' })

await browser.close()
console.log('ok')
