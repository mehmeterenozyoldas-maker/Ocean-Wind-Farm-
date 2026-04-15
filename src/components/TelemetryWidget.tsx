import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface TelemetryWidgetProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'nominal' | 'warning' | 'critical' | 'offline';
  className?: string;
}

export default function TelemetryWidget({
  label,
  value,
  unit,
  status = 'nominal',
  className,
}: TelemetryWidgetProps) {
  const statusColors = {
    nominal: 'text-ob-safe border-ob-safe/20',
    warning: 'text-ob-alert border-ob-alert/20',
    critical: 'text-ob-critical border-ob-critical/20',
    offline: 'text-ob-muted border-ob-muted/20',
  };

  const statusBg = {
    nominal: 'bg-ob-safe/10',
    warning: 'bg-ob-alert/10',
    critical: 'bg-ob-critical/10',
    offline: 'bg-ob-muted/10',
  };

  return (
    <div className={cn(
      "flex flex-col p-3 rounded-lg border bg-ob-surface border-ob-border backdrop-blur-md",
      className
    )}>
      <span className="text-[10px] font-sans text-ob-muted uppercase tracking-wider mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-xl font-mono font-medium",
          status === 'nominal' ? 'text-ob-text' : statusColors[status].split(' ')[0]
        )}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-ob-muted">
            {unit}
          </span>
        )}
      </div>
      {status !== 'nominal' && (
        <div className={cn(
          "mt-2 text-[9px] font-sans uppercase tracking-widest px-1.5 py-0.5 rounded-sm w-fit",
          statusBg[status],
          statusColors[status].split(' ')[0]
        )}>
          {status}
        </div>
      )}
    </div>
  );
}
