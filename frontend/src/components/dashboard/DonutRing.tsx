export interface DonutSegment {
  label: string;
  value: number;
  cssColor: string;
}

interface DonutRingProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}

export function DonutRing({ segments, size = 120, strokeWidth = 8, centerLabel }: DonutRingProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const arcs = segments
    .filter(seg => seg.value > 0)
    .map(seg => {
      const ratio = total > 0 ? seg.value / total : 0;
      const dashLength = circumference * ratio;
      const dashOffset = circumference * (1 - accumulated / total) + circumference * 0.25;
      accumulated += seg.value;
      return { ...seg, dashLength, dashOffset, ratio };
    });

  return (
    <div>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="block mx-auto"
      >
        {/* Background ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--color-bg-tertiary)"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={arc.cssColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 300ms, stroke-dashoffset 300ms' }}
          />
        ))}
        {/* Center text */}
        {centerLabel && (
          <text
            x="50" y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-text-primary)"
            fontSize="16"
            fontFamily="var(--font-mono)"
            fontWeight="500"
          >
            {centerLabel}
          </text>
        )}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        {segments.filter(s => s.value > 0 || segments.length <= 5).map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 shrink-0"
              style={{ backgroundColor: seg.cssColor }}
            />
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">
              {seg.label}
            </span>
            <span className="text-[9px] font-mono text-text-tertiary">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
