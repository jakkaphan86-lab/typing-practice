import { useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

/** Mirror the theme setting onto <html> (Tailwind's `dark` class + native color-scheme). */
export function useApplyTheme() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])
}
