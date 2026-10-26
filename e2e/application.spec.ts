import { test, expect } from '@playwright/test'

test('job to cited project draft to approved document and saved recovery', async ({ page }) => {
  await page.goto('/#/jobs/new')
  await page
    .getByLabel('Parsed resume — editable')
    .fill(
      'Sam Example\nSUMMARY\nI build reliable Python web applications.\nPROJECTS\nImplemented API services and database tests.',
    )
  await page.getByLabel('Role', { exact: true }).fill(`API developer ${Date.now()}`)
  await page.getByLabel('Company', { exact: true }).fill('Synthetic test company')
  await page
    .getByLabel('Job description', { exact: true })
    .fill('Build Python FastAPI APIs with PostgreSQL persistence and request validation tests.')
  await page.getByRole('button', { name: 'Save target' }).click()
  await expect(page).toHaveURL(/#\/jobs\/\d+\/prepare/)
  await page.getByRole('link', { name: 'Choose projects', exact: true }).click()
  await page.getByRole('button', { name: 'Find supporting experience' }).click()
  await expect(page.getByRole('heading', { name: 'Recommended project set' })).toBeVisible()
  await page.getByRole('button', { name: 'Add selected bullets to a reviewable draft' }).click()
  await expect(page.getByLabel('Tailored — editable')).toHaveValue(/FastAPI/)
  await page.getByRole('button', { name: 'Preview PDF', exact: true }).click()
  const approval = page.getByLabel('I reviewed this exact version')
  await expect(approval).toBeEnabled()
  await approval.check()
  await page.getByRole('button', { name: 'Save version', exact: true }).click()
  await expect(page.getByText(/Saved approved version 1/)).toBeVisible()
  await page.getByRole('button', { name: 'Save progress', exact: true }).click()
  await expect(page.getByText('Progress saved to your account')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Restore saved workspace' }).click()
  await expect(page.getByLabel('Tailored — editable')).toHaveValue(/FastAPI/)
  await expect(page.getByLabel('I reviewed this exact version')).not.toBeChecked()
  await page.getByRole('link', { name: 'Track application', exact: true }).click()
  await page.getByLabel('Approved resume', { exact: true }).selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Add this job to my application tracker' }).click()
  await expect(page.getByLabel('Stage', { exact: true })).toBeVisible()
  await page.getByLabel('Stage', { exact: true }).selectOption('applied')
  await expect(page.getByText('stage changed · applied')).toBeVisible()
})

test('illustrative sample is usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/sample')
  await expect(page.getByRole('heading', { name: 'Explore a sample application' })).toBeVisible()
  await page.getByLabel('Sample target role').selectOption('retrieval')
  await expect(page.getByText('Sample retrieval lab', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download illustrative bullet' })).toBeDisabled()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflow).toBe(false)
})
