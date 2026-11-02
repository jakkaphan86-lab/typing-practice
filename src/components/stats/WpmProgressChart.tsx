import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ProgressPoint } from '../../hooks/useAnalytics'
import { useSettingsStore, type Theme } from '../../store/useSettingsStore'
import { dateTimeFormat, shortDateFormat } from '../../utils/format'

/**
 * SVG attributes can't use Tailwind classes, so the chart picks Tailwind
 * palette values for the active theme (same source of truth as the `dark` class).
 */
const PALETTE: Record<Theme, { line: string; dot: string; grid: string; axis: string; avg: string }> = {
  light: { line: '#d97706', dot: '#ffffff', grid: '#e2e8f0', axis: '#94a3b8', avg: '#94a3b8' }, // amber-600, slate-200/400
  dark: { line: '#fbbf24', dot: '#020617', grid: '#1e293b', axis: '#64748b', avg: '#64748b' }, // amber-400, slate-950/800/500
}

/** Round Y-axis steps (5, 10, 20, 25, 50, 100…) with ~4 intervals. */
function niceTicks(max: number): number[] {
  const raw = Math.max(max, 10) / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
}

interface WpmProgressChartProps {
  data: readonly ProgressPoint[]
  /** Global average WPM, drawn as a dashed reference line. */
  average: number
}

/** WPM per session over time. X = session (labelled by date), Y = WPM. */
export default function WpmProgressChart({ data, average }: WpmProgressChartProps) {
  const theme = useSettingsStore((s) => s.theme)
  const c = PALETTE[theme]
  const byDate = new Map(data.map((d) => [d.session, d.timestamp]))
  const yTicks = niceTicks(Math.max(average, ...data.map((d) => d.wpm)))
  const yMax = yTicks.at(-1) ?? 0
  // Fit the widest tick label (~7px per digit at 11px) so labels never clip.
  const yAxisWidth = 14 + 7 * String(yMax).length

  return (
    <div
      role="img"
      aria-label={`WPM over the last ${data.length} sessions, from ${data[0]?.wpm} to ${data.at(-1)?.wpm} WPM`}
      className="h-44 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="session"
            type="number"
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
            tickFormatter={(s: number) => {
              const t = byDate.get(s)
              return t ? shortDateFormat.format(t) : ''
            }}
            tick={{ fill: c.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: c.grid }}
            minTickGap={24}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            dataKey="wpm"
            allowDecimals={false}
            ticks={yTicks}
            domain={[0, yMax]}
            tick={{ fill: c.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
          />
          <ReferenceLine y={average} stroke={c.avg} strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload }) => (
              <ChartTooltip active={active} point={payload?.[0]?.payload as ProgressPoint | undefined} />
            )}
            cursor={{ stroke: c.grid, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            stroke={c.line}
            strokeWidth={2}
            dot={{ r: 3, fill: c.dot, stroke: c.line, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: c.line, stroke: c.dot, strokeWidth: 2 }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Tooltip is plain DOM, so Tailwind's dark: variants apply directly. */
function ChartTooltip({ active, point }: { active?: boolean; point?: ProgressPoint }) {
  if (!active || !point) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 text-slate-500 dark:text-slate-400">
        Session {point.session} · {dateTimeFormat.format(point.timestamp)}
      </p>
      <p className="font-medium text-slate-800 dark:text-slate-100">
        <span className="tabular-nums text-amber-600 dark:text-amber-400">{point.wpm}</span> wpm
        <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
        <span className="tabular-nums">{Math.floor(point.accuracy)}%</span> acc
      </p>
    </div>
  )
}
