/* Verificação da Fase 3: linguagem natural, Cmd+K, atalhos de teclado. */
import { chromium } from 'playwright'

const BASE = process.env.SHOT_URL ?? 'http://localhost:5173'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 880 } })
const page = await ctx.newPage()
page.on('pageerror', e => console.log('PAGE-ERR:', String(e).slice(0, 200)))
await page.addInitScript(() => localStorage.setItem('theme', 'light'))

/* Setup: criar projeto "Trabalho" */
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.getByLabel('Novo projeto').click()
await page.waitForTimeout(300)
await page.keyboard.type('Trabalho')
await page.getByRole('button', { name: 'Criar projeto' }).click()
await page.waitForTimeout(400)

/* 1. Linguagem natural com chips */
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.getByText('Adicionar tarefa').click()
await page.keyboard.type('reunião de equipe segunda 14h #trabalho p1', { delay: 15 })
await page.waitForTimeout(400)
await page.screenshot({ path: '/tmp/f3-01-nl-chips.png', clip: { x: 240, y: 0, width: 1040, height: 320 } })
await page.keyboard.press('Enter')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* A tarefa deve ter ido para o projeto Trabalho (não está na inbox) */
const inboxEmpty = await page.getByText('Tudo limpo por aqui').isVisible().catch(() => false)
console.log('parsed-to-project:', inboxEmpty)

/* 2. Cmd+K — paleta */
await page.keyboard.press('Meta+k')
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/f3-02-palette.png' })
await page.keyboard.type('reuni')
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/f3-03-palette-busca.png' })
await page.keyboard.press('Enter') // abre a tarefa no projeto
await page.waitForTimeout(500)
const onProject = page.url().includes('/projeto/')
console.log('palette-opens-task:', onProject)
await page.screenshot({ path: '/tmp/f3-04-task-expandida.png' })

/* 3. Atalhos: Escape fecha edição, setas selecionam, E conclui */
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
await page.keyboard.press('ArrowDown')
await page.waitForTimeout(200)
await page.screenshot({ path: '/tmp/f3-05-selecionada.png' })
await page.keyboard.press('e')
await page.waitForTimeout(500)
const projectEmpty = await page.getByText('Projeto em branco').isVisible().catch(() => false)
console.log('shortcut-E-completes:', projectEmpty)

/* 4. ? abre atalhos */
await page.keyboard.press('?')
await page.waitForTimeout(300)
await page.screenshot({ path: '/tmp/f3-06-atalhos.png' })
await page.keyboard.press('Escape')

/* 5. T navega para Hoje */
await page.keyboard.press('t')
await page.waitForTimeout(300)
console.log('shortcut-T-today:', page.url().includes('/hoje'))

await browser.close()
console.log('ok')
