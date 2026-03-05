/**
 * Circular SVG ring showing rating 0–10 with animated fill.
 */
export default function RatingRing({ rating, size = 56, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (rating / 10) * circumference;
  const offset = circumference - progress;

  const color =
    rating >= 7 ? "#22c55e" : rating >= 5 ? "#eab308" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="rating-ring" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Colored fill */}
        <circle
          className="fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold font-mono"
        style={{ color }}
      >
        {rating?.toFixed(1)}
      </span>
    </div>
  );
}
