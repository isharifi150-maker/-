interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, max = 100, label, showValue = true, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClass = { sm: 'h-2', md: 'h-3', lg: 'h-4' }[size];

  const colorClass =
    percentage >= 75 ? 'from-success-500 to-success-400' :
    percentage >= 50 ? 'from-primary-500 to-primary-400' :
    percentage >= 25 ? 'from-accent-500 to-accent-400' :
    'from-error-500 to-error-400';

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
          {showValue && (
            <span className="text-sm font-bold text-neutral-800">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-neutral-200 ${sizeClass}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-l transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
