import type { DrawerTab } from '../../store/useSettingsStore'

/** DOM ids linking each drawer tab to its panel (aria-controls / aria-labelledby). */
export const tabId = (tab: DrawerTab) => `tab-${tab}`
export const panelId = (tab: DrawerTab) => `panel-${tab}`
