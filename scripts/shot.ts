/* Captura screenshots da página /design-system nos dois temas. */
import { chromium } from 'playwright'

const BASE = process.env.SHOT_URL ?? 'http://localhost:5173'

const browser = await chromium.launch()

for (const theme of ['light', 'dark'] as const) {
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 1000 },
    colorScheme: theme,
  })
  const page = await ctx.newPage()
  await page.addInitScript(t => localStorage.setItem('theme', t), theme)
  await page.goto(`${BASE}/design-system`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `/tmp/tasker-ds-${theme}.png`, fullPage: true })
  await ctx.close()
}

await browser.close()
console.log('ok')
