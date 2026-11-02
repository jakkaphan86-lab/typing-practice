import { useEffect } from 'react'
import { Header } from './components/Header'
import { AppDrawer } from './components/AppDrawer'
import { TypingArea } from './components/TypingArea'
import { useSettingsStore } from './store/useSettingsStore'

export default function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-200">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 pb-24 sm:px-6">
        <TypingArea />
      </main>

      <footer className="pb-6 text-center text-xs text-slate-400 dark:text-slate-600">
        <kbd className="font-sans">esc</kbd> restart · <kbd className="font-sans">ctrl</kbd> +{' '}
        <kbd className="font-sans">backspace</kbd> delete word
      </footer>

      <AppDrawer />
    </div>
  )
}
