'use client'

interface CircularScoreProps {
  score: number
  size?: number
  label?: string
  sublabel?: string
}

export function CircularScore({ score, size = 160, label, sublabel }: CircularScoreProps) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#10B981' : score >= 60 ? '#7C3AED' : score >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EDE9FE"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-500">%</span>
        </div>
      </div>
      {label && <p className="mt-3 text-sm font-semibold text-gray-900">{label}</p>}
      {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
    </div>
  )
}

function matchLabel(score: number): string {
  if (score >= 75) return 'Strong Match'
  if (score >= 50) return 'Medium Match'
  return 'Weak Match'
}

export function MatchStatusBadge({ score }: { score: number }) {
  const label = matchLabel(score)
  const cls =
    score >= 75
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : score >= 50
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-600 border-red-200'
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}>{label}</span>
  )
}
