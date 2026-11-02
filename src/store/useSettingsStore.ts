import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../lib/types'

export type Theme = 'light' | 'dark'
export type DrawerTab = 'texts' | 'stats'

export interface SettingsState {
  theme: Theme
  showStats: boolean
  /** Keystroke / block-complete sound effects. Off by default (quiet environments). */
  soundEnabled: boolean
  /** Language of the built-in sample used when no custom text is active. */
  language: Language
  /** Selected `customTexts` id, or null → fall back to the built-in sample. */
  activeTextId: number | null
  /** UI only (not persisted): open drawer tab, or null when closed. */
  drawerTab: DrawerTab | null

  toggleTheme: () => void
  toggleStats: () => void
  toggleSound: () => void
  /** Switch to the built-in sample for `language` (clears any custom text). */
  selectBuiltin: (language: Language) => void
  selectCustomText: (id: number) => void
  clearActiveText: () => void
  openDrawer: (tab: DrawerTab) => void
  closeDrawer: () => void
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
      soundEnabled: false,
      language: 'th',
      activeTextId: null,
      drawerTab: null,

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleStats: () => set((s) => ({ showStats: !s.showStats })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      selectBuiltin: (language) => set({ language, activeTextId: null }),
      selectCustomText: (id) => set({ activeTextId: id }),
      clearActiveText: () => set({ activeTextId: null }),
      openDrawer: (drawerTab) => set({ drawerTab }),
      closeDrawer: () => set({ drawerTab: null }),
    }),
    {
      name: 'typing-practice-settings',
      partialize: ({ theme, showStats, soundEnabled, language, activeTextId }) => ({
        theme,
        showStats,
        soundEnabled,
        language,
        activeTextId,
      }),
    },
  ),
)
