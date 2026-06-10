import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function KPICard({ title, value, subtitle, icon, color = 'blue' }: Props) {
  const bgColors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    slate: 'from-slate-600 to-slate-700',
  };

  return (
    <div className={`bg-gradient-to-br ${bgColors[color] || bgColors.blue} rounded-xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-white/50">{icon}</div>}
      </div>
    </div>
  );
}
