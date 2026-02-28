import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'
type Filter = 'all' | 'active' | 'completed'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEYS = {
  items: 'darktodo_items',
  theme: 'darktodo_theme',
} as const

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.items)
    if (!raw) return []
    return JSON.parse(raw) as TodoItem[]
  } catch (err) {
    console.error('Failed to load todos from localStorage', err)
    return []
  }
}

function saveTodos(todos: TodoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage', err)
  }
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.theme)
    if (raw === 'light' || raw === 'dark') return raw
    return 'dark'
  } catch (err) {
    console.error('Failed to load theme from localStorage', err)
    return 'dark'
  }
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme)
  } catch (err) {
    console.error('Failed to save theme to localStorage', err)
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      className="w-3.5 h-3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos)
  const [filter, setFilter] = useState<Filter>('all')
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [inputText, setInputText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    saveTheme(theme)
  }, [theme])

  // Persist todos
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const addTodo = useCallback(() => {
    const text = inputText.trim()
    if (!text) return
    const newTodo: TodoItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [...prev, newTodo])
    setInputText('')
    inputRef.current?.focus()
  }, [inputText])

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    )
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo()
  }

  // Derived
  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-[#121212] text-white'
        : 'bg-[#f9f9f9] text-gray-900'
    }`}>
      <div className="mx-auto max-w-[600px] px-4 py-12">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-widest uppercase text-[#6c63ff]">
            DarkTodo
          </h1>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            data-testid="theme-toggle"
            className={`p-2 rounded-full transition-colors duration-200 ${
              theme === 'dark'
                ? 'text-yellow-300 hover:bg-white/10'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* ── Input ─────────────────────────────────────────────────────────── */}
        <div className={`flex gap-2 mb-6 rounded-xl p-1 ${
          theme === 'dark' ? 'bg-[#1e1e2e]' : 'bg-white shadow-sm border border-gray-200'
        }`}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            data-testid="todo-input"
            className={`flex-1 px-4 py-3 bg-transparent outline-none text-base placeholder:opacity-40 ${
              theme === 'dark' ? 'text-white placeholder-white' : 'text-gray-900'
            }`}
          />
          <button
            onClick={addTodo}
            data-testid="add-button"
            className="px-5 py-2 rounded-lg bg-[#6c63ff] hover:bg-[#5a52e0] text-white font-semibold text-sm transition-colors duration-150 active:scale-95"
          >
            Add
          </button>
        </div>

        {/* ── Todo List ─────────────────────────────────────────────────────── */}
        <div className={`rounded-xl overflow-hidden ${
          theme === 'dark' ? 'bg-[#1e1e2e]' : 'bg-white shadow-sm border border-gray-200'
        }`}>
          {filteredTodos.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="empty-state">
              <span className="text-4xl mb-4">✨</span>
              <p className={`text-center text-base font-medium ${
                theme === 'dark' ? 'text-white/40' : 'text-gray-400'
              }`}>
                {filter === 'all'
                  ? 'No tasks yet. Add one above!'
                  : filter === 'active'
                  ? 'No active tasks — you\'re all caught up!'
                  : 'No completed tasks yet. Keep going!'}
              </p>
            </div>
          ) : (
            <ul data-testid="todo-list">
              {filteredTodos.map((todo, index) => (
                <li
                  key={todo.id}
                  data-testid="todo-item"
                  className={`flex items-center gap-3 px-4 py-4 group transition-colors duration-150 ${
                    index < filteredTodos.length - 1
                      ? theme === 'dark'
                        ? 'border-b border-white/5'
                        : 'border-b border-gray-100'
                      : ''
                  } ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    data-testid="todo-checkbox"
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      todo.completed
                        ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                        : theme === 'dark'
                          ? 'border-white/30 hover:border-[#6c63ff]'
                          : 'border-gray-300 hover:border-[#6c63ff]'
                    }`}
                  >
                    {todo.completed && <CheckIcon />}
                  </button>

                  {/* Text */}
                  <span
                    data-testid="todo-text"
                    className={`flex-1 text-base transition-all duration-200 ${
                      todo.completed
                        ? theme === 'dark'
                          ? 'line-through text-white/35'
                          : 'line-through text-gray-400'
                        : ''
                    }`}
                  >
                    {todo.text}
                  </span>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    aria-label="Delete todo"
                    data-testid="delete-button"
                    className={`flex-shrink-0 p-1 rounded transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                      theme === 'dark'
                        ? 'text-white/40 hover:text-red-400 hover:bg-red-400/10'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <XIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          {todos.length > 0 && (
            <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs ${
              theme === 'dark'
                ? 'border-t border-white/5 text-white/40'
                : 'border-t border-gray-100 text-gray-400'
            }`}>
              {/* Item count */}
              <span data-testid="item-count">
                {activeCount} {activeCount === 1 ? 'item' : 'items'} left
              </span>

              {/* Filter tabs */}
              <nav className="flex gap-1" aria-label="Filter todos">
                {(['all', 'active', 'completed'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    data-testid={`filter-${f}`}
                    className={`px-3 py-1 rounded-md capitalize transition-colors duration-150 ${
                      filter === f
                        ? 'bg-[#6c63ff] text-white font-semibold'
                        : theme === 'dark'
                          ? 'hover:text-white/70'
                          : 'hover:text-gray-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </nav>

              {/* Clear completed */}
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  data-testid="clear-completed"
                  className={`transition-colors duration-150 hover:text-red-400`}
                >
                  Clear Completed
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
