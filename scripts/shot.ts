/* Captura screenshots da página /design-system nos dois temas. */
import { chromium } from 'playwright'

const BASE = process.env.SHOT_URL ?? 'http://localhost:5173'
const PALETTE = process.env.PALETTE // 'pastel' ou vazio

const browser = await chromium.launch()

for (const theme of ['light', 'dark'] as const) {
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 1000 },
    colorScheme: theme,
  })
  const page = await ctx.newPage()
  await page.addInitScript(t => localStorage.setItem('theme', t), theme)
  const query = PALETTE ? `?palette=${PALETTE}` : ''
  const suffix = PALETTE ? `-${PALETTE}` : ''
  await page.goto(`${BASE}/design-system${query}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `/tmp/tasker-ds-${theme}${suffix}.png`, fullPage: true })
  await ctx.close()
}

await browser.close()
console.log('ok')
