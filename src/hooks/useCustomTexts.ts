import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CustomText } from '../lib/db'

/**
 * All saved custom texts, newest first (live). Undefined while loading;
 * an empty list if IndexedDB is unavailable.
 */
export function useCustomTexts(): CustomText[] | undefined {
  return useLiveQuery(
    () =>
      db.customTexts
        .orderBy('createdAt')
        .reverse()
        .toArray()
        .catch((): CustomText[] => []),
    [],
  )
}
