interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function ScoreRing({ score, size = 64, strokeWidth = 5, showLabel = true }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 85) return '#06D6A0';
    if (s >= 70) return '#F59E0B';
    if (s >= 50) return '#F97316';
    return '#EF4444';
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-circle"
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      {showLabel && (
        <span className="absolute font-display font-bold text-surface-100" style={{ fontSize: size * 0.25 }}>
          {score}
        </span>
      )}
    </div>
  );
}
