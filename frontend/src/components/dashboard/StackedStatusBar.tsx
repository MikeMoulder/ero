interface StatusSegment {
  label: string;
  value: number;
  cssColor: string;
}

interface StackedStatusBarProps {
  segments: StatusSegment[];
  showLegend?: boolean;
}

export function StackedStatusBar({ segments, showLegend = true }: StackedStatusBarProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const nonZero = segments.filter(s => s.value > 0);

  if (total === 0) {
    return (
      <div>
        <div className="h-1.5 bg-bg-tertiary w-full" />
        {showLegend && (
          <p className="text-[9px] font-mono text-text-tertiary mt-2 text-center">No data</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="h-1.5 flex w-full overflow-hidden">
        {nonZero.map((seg, i) => (
          <div
            key={i}
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.max((seg.value / total) * 100, 1)}%`,
              backgroundColor: seg.cssColor,
            }}
          />
        ))}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: seg.cssColor }} />
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">
                {seg.label}
              </span>
              <span className="text-[9px] font-mono text-text-tertiary">{seg.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
