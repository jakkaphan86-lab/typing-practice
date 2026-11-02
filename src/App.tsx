import { AppDrawer } from './components/drawer/AppDrawer'
import { Header } from './components/layout/Header'
import { KeyboardHints } from './components/layout/KeyboardHints'
import { TypingArea } from './components/typing/TypingArea'
import { useApplyTheme } from './hooks/useApplyTheme'

export default function App() {
  useApplyTheme()

  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-200">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 pb-24 sm:px-6">
        <TypingArea />
      </main>
      <KeyboardHints />
      <AppDrawer />
    </div>
  )
}
