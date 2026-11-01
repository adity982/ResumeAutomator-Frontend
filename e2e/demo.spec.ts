import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('public demo reviews and downloads fictional evidence without account or API requests', async ({ page }, testInfo) => {
  const unexpectedRequests: string[] = []
  page.on('request', (request) => {
    if (['fetch', 'xhr'].includes(request.resourceType())) unexpectedRequests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Sign in|Continue with Google/ })).toHaveCount(0)
  await expect(page.getByText('Interactive demo · no account needed')).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click()
  await page.getByLabel('Sample target role').selectOption('retrieval')
  await page.getByText('Inspect illustrative source').click()
  await expect(page.getByText('retrieval/search.py, evaluations/relevance.json', { exact: true })).toBeVisible()
  const download = page.getByRole('button', { name: 'Download illustrative bullet' })
  await expect(download).toBeDisabled()
  await page.getByRole('checkbox').check()
  const downloading = page.waitForEvent('download')
  await download.click()
  const file = await downloading
  expect(await readFile((await file.path())!, 'utf8')).toContain('SAMPLE ONLY\nRetrieval engineer')
  await page.getByLabel('Sample target role').selectOption('backend')
  await expect(page.getByRole('checkbox')).not.toBeChecked()
  await expect(download).toBeDisabled()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: testInfo.outputPath('demo-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  await page.screenshot({ path: testInfo.outputPath('demo-mobile.png'), fullPage: true })
  await page.goto('/#/jobs')
  await expect(page.getByText('Interactive demo · no account needed')).toBeVisible()
  await page.goto('/#/sample')
  await expect(page.getByRole('heading', { name: 'Explore a sample application' })).toBeVisible()
  expect(unexpectedRequests).toEqual([])
})
