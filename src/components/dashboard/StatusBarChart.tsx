"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface StatusBarDatum {
  label: string;
  value: number;
}

const BAR_COLOR = "var(--fill-accent)";

export function StatusBarChart({
  title,
  subtitle,
  data,
  emptyLabel = "No data yet",
}: {
  title: string;
  subtitle?: string;
  data: StatusBarDatum[];
  emptyLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <div className="mb-4">
        <h3 className="text-[13px] font-medium text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)]">{subtitle}</p>}
      </div>

      {total === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-[12.5px] text-[var(--text-muted)]">
          {emptyLabel}
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "var(--fill-control)" }}
                contentStyle={{
                  background: "var(--surface-0)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--text-primary)",
                }}
              />
              <Bar dataKey="value" fill={BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
