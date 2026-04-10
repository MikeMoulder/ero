interface BarItem {
  label: string;
  sublabel?: string;
  value: number;
  formattedValue: string;
}

interface HorizontalBarListProps {
  items: BarItem[];
  maxItems?: number;
  emptyText?: string;
}

export function HorizontalBarList({ items, maxItems = 5, emptyText = 'No data' }: HorizontalBarListProps) {
  const visible = items.slice(0, maxItems);
  const maxValue = Math.max(...visible.map(i => i.value), 1);

  if (visible.length === 0) {
    return <p className="text-text-tertiary text-[10px] font-mono text-center py-4">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {visible.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-text-tertiary w-3 shrink-0 text-right">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <div className="min-w-0">
                <span className="text-xs font-mono text-text-primary truncate block">{item.label}</span>
                {item.sublabel && (
                  <span className="text-[9px] font-mono text-text-tertiary">{item.sublabel}</span>
                )}
              </div>
              <span className="text-[10px] font-mono text-accent shrink-0 ml-2">{item.formattedValue}</span>
            </div>
            <div className="h-1 bg-accent/10 w-full">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
