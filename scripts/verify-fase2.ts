/* Verificação funcional da Fase 2: dirige o app real e captura screenshots. */
import { chromium } from 'playwright'

const BASE = process.env.SHOT_URL ?? 'http://localhost:5173'
const browser = await chromium.launch()

const ctx = await browser.newContext({ viewport: { width: 1280, height: 880 } })
const page = await ctx.newPage()
await page.addInitScript(() => localStorage.setItem('theme', 'light'))

/* 1. Inbox vazia */
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.screenshot({ path: '/tmp/f2-01-inbox-vazia.png' })

/* 2. Adicionar tarefas na inbox */
await page.getByText('Adicionar tarefa').click()
await page.keyboard.type('Revisar proposta do cliente')
await page.keyboard.press('Enter')
await page.keyboard.type('Comprar presente de aniversário')
await page.keyboard.press('Enter')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* 3. Expandir tarefa e agendar para daqui a 3 dias */
await page.getByText('Comprar presente de aniversário').click()
await page.waitForTimeout(300)
const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
await page.locator('input[type="date"]').fill(future)
await page.screenshot({ path: '/tmp/f2-02-inline-editor.png' })
await page.getByText('Comprar presente de aniversário').click() // recolhe
await page.waitForTimeout(300)

/* 4. Hoje: adicionar tarefa (data pré-setada) e concluir uma */
await page.goto(`${BASE}/hoje`, { waitUntil: 'networkidle' })
await page.getByText('Adicionar tarefa').click()
await page.keyboard.type('Pagar internet')
await page.keyboard.press('Enter')
await page.keyboard.type('Treinar 30 minutos')
await page.keyboard.press('Enter')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
/* concluir a primeira */
await page.locator('[role="checkbox"]').first().click()
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/f2-03-hoje.png' })

/* 5. Em breve */
await page.goto(`${BASE}/em-breve`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.screenshot({ path: '/tmp/f2-04-em-breve.png' })

/* 6. Criar projeto pela sidebar */
await page.getByLabel('Novo projeto').click()
await page.waitForTimeout(300)
await page.keyboard.type('Trabalho')
await page.getByRole('button', { name: 'Criar projeto' }).click()
await page.waitForTimeout(400)
await page.getByText('Adicionar tarefa').click()
await page.keyboard.type('Preparar apresentação de sexta')
await page.keyboard.press('Enter')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/f2-05-projeto.png' })

/* 7. Excluir tarefa → toast de undo */
await page.getByText('Preparar apresentação de sexta').click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Excluir' }).click()
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/f2-06-undo-toast.png' })
await page.getByText('Desfazer').click()
await page.waitForTimeout(300)

await ctx.close()

/* 8. Mobile dark: Hoje com navegação inferior */
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })
const mp = await mobile.newPage()
await mp.addInitScript(() => localStorage.setItem('theme', 'dark'))
await mp.goto(`${BASE}/hoje`, { waitUntil: 'networkidle' })
await mp.waitForTimeout(400)
await mp.screenshot({ path: '/tmp/f2-07-mobile-dark.png' })
await mobile.close()

await browser.close()
console.log('ok')
