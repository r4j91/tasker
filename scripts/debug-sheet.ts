import { chromium, devices } from 'playwright'

const b = await chromium.launch()
const ctx = await b.newContext(devices['iPhone 13'])
const p = await ctx.newPage()
p.on('pageerror', e => console.log('PAGE-ERR:', String(e).slice(0, 200)))
await p.addInitScript(() => localStorage.setItem('theme', 'light'))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

await p.getByText('Adicionar tarefa').first().tap()
await p.waitForTimeout(350)
await p.keyboard.type('Tarefa data')
await p.keyboard.press('Enter')
await p.keyboard.press('Escape')
await p.waitForTimeout(900)
const sheetAddFechou = !(await p.locator('div.fixed.inset-0.z-50').first().isVisible().catch(() => false))
console.log('1-quickadd-fechou-com-esc:', sheetAddFechou)

if (!sheetAddFechou) {
  // fecha pelo backdrop para continuar
  await p.mouse.click(50, 80)
  await p.waitForTimeout(300)
}

await p.getByText('Tarefa data').tap()
await p.waitForTimeout(600)
console.log('2-detalhe-aberto:', await p.getByText('Sub-tarefas').isVisible().catch(() => false))

await p.getByText('Adicionar data').tap()
await p.waitForTimeout(450)
const btns = p.getByRole('button').filter({ hasText: 'Amanh' })
console.log('3-btn-count:', await btns.count())
const box = await btns.first().boundingBox().catch(() => null)
console.log('4-btn-box:', JSON.stringify(box))
if (box) {
  const ponto = await p.evaluate(pt => {
    const el = document.elementFromPoint(pt[0], pt[1])
    return el ? el.tagName + '|' + String(el.className).slice(0, 70) : 'null'
  }, [box.x + box.width / 2, box.y + box.height / 2])
  console.log('5-no-ponto:', ponto)
  await btns.first().click()
  await p.waitForTimeout(450)
  const due = await p.evaluate(() => {
    const s = (window as never as Record<string, { getState: () => { tasks: Array<{ title: string; dueDate: string | null }> } }>).__taskStore
    return s ? JSON.stringify(s.getState().tasks.map(t => [t.title, t.dueDate])) : 'sem-sonda'
  })
  console.log('6-store:', due)
  console.log('7-chip-sem-data:', await p.getByText('Adicionar data').isVisible().catch(() => false))
  await p.screenshot({ path: '/tmp/debug-sheet-final.png' })
}

await b.close()
console.log('fim')
