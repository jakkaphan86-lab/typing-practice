import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type Language = 'th' | 'en'

interface SettingsState {
  theme: Theme
  showStats: boolean
  language: Language
  toggleTheme: () => void
  toggleStats: () => void
  setLanguage: (language: Language) => void
}

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      showStats: true,
      language: 'th',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleStats: () => set((s) => ({ showStats: !s.showStats })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'typing-practice-settings',
      partialize: ({ theme, showStats, language }) => ({ theme, showStats, language }),
    },
  ),
)
