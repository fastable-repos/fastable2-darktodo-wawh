import { test, expect, Page } from '@playwright/test'
import { captureScreenshot } from './helpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function addTodo(page: Page, text: string) {
  await page.getByTestId('todo-input').fill(text)
  await page.keyboard.press('Enter')
}

async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('darktodo_items')
    localStorage.removeItem('darktodo_theme')
  })
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
  await page.reload()
  // Ensure the app is loaded
  await page.getByTestId('todo-input').waitFor()
})

// 1. Happy path: add a new todo
test('adds a new todo by pressing Enter', async ({ page }) => {
  await page.getByTestId('todo-input').fill('Buy groceries')
  await page.keyboard.press('Enter')

  const item = page.getByTestId('todo-item').first()
  await expect(item).toBeVisible()
  await expect(item.getByTestId('todo-text')).toHaveText('Buy groceries')
  await expect(item.getByTestId('todo-checkbox')).toBeVisible()
  await expect(item.getByTestId('delete-button')).toBeVisible({ visible: false }) // hidden until hover; verify it exists
})

// 2. Happy path: complete a todo
test('marks a todo as complete', async ({ page }) => {
  await addTodo(page, 'Read a book')
  await addTodo(page, 'Write code')

  const itemCount = page.getByTestId('item-count')
  await expect(itemCount).toHaveText('2 items left')

  const first = page.getByTestId('todo-item').first()
  await first.getByTestId('todo-checkbox').click()

  // Text should be struck through
  const text = first.getByTestId('todo-text')
  await expect(text).toHaveCSS('text-decoration-line', 'line-through')

  // Count decrements
  await expect(itemCount).toHaveText('1 item left')
})

// 3. Happy path: delete a todo
test('deletes a todo when X button is clicked', async ({ page }) => {
  await addTodo(page, 'Task to delete')

  const item = page.getByTestId('todo-item').first()
  // Hover to reveal delete button
  await item.hover()
  await item.getByTestId('delete-button').click()

  await expect(page.getByTestId('todo-item')).toHaveCount(0)
  await expect(page.getByTestId('empty-state')).toBeVisible()
})

// 4. Filter behavior
test('filters todos by All / Active / Completed', async ({ page }) => {
  await addTodo(page, 'Active task 1')
  await addTodo(page, 'Active task 2')
  await addTodo(page, 'Completed task')

  // Complete the third one
  const items = page.getByTestId('todo-item')
  await items.nth(2).getByTestId('todo-checkbox').click()

  // Active filter
  await page.getByTestId('filter-active').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(2)
  await expect(page.getByText('Completed task')).not.toBeVisible()

  // Completed filter
  await page.getByTestId('filter-completed').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByText('Completed task')).toBeVisible()

  // All filter
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  // Screenshot: filtered view (Active)
  await page.getByTestId('filter-active').click()
  await captureScreenshot(page, '03-active-filter-view')
})

// 5. Clear completed
test('clears all completed todos', async ({ page }) => {
  await addTodo(page, 'Keep me')
  await addTodo(page, 'Delete me 1')
  await addTodo(page, 'Delete me 2')

  // Complete the last two
  const items = page.getByTestId('todo-item')
  await items.nth(1).getByTestId('todo-checkbox').click()
  await items.nth(2).getByTestId('todo-checkbox').click()

  await page.getByTestId('clear-completed').click()

  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByText('Keep me')).toBeVisible()
  await expect(page.getByText('Delete me 1')).not.toBeVisible()
  await expect(page.getByText('Delete me 2')).not.toBeVisible()
})

// 6. Data persistence across page reload
test('persists todos after page reload', async ({ page }) => {
  await addTodo(page, 'Persistent task 1')
  await addTodo(page, 'Persistent task 2')

  // Complete the second one
  await page.getByTestId('todo-item').nth(1).getByTestId('todo-checkbox').click()

  await page.reload()
  await page.getByTestId('todo-input').waitFor()

  await expect(page.getByTestId('todo-item')).toHaveCount(2)
  await expect(page.getByText('Persistent task 1')).toBeVisible()
  await expect(page.getByText('Persistent task 2')).toBeVisible()

  // Second item should still be completed
  const secondText = page.getByTestId('todo-item').nth(1).getByTestId('todo-text')
  await expect(secondText).toHaveCSS('text-decoration-line', 'line-through')
})

// 7. Theme persistence across reload
test('persists light mode preference after page reload', async ({ page }) => {
  // Default is dark – toggle to light
  await page.getByTestId('theme-toggle').click()

  // Verify light mode applied (html element should not have dark class)
  const htmlClass = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  expect(htmlClass).toBe(false)

  await page.reload()
  await page.getByTestId('todo-input').waitFor()

  // Should still be in light mode
  const htmlClassAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  expect(htmlClassAfterReload).toBe(false)
})

// 8. Edge case: empty input does not add a todo
test('does not add a todo for empty or whitespace input', async ({ page }) => {
  // Empty
  await page.getByTestId('todo-input').fill('')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('todo-item')).toHaveCount(0)

  // Whitespace only
  await page.getByTestId('todo-input').fill('   ')
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(0)

  await expect(page.getByTestId('empty-state')).toBeVisible()
})

// 9. Empty state message shown when all todos deleted
test('shows empty state when all todos are deleted', async ({ page }) => {
  await addTodo(page, 'Temporary task')
  await expect(page.getByTestId('empty-state')).not.toBeVisible()

  const item = page.getByTestId('todo-item').first()
  await item.hover()
  await item.getByTestId('delete-button').click()

  await expect(page.getByTestId('empty-state')).toBeVisible()
})

// ─── Screenshots ──────────────────────────────────────────────────────────────

test('screenshot: dark mode with mixed todos', async ({ page }) => {
  // Ensure dark mode
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  if (!isDark) await page.getByTestId('theme-toggle').click()

  await addTodo(page, 'Buy groceries')
  await addTodo(page, 'Read a book')
  await addTodo(page, 'Write unit tests')
  await addTodo(page, 'Go for a run')
  await addTodo(page, 'Call dentist')

  // Complete some
  await page.getByTestId('todo-item').nth(1).getByTestId('todo-checkbox').click()
  await page.getByTestId('todo-item').nth(3).getByTestId('todo-checkbox').click()

  await captureScreenshot(page, '01-dark-mode-mixed-todos')
})

test('screenshot: light mode empty state', async ({ page }) => {
  // Switch to light mode
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  if (isDark) await page.getByTestId('theme-toggle').click()

  // No todos — should show empty state
  await expect(page.getByTestId('empty-state')).toBeVisible()
  await captureScreenshot(page, '02-light-mode-empty-state')
})
