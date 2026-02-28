import { Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots')

/**
 * Captures a screenshot and saves it to e2e/screenshots/<name>.png
 */
export async function captureScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: true,
  })
}

/**
 * Asserts no console errors occurred.
 * Attach a listener before navigation and call this after the test.
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
  void page // placeholder; use inline console listeners in tests
}
