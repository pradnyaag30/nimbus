'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

// TODO: Replace with real data
const data = [
  { name: 'AWS', value: 20800, color: 'hsl(25, 95%, 53%)' },
  { name: 'Azure', value: 14200, color: 'hsl(210, 100%, 50%)' },
  { name: 'GCP', value: 9600, color: 'hsl(142, 76%, 36%)' },
  { name: 'Kubernetes', value: 3200, color: 'hsl(280, 67%, 55%)' },
];

const total = data.reduce((sum, item) => sum + item.value, 0);

export function CostByProviderChart() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold">Cost by Provider</h3>
        <p className="text-sm text-muted-foreground">Current month distribution</p>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
              <span className="font-medium">{formatCurrency(item.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
