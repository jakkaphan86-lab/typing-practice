/** Small transient notice, positioned at the bottom of the nearest positioned ancestor. */
export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
    >
      {message}
    </div>
  )
}
