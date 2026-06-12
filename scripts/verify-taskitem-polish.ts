/* Pente fino da linha de tarefa: alinhamento óptico, hit areas, press feedback */
import { chromium, devices } from 'playwright'

const BASE = 'http://localhost:5173'

async function seed(page: import('playwright').Page) {
  await page.evaluate(() => {
    const store = (window as any).__taskStore
    store.getState().addTask({
      title: 'Pente fino da linha',
      priority: 1,
      dueDate: new Date().toISOString().slice(0, 10),
      dueTime: '14:00',
    })
    const parent = store.getState().tasks.find((t: any) => t.title === 'Pente fino da linha')
    store.getState().updateTask(parent.id, { notes: 'Descrição de uma linha para a prévia' })
    store.getState().addTask({ title: 'Sub de alinhamento', parentId: parent.id })
  })
  await page.waitForTimeout(300)
}

async function measure(page: import('playwright').Page, label: string) {
  const row = page.locator('[data-row-main]').first().locator('..')
  const data = await row.evaluate((rowEl) => {
    const top = rowEl.getBoundingClientRect().top
    const circle = rowEl.querySelector('[role="checkbox"] span[aria-hidden]')!
    const c = circle.getBoundingClientRect()
    const chevron = rowEl.querySelector('button[aria-expanded]')
    const ch = chevron?.getBoundingClientRect()
    const title = rowEl.querySelector('[data-row-main] > span')!
    const range = document.createRange()
    range.selectNodeContents(title)
    const line = range.getClientRects()[0]
    return {
      circleCenter: +(c.top + c.height / 2 - top).toFixed(1),
      chevronCenter: ch ? +(ch.top + ch.height / 2 - top).toFixed(1) : null,
      titleLineCenter: +(line.top + line.height / 2 - top).toFixed(1),
    }
  })
  const dCircle = Math.abs(data.circleCenter - data.titleLineCenter)
  const dChev = data.chevronCenter == null ? 0 : Math.abs(data.chevronCenter - data.titleLineCenter)
  console.log(`[${label}] circle=${data.circleCenter} chevron=${data.chevronCenter} titleLine=${data.titleLineCenter}`
    + ` → Δcircle=${dCircle.toFixed(1)} Δchevron=${dChev.toFixed(1)} ${dCircle <= 1 && dChev <= 1 ? 'OK' : 'FALHA'}`)
}

async function main() {
  const browser = await chromium.launch()

  /* ── Desktop 1440 ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await seed(page)
    await measure(page, 'desktop 1440')

    /* Press feedback: mousedown no botão principal tinge a linha; soltar reverte */
    const main = page.locator('[data-row-main]').first()
    const container = main.locator('..').locator('..')
    const before = await container.evaluate(el => getComputedStyle(el).backgroundColor)
    const box = (await main.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + 10)
    await page.mouse.down()
    await page.waitForTimeout(250)
    const during = await container.evaluate(el => getComputedStyle(el).backgroundColor)
    await page.mouse.up()
    await page.keyboard.press('Escape') // fecha o detalhe aberto pelo clique
    await page.mouse.move(10, 600)      // sai de cima da linha (hover legítimo não conta)
    await page.waitForTimeout(350)
    const after = await container.evaluate(el => getComputedStyle(el).backgroundColor)
    console.log(`[press] antes=${before} durante=${during} depois=${after} ${during !== before ? 'OK tinge' : 'FALHA'} ${after === before ? 'OK reverte' : 'FALHA reverte'}`)

    /* Hit area do chevron: ponto 6px ACIMA do visual ainda acerta o botão */
    const chev = page.locator('button[aria-expanded]').first()
    const cb = (await chev.boundingBox())!
    const hit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y)
      return !!el?.closest('button[aria-expanded]')
    }, { x: cb.x + cb.width / 2, y: cb.y - 6 })
    console.log(`[chevron hit] 6px acima do visual acerta o botão: ${hit ? 'OK' : 'FALHA'}`)

    await page.screenshot({ path: `${process.env.HOME}/Desktop/tasker-prints/polish-row-desktop-light.png` })
    await ctx.close()
  }

  /* ── Mobile 390 (iPhone 13) ── */
  {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await seed(page)
    await measure(page, 'mobile 390')
    await page.screenshot({ path: `${process.env.HOME}/Desktop/tasker-prints/polish-row-mobile-light.png` })
    await ctx.close()
  }

  /* ── Tema escuro, desktop ── */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(BASE)
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await seed(page)
    await measure(page, 'desktop dark')
    await page.screenshot({ path: `${process.env.HOME}/Desktop/tasker-prints/polish-row-desktop-dark.png` })
    await ctx.close()
  }

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
